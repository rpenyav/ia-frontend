// src/adapters/ui/react/chat/Chatbot.tsx
import { useEffect, useRef, useState } from "react";

import { ConversationsList } from "./ConversationsList";
import { MessageHuman } from "./MessageHuman";
import { MessageBot } from "./MessageBot";
import { ChatInputArea } from "./ChatInputArea";
import { useChatContext } from "../../../infrastructure/contexts";
import { isAuthModeNone } from "../../../infrastructure/config/chatConfig";

const IS_EPHEMERAL = isAuthModeNone;

export const Chatbot = () => {
  const {
    conversations,
    selectedConversationId,
    messages,
    loadingConversations,
    isStreaming,
    error,
    selectConversation,
    sendMessage,
    createConversation,
    deleteConversation,
  } = useChatContext();

  const [input, setInput] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await sendMessage(text);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, isStreaming]);

  return (
    <div className="ia-chatbot-content">
      {!IS_EPHEMERAL && (
        <ConversationsList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          loading={loadingConversations}
          onChange={selectConversation}
          onCreateConversation={createConversation}
          onDeleteConversation={deleteConversation}
        />
      )}

      <div className="ia-chatbot-messages">
        {messages.map((msg) =>
          msg.role === "user" ? (
            <MessageHuman key={msg.id} message={msg} />
          ) : (
            <MessageBot key={msg.id} message={msg} isStreaming={isStreaming} />
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="ia-chatbot-error">{error}</div>}

      <ChatInputArea
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={isStreaming}
      />
    </div>
  );
};
