import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";

export interface ChatInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export const ChatInputArea = ({
  value,
  onChange,
  onSend,
  disabled,
}: ChatInputAreaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;

    // resetear primero para recalcular
    el.style.height = "auto";

    // crecer hasta su scrollHeight (el max-height lo controla el SCSS)
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!disabled && value.trim().length > 0) {
      onSend();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sin Shift → enviar
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim().length > 0) {
        onSend();
      }
    }
    // Shift+Enter → permitimos salto de línea normal
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // el useEffect se encargará de ajustar la altura al cambiar value
  };

  return (
    <form className="ia-chatbot-input-wrapper" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        className="ia-chatbot-textarea"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Escribe tu mensaje..."
        disabled={disabled}
        rows={1}
      />
      <button
        type="submit"
        disabled={disabled || value.trim().length === 0}
        className="ia-chatbot-send-button"
      >
        Enviar
      </button>
    </form>
  );
};
