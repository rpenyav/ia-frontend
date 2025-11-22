// src/adapters/http/ChatHttpRepository.ts

import type {
  ChatStreamChunk,
  SendMessageInput,
  ChatMessage,
} from "../../core/domain/chat/ChatMessage";
import type {
  ChatRepository,
  StreamCallback,
} from "../../core/domain/chat/ChatRepository";
import { fetchWithAuth } from "../../infrastructure/api/api";

const parseSseChunk = (raw: string): ChatStreamChunk | null => {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (const line of lines) {
    if (line.startsWith("data:")) {
      const dataStr = line.slice(5).trim();
      if (!dataStr || dataStr === "[DONE]") {
        return { delta: "", isFinal: true };
      }

      try {
        const parsed = JSON.parse(dataStr) as {
          delta?: string;
          conversationId?: string;
          isFinal?: boolean;
        };
        return {
          delta: parsed.delta ?? "",
          conversationId: parsed.conversationId,
          isFinal: parsed.isFinal ?? false,
        };
      } catch {
        return {
          delta: dataStr,
          isFinal: false,
        };
      }
    }
  }

  return null;
};

export class ChatHttpRepository implements ChatRepository {
  async sendMessageStream(
    input: SendMessageInput,
    onChunk: StreamCallback
  ): Promise<{ finalMessage: ChatMessage; conversationId?: string }> {
    const body = {
      conversationId: input.conversationId ?? null,
      message: input.message,
    };

    const response = await fetchWithAuth("/chat/message", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!response.body) {
      throw new Error(
        "La respuesta de /chat/message no tiene body de streaming."
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let accumulatedText = "";
    let conversationId: string | undefined = input.conversationId ?? undefined;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const event of events) {
        const chunk = parseSseChunk(event);
        if (!chunk) continue;

        if (chunk.conversationId) {
          conversationId = chunk.conversationId;
        }

        if (chunk.delta && chunk.delta.length > 0) {
          accumulatedText += chunk.delta;
          onChunk(chunk);
        }
      }
    }

    const now = new Date().toISOString();
    const finalMessage: ChatMessage = {
      id: `${now}-${Math.random().toString(36).slice(2)}`,
      role: "assistant",
      content: accumulatedText,
      createdAt: now,
      conversationId,
    };

    return { finalMessage, conversationId };
  }
}
