// src/adapters/ui/react/chat/ChatbotLayout.tsx
import {
  useEffect,
  useState,
  useRef,
  type ReactNode,
  type CSSProperties,
} from "react";
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
  currentLanguage?: string;
  onChangeLanguage?: (lang: string) => void;
  /** Slot opcional para mostrar algo inmediatamente bajo el header (p.ej. ChatUsageBadge) */
  usageBadgeSlot?: ReactNode;
}

const WIDGET_OPEN_STORAGE_KEY = "ia_chat_widget_open";

const getEnvChatbotOpenedFlag = (): boolean => {
  return import.meta.env.VITE_CHATBOT_OPENED === "true";
};

const getEnvCaptchaFlag = (): boolean => {
  return import.meta.env.VITE_CAPTCHA === "true";
};

/** Nuevo: flag de si el chatbot está restringido por tiempo/uso */
const getEnvChatbotRestrictedFlag = (): boolean => {
  return import.meta.env.VITE_CHATBOT_RESTRICTED === "true";
};

const ChatbotLayout = ({
  children,
  onLogout,
  showLogout,
  currentLanguage,
  onChangeLanguage,
  usageBadgeSlot,
}: ChatbotLayoutProps) => {
  const theme = getChatTheme();

  const [internalLanguage, setInternalLanguage] = useState<string>(() =>
    getInitialLanguage()
  );
  const effectiveLanguage = currentLanguage ?? internalLanguage;

  useEffect(() => {
    void i18n.changeLanguage(effectiveLanguage);
    persistLanguage(effectiveLanguage);
  }, [effectiveLanguage]);

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    const envOpened = getEnvChatbotOpenedFlag();

    if (typeof window === "undefined") {
      return envOpened;
    }

    const stored = window.localStorage.getItem(WIDGET_OPEN_STORAGE_KEY);

    if (stored === "true") return true;
    if (stored === "false") return false;
    if (envOpened) return true;

    return false;
  });

  const [showCaptchaLayer, setShowCaptchaLayer] = useState<boolean>(false);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [captchaLoading, setCaptchaLoading] = useState<boolean>(false);

  // contenedor donde pintaremos el widget
  const captchaContainerRef = useRef<HTMLDivElement | null>(null);
  // id del widget recaptcha (lo devuelve grecaptcha.render)
  const captchaWidgetIdRef = useRef<number | null>(null);

  const resetCaptcha = () => {
    if (typeof window !== "undefined") {
      const grecaptcha = (window as any).grecaptcha;
      if (
        grecaptcha &&
        typeof grecaptcha.reset === "function" &&
        captchaWidgetIdRef.current !== null
      ) {
        // Resetea el widget en Google
        grecaptcha.reset(captchaWidgetIdRef.current);
      }
    }
    // Olvidamos el id del widget para poder re-renderizarlo la próxima vez
    captchaWidgetIdRef.current = null;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(WIDGET_OPEN_STORAGE_KEY, String(isOpen));
  }, [isOpen]);

  // Cuando se muestra la capa, intentamos renderizar el captcha
  useEffect(() => {
    if (!showCaptchaLayer) return;

    const captchaEnabled = getEnvCaptchaFlag();
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as
      | string
      | undefined;

    if (!captchaEnabled || !siteKey) return;
    if (typeof window === "undefined") return;

    let cancelled = false;

    const tryRender = () => {
      if (cancelled) return;

      const grecaptcha = (window as any).grecaptcha;
      if (!grecaptcha || typeof grecaptcha.render !== "function") {
        // Script todavía no cargado, reintentamos en un momento
        setTimeout(tryRender, 300);
        return;
      }

      if (!captchaContainerRef.current) {
        setTimeout(tryRender, 300);
        return;
      }

      if (captchaWidgetIdRef.current !== null) {
        // ya renderizado
        return;
      }

      try {
        const widgetId = grecaptcha.render(captchaContainerRef.current, {
          sitekey: siteKey,
          callback: () => {
            setCaptchaError(null);
          },
          "expired-callback": () => {
            // Se ha caducado, obligamos a marcar de nuevo
            captchaWidgetIdRef.current = null;
          },
          "error-callback": () => {
            setCaptchaError(
              "Ha ocurrido un error al cargar el captcha. Por favor, recarga la página."
            );
          },
        });
        captchaWidgetIdRef.current = widgetId;
      } catch (err) {
        console.error("Error al renderizar reCAPTCHA", err);
        setCaptchaError(
          "No se pudo inicializar el captcha. Por favor, recarga la página."
        );
      }
    };

    tryRender();

    return () => {
      cancelled = true;
    };
  }, [showCaptchaLayer]);

  const handleOpenClick = () => {
    const envOpened = getEnvChatbotOpenedFlag();
    const captchaEnabled = getEnvCaptchaFlag();

    if (!envOpened && captchaEnabled) {
      setCaptchaError(null);
      setShowCaptchaLayer(true);
      return;
    }

    setIsOpen(true);
  };

  const handleMinimize = () => {
    setIsOpen(false);
  };

  const handleCaptchaCancel = () => {
    resetCaptcha();
    setShowCaptchaLayer(false);
  };

  const handleCaptchaConfirm = () => {
    const captchaEnabled = getEnvCaptchaFlag();

    if (!captchaEnabled) {
      setShowCaptchaLayer(false);
      setIsOpen(true);
      return;
    }

    if (typeof window === "undefined") {
      setShowCaptchaLayer(false);
      setIsOpen(true);
      return;
    }

    const grecaptcha = (window as any).grecaptcha;
    if (!grecaptcha || typeof grecaptcha.getResponse !== "function") {
      setCaptchaError(
        "No se pudo inicializar reCAPTCHA. Por favor, recarga la página."
      );
      return;
    }

    const widgetId =
      captchaWidgetIdRef.current !== null
        ? captchaWidgetIdRef.current
        : undefined;

    const response = grecaptcha.getResponse(widgetId);
    if (!response) {
      setCaptchaError(
        "Por favor marca la casilla 'No soy un robot' antes de continuar."
      );
      return;
    }

    setCaptchaLoading(true);
    setTimeout(() => {
      setCaptchaLoading(false);
      resetCaptcha();
      setShowCaptchaLayer(false);
      setIsOpen(true);
    }, 300);
  };

  const handleHeaderChangeLanguage = (lang: string) => {
    if (!currentLanguage) {
      setInternalLanguage(lang);
    }
    if (onChangeLanguage) {
      onChangeLanguage(lang);
    }
  };

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

  useEffect(() => {
    if (!showCaptchaLayer) {
      resetCaptcha();
    }
  }, [showCaptchaLayer]);

  const isRestricted = getEnvChatbotRestrictedFlag();

  return (
    <div className="ia-chatbot-root">
      {/* Burbuja flotante */}
      <div className="ia-chatbot-bubble-wrapper">
        {!isOpen && (
          <>
            <div className="ia-chatbot-bubble-tooltip">
              <span className="ia-chatbot-bubble-tooltip-text">
                Pruebe ahora el chatbot Neria
              </span>
            </div>

            <button
              type="button"
              className="ia-chatbot-bubble"
              onClick={handleOpenClick}
              aria-label="Abrir asistente de IA"
            >
              <span className="ia-chatbot-bubble-icon">{bubbleIcon}</span>
            </button>
          </>
        )}
      </div>

      {/* Capa CAPTCHA */}
      {showCaptchaLayer && (
        <div className="ia-chatbot-captcha-backdrop">
          <div className="ia-chatbot-captcha-dialog">
            <p className="ia-chatbot-captcha-title">
              Antes de continuar, verifica que no eres un bot.
            </p>

            <div className="ia-chatbot-captcha-widget">
              <div ref={captchaContainerRef} />
            </div>

            <p className="ia-chatbot-captcha-legal">
              Esta página está protegida por reCAPTCHA y se aplican la{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer"
              >
                Política de privacidad
              </a>{" "}
              y{" "}
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noreferrer"
              >
                las Condiciones del servicio
              </a>{" "}
              de Google.
            </p>

            {captchaError && (
              <p className="ia-chatbot-captcha-error">{captchaError}</p>
            )}

            <div className="ia-chatbot-captcha-actions">
              <button
                type="button"
                className="ia-chatbot-captcha-btn ia-chatbot-captcha-btn-cancel"
                onClick={handleCaptchaCancel}
                disabled={captchaLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="ia-chatbot-captcha-btn ia-chatbot-captcha-btn-confirm"
                onClick={handleCaptchaConfirm}
                disabled={captchaLoading}
              >
                {captchaLoading ? "Verificando..." : "Continuar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel del chat */}
      {isOpen && (
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

          {/* Slot opcional para el badge de uso – SOLO si el modo restringido está activo */}
          {isRestricted && usageBadgeSlot && (
            <div className="ia-chatbot-usage-wrapper">{usageBadgeSlot}</div>
          )}

          <div className="ia-chatbot-body">{children}</div>
        </div>
      )}
    </div>
  );
};

export default ChatbotLayout;
