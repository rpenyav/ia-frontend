// src/adapters/ui/react/chat/ChatbotHeader.tsx
import React, { useState } from "react";
import type { ChatTheme } from "../../../core/domain/constants/chatTheme";

export interface ChatbotHeaderProps {
  theme: ChatTheme;
  onToggleMinimize?: () => void;
  onLogout?: () => void;
  showLogout?: boolean;
  currentLanguage?: string; // p.ej. "es", "ca", "en"
  onChangeLanguage?: (lang: string) => void;
}

const LANGUAGE_OPTIONS: { code: string; label: string }[] = [
  { code: "es", label: "Español" },
  { code: "ca", label: "Català" },
  { code: "en", label: "English" },
];

const ChatbotHeader = ({
  theme,
  onToggleMinimize,
  onLogout,
  showLogout,
  currentLanguage = "es",
  onChangeLanguage,
}: ChatbotHeaderProps) => {
  const { header } = theme;
  const title = header.title;
  const subtitle = header.subtitle;
  const badgeText = header.badgeText;
  const logoEmoji = header.logoEmoji ?? "🤖";

  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleLanguageClick = (code: string) => {
    if (onChangeLanguage) {
      onChangeLanguage(code);
    }
    setMenuOpen(false);
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
    setMenuOpen(false);
  };

  const handleMinimizeClick = () => {
    setMenuOpen(false);
    if (onToggleMinimize) {
      onToggleMinimize();
    }
  };

  return (
    <header className="ia-chatbot-header">
      <div>
        <div className="ia-chatbot-header-title">
          <span className="ia-chatbot-header-logo">{logoEmoji}</span>
          {title}
        </div>
        <div className="ia-chatbot-header-subtitle">{subtitle}</div>
      </div>

      <div className="ia-chatbot-header-right">
        {badgeText && (
          <div className="ia-chatbot-header-badge">{badgeText}</div>
        )}

        {/* Botón de settings + dropdown */}
        <div className="ia-chatbot-header-actions">
          <button
            type="button"
            className="ia-chatbot-header-settings-button"
            onClick={toggleMenu}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            aria-label="Ajustes del asistente"
          >
            <span className="ia-chatbot-header-settings-icon">⚙️</span>
          </button>

          {onToggleMinimize && (
            <button
              type="button"
              className="ia-chatbot-minimize-button"
              onClick={handleMinimizeClick}
              aria-label="Minimizar asistente"
            >
              <span className="ia-chatbot-minimize-icon">—</span>
            </button>
          )}

          {menuOpen && (
            <div className="ia-chatbot-header-menu" role="menu">
              <div className="ia-chatbot-header-menu-section">
                <div className="ia-chatbot-header-menu-title">Idioma</div>
                <div className="ia-chatbot-header-menu-list">
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      className={
                        "ia-chatbot-header-menu-item" +
                        (currentLanguage === opt.code
                          ? " ia-chatbot-header-menu-item-active"
                          : "")
                      }
                      onClick={() => handleLanguageClick(opt.code)}
                      role="menuitemradio"
                      aria-checked={currentLanguage === opt.code}
                    >
                      <span className="ia-chatbot-header-menu-item-label">
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {showLogout && onLogout && (
                <>
                  <div className="ia-chatbot-header-menu-separator" />
                  <button
                    type="button"
                    className="ia-chatbot-header-menu-item ia-chatbot-header-menu-item-danger"
                    onClick={handleLogoutClick}
                    role="menuitem"
                  >
                    <span className="ia-chatbot-header-menu-item-label">
                      ⎋ Cerrar sesión
                    </span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ChatbotHeader;
