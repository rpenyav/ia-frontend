// src/infrastructure/repositories/ChatRepository.ts

import { API_ENDPOINTS } from "../../core/domain/constants/apiEndpoints";
import type { ChatAttachment } from "../../interfaces";
import { fetchWithAuth } from "../api/api";

export interface SendMessagePayload {
  conversationId: string | null;
  message: string;
  attachments?: ChatAttachment[];
}

/**
 * Repositorio de chat con soporte streaming.
 *
 * Soporta varios formatos de evento:
 *  - { "delta": "texto", "conversationId": "..." }
 *  - { "content": "texto" }
 *  - { "message": "texto" }
 *  - { "delta": { "text": "texto" } }
 *  - { "delta": { "content": "texto" } }
 *  - { "choices": [ { "delta": { "content": "texto" } } ] }  (estilo OpenAI)
 *  - texto plano en una sola respuesta
 */
export class ChatRepository {
  async sendMessageStream(
    payload: SendMessagePayload,
    onDelta: (delta: string, newConversationId: string | null) => void
  ): Promise<{ conversationId: string | null }> {
    const response = await fetchWithAuth<Response>(API_ENDPOINTS.CHAT_MESSAGE, {
      method: "POST",
      body: JSON.stringify(payload),
      rawResponse: true, // 👈 importante: aquí queremos el Response crudo
    });

    if (!response.body) {
      throw new Error("La respuesta del servidor no soporta streaming.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";
    let conversationId: string | null = payload.conversationId ?? null;

    const processLine = (line: string) => {
      let text = line.trim();
      if (!text) return;

      // Soportamos SSE "data: {...}"
      if (text.startsWith("data:")) {
        text = text.slice(5).trim();
      }
      if (!text) return;

      // Ignoramos control tokens típicos
      if (text === "[DONE]") return;

      try {
        const parsed: any = JSON.parse(text);

        // Actualizamos conversationId si viene en el evento
        if (typeof parsed.conversationId === "string") {
          conversationId = parsed.conversationId;
        }

        let piece: string | undefined;

        // 1) delta como string directo
        if (typeof parsed.delta === "string") {
          piece = parsed.delta;
        }
        // 2) delta anidado: { delta: { text: "..." } }
        else if (parsed.delta && typeof parsed.delta.text === "string") {
          piece = parsed.delta.text;
        }
        // 3) delta anidado: { delta: { content: "..." } }
        else if (parsed.delta && typeof parsed.delta.content === "string") {
          piece = parsed.delta.content;
        }
        // 4) content directo
        else if (typeof parsed.content === "string") {
          piece = parsed.content;
        }
        // 5) message directo
        else if (typeof parsed.message === "string") {
          piece = parsed.message;
        }
        // 6) estilo OpenAI: { choices: [{ delta: { content: "..." } }] }
        else if (
          parsed.choices &&
          parsed.choices[0] &&
          typeof parsed.choices[0].delta?.content === "string"
        ) {
          piece = parsed.choices[0].delta.content;
        }

        if (typeof piece === "string" && piece.length > 0) {
          onDelta(piece, conversationId);
        }
      } catch {
        // No es JSON → lo tratamos como texto plano
        if (text.length > 0) {
          onDelta(text, conversationId);
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // 🔚 procesamos lo que quede en el buffer aunque no tenga '\n'
        const remaining = buffer.trim();
        if (remaining) {
          processLine(remaining);
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Procesamos línea a línea si llegan con '\n'
      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        processLine(line);
        newlineIndex = buffer.indexOf("\n");
      }
    }

    return { conversationId };
  }
}
