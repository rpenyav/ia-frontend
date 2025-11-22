import type { ChatMessage } from "../../../interfaces";

export interface MessageHumanProps {
  message: ChatMessage;
}

export const MessageHuman = ({ message }: MessageHumanProps) => {
  return (
    <div className="ia-chatbot-message-row user">
      <div className="ia-chatbot-message-bubble user">{message.content}</div>
    </div>
  );
};
