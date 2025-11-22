// src/adapters/ui/react/chat/MessageBot.tsx
import type { ChatMessage } from "../../../interfaces";

export interface MessageBotProps {
  message: ChatMessage;
  isStreaming: boolean;
}

export const MessageBot = ({ message, isStreaming }: MessageBotProps) => {
  const isEmpty = !message.content || message.content.trim().length === 0;

  return (
    <div className="ia-chatbot-message-row assistant">
      <div className="ia-chatbot-message-bubble assistant">
        {isEmpty && isStreaming ? (
          <span className="iachat-loading-dots">
            <span className="iachat-loading-dot" />
            <span className="iachat-loading-dot" />
            <span className="iachat-loading-dot" />
          </span>
        ) : (
          message.content
        )}
      </div>
    </div>
  );
};
