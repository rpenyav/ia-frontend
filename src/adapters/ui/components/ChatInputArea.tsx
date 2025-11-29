// src/adapters/ui/react/chat/ChatInputArea.tsx
import type { ChangeEvent, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import type { ChatAttachment } from "../../../interfaces";
import { IconClip, IconSend } from "./icons";

export interface ChatInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  attachments: ChatAttachment[];
  onOpenAttachmentsModal: () => void;
  onRemoveAttachment: (key: string) => void;
  isUploadingAttachments: boolean;
}

export const ChatInputArea = ({
  value,
  onChange,
  onSend,
  disabled,
  attachments,
  onOpenAttachmentsModal,
  onRemoveAttachment,
  isUploadingAttachments,
}: ChatInputAreaProps) => {
  const { t } = useTranslation("common");

  const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled) {
        onSend();
      }
    }
  };

  const handleClickSend = () => {
    if (!disabled) {
      onSend();
    }
  };

  const showAttachmentsRow = attachments.length > 0;

  return (
    <div className="ia-chatbot-input-wrapper">
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Chips de adjuntos pendientes */}
        {showAttachmentsRow && (
          <div className="ia-chatbot-attachments-row">
            {attachments.map((att) => (
              <div
                key={att.key ?? att.url}
                className="ia-chatbot-attachment-chip"
              >
                <span>📎 {att.filename}</span>
                <button
                  type="button"
                  className="ia-chatbot-attachment-chip-remove"
                  onClick={() => onRemoveAttachment(att.key ?? att.url)}
                  aria-label={t("chat_input_remove_attachment_aria", {
                    filename: att.filename,
                  })}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Caja de texto */}
        <textarea
          className="ia-chatbot-textarea"
          placeholder={t("chat_input_placeholder")}
          value={value}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
      </div>

      {/* Botón para abrir modal de adjuntos */}
      <button
        type="button"
        className="ia-chatbot-attach-button"
        onClick={onOpenAttachmentsModal}
        // disabled={disabled}
        disabled={true}
        title={t("chat_input_attach_title")}
      >
        <IconClip size={18} color={disabled ? "#999999" : "#555555"} />
        {isUploadingAttachments && (
          <span className="ia-chatbot-attach-badge">...</span>
        )}
      </button>

      {/* Botón enviar */}
      <button
        type="button"
        className="ia-chatbot-send-button"
        onClick={handleClickSend}
        disabled={disabled}
      >
        <IconSend size={18} color={disabled ? "#ffffff" : "#ffffff"} />
      </button>
    </div>
  );
};
