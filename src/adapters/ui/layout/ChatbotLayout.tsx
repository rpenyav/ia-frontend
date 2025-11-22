// src/adapters/ui/react/chat/ChatbotLayout.tsx
import { useEffect, useState, type ReactNode, type CSSProperties } from "react";
import ChatbotHeader from "./ChatbotHeader";
import { getChatTheme } from "../../../core/domain/constants/chatTheme";
import i18n from "../../../infrastructure/i18n";
import {
  getInitialLanguage,
  persistLanguage,
} from "../../../infrastructure/i18n/langs";

export interface ChatbotLayoutProps {
  children: ReactNode;
  onLogout?: () => void;
  showLogout?: boolean;
  /**
   * Idioma actual controlado desde fuera (opcional).
   * Si no se informa, el layout usa su propio estado interno + localStorage.
   */
  currentLanguage?: string;
  /**
   * Callback opcional para informar al host de cambios de idioma.
   */
  onChangeLanguage?: (lang: string) => void;
}

const WIDGET_OPEN_STORAGE_KEY = "ia_chat_widget_open";

const ChatbotLayout = ({
  children,
  onLogout,
  showLogout,
  currentLanguage,
  onChangeLanguage,
}: ChatbotLayoutProps) => {
  const theme = getChatTheme();

  // Estado interno de idioma (solo se usa si NO hay currentLanguage controlado)
  const [internalLanguage, setInternalLanguage] = useState<string>(() =>
    getInitialLanguage()
  );

  // Idioma efectivo: si el host pasa currentLanguage, mandamos ese;
  // si no, usamos el interno.
  const effectiveLanguage = currentLanguage ?? internalLanguage;

  // Sincronizamos i18n cada vez que cambie el idioma efectivo
  useEffect(() => {
    void i18n.changeLanguage(effectiveLanguage);
    // también persistimos siempre el efectivo (sea interno o externo)
    persistLanguage(effectiveLanguage);
  }, [effectiveLanguage]);

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem(WIDGET_OPEN_STORAGE_KEY);
    if (stored === "true") return true;
    if (stored === "false") return false;
    // Por defecto, burbuja cerrada
    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(WIDGET_OPEN_STORAGE_KEY, String(isOpen));
  }, [isOpen]);

  const handleOpen = () => setIsOpen(true);
  const handleMinimize = () => setIsOpen(false);

  // Handler cuando el header cambia el idioma
  const handleHeaderChangeLanguage = (lang: string) => {
    // Si NO hay idioma controlado desde fuera, actualizamos el interno
    if (!currentLanguage) {
      setInternalLanguage(lang);
    }

    // Informamos al host si lo desea
    if (onChangeLanguage) {
      onChangeLanguage(lang);
    }

    // i18n + persistencia ya se sincronizan por el useEffect(effectiveLanguage)
    // porque effectiveLanguage cambia cuando internalLanguage o currentLanguage cambian.
  };

  // CSS custom properties derivadas del theme
  const cssVars: CSSProperties = {
    "--ia-header-bg-from": theme.colors.headerBgFrom,
    "--ia-header-bg-to": theme.colors.headerBgTo,
    "--ia-header-text": theme.colors.headerText,
    "--ia-body-bg": theme.colors.bodyBg,
    "--ia-toolbar-bg": theme.colors.toolbarBg,
    "--ia-input-bg": theme.colors.inputBg,
    "--ia-user-bubble-bg": theme.colors.userBubbleBg,
    "--ia-user-bubble-text": theme.colors.userBubbleText,
    "--ia-bot-bubble-bg": theme.colors.botBubbleBg,
    "--ia-bot-bubble-text": theme.colors.botBubbleText,
  } as CSSProperties;

  const bubbleIcon = theme.widget.bubbleEmoji ?? "💬";

  return (
    <>
      {/* Burbuja flotante cuando está minimizado */}
      {!isOpen && (
        <button
          type="button"
          className="ia-chatbot-bubble"
          onClick={handleOpen}
          aria-label="Abrir asistente de IA"
        >
          <span className="ia-chatbot-bubble-icon">{bubbleIcon}</span>
        </button>
      )}

      {/* Panel del chat cuando está abierto */}
      {isOpen && (
        <div className="ia-chatbot-root">
          <div
            className="ia-chatbot-panel"
            style={{
              ...cssVars,
              width: theme.panel.width,
              height: theme.panel.height,
              borderRadius: theme.panel.borderRadius,
              boxShadow: theme.panel.shadow,
            }}
          >
            <ChatbotHeader
              theme={theme}
              onToggleMinimize={handleMinimize}
              onLogout={onLogout}
              showLogout={showLogout}
              currentLanguage={effectiveLanguage}
              onChangeLanguage={handleHeaderChangeLanguage}
            />
            <div className="ia-chatbot-body">{children}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotLayout;
