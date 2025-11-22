// src/adapters/ui/react/chat/ChatbotHeader.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ChatTheme } from "../../../core/domain/constants/chatTheme";
import { IconCog } from "../components/icons";
import {
  LANGUAGE_OPTIONS,
  DEFAULT_LANG,
} from "../../../infrastructure/i18n/langs";

export interface ChatbotHeaderProps {
  theme: ChatTheme;
  onToggleMinimize?: () => void;
  onLogout?: () => void;
  showLogout?: boolean;
  currentLanguage?: string; // p.ej. "es", "ca", "en", etc.
  onChangeLanguage?: (lang: string) => void;
}

const ChatbotHeader = ({
  theme,
  onToggleMinimize,
  onLogout,
  showLogout,
  currentLanguage = DEFAULT_LANG,
  onChangeLanguage,
}: ChatbotHeaderProps) => {
  const { t } = useTranslation("common");

  const {
    header: {
      title,
      titleKey,
      subtitle,
      subtitleKey,
      badgeText,
      badgeTextKey,
      logoEmoji,
    },
  } = theme;

  // Resolvemos textos usando i18n si hay key; si no, fallback al literal
  const resolvedTitle = titleKey ? t(titleKey, { defaultValue: title }) : title;
  const resolvedSubtitle = subtitleKey
    ? t(subtitleKey, { defaultValue: subtitle })
    : subtitle;

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
      <div className="ia-chatbot-header-left">
        <div className="ia-chatbot-header-title">
          <span className="ia-chatbot-header-logo">{logoEmoji ?? "🤖"}</span>
          {resolvedTitle}
        </div>
        <div className="ia-chatbot-header-subtitle">{resolvedSubtitle}</div>
      </div>

      <div className="ia-chatbot-header-right">
        <div className="ia-chatbot-header-actions">
          <button
            type="button"
            className="ia-chatbot-header-settings-button"
            onClick={toggleMenu}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            aria-label={t("chat_header_settings_aria")}
          >
            <span className="ia-chatbot-header-settings-icon">
              <IconCog size={16} />
            </span>
          </button>

          {onToggleMinimize && (
            <button
              type="button"
              className="ia-chatbot-header-settings-button"
              onClick={handleMinimizeClick}
              aria-label={t("chat_header_minimize_aria")}
            >
              <span className="ia-chatbot-header-settings-icon">—</span>
            </button>
          )}

          {menuOpen && (
            <div className="ia-chatbot-header-menu" role="menu">
              <div className="ia-chatbot-header-menu-section">
                <div className="ia-chatbot-header-menu-title">
                  {t("chat_menu_language_title")}
                </div>
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
                      ⎋ {t("chat_menu_logout_label")}
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
