// src/core/domain/constants/chatTheme.ts

export interface ChatTheme {
  panel: {
    /** Puede ser número (px) o string tipo "420px" / "100%" */
    width: number | string;
    height: number | string;
    borderRadius: number;
    shadow: string;
  };
  colors: {
    headerBgFrom: string;
    headerBgTo: string;
    headerText: string;

    bodyBg: string;
    toolbarBg: string;
    inputBg: string;

    userBubbleBg: string;
    userBubbleText: string;

    botBubbleBg: string;
    botBubbleText: string;
  };
  header: {
    title: string;
    subtitle: string;
    badgeText?: string;
    /** Emoji o texto corto a modo de “logo” */
    logoEmoji?: string;
  };
  widget: {
    /** Emoji/icono de la burbuja flotante */
    bubbleEmoji?: string;
  };
}

export const DEFAULT_CHAT_THEME: ChatTheme = {
  panel: {
    width: 420,
    height: 720,
    borderRadius: 16,
    shadow: "0 18px 45px rgba(15, 23, 42, 0.45)",
  },
  colors: {
    headerBgFrom: "rgba(37, 99, 235, 0.96)",
    headerBgTo: "rgba(56, 189, 248, 0.96)",
    headerText: "#ffffff",

    bodyBg: "#f9fafb",
    toolbarBg: "#f3f4f6",
    inputBg: "#ffffff",

    userBubbleBg: "#2563eb",
    userBubbleText: "#ffffff",

    botBubbleBg: "#ffffff",
    botBubbleText: "#111827",
  },
  header: {
    title: "IA Empresas",
    subtitle: "Asistente inteligente para tu web",
    badgeText: "Beta",
    logoEmoji: "🤖",
  },
  widget: {
    bubbleEmoji: "💬",
  },
};

// Permite que el integrador defina window.IA_CHAT_WIDGET_THEME
declare global {
  interface Window {
    IA_CHAT_WIDGET_THEME?: Partial<ChatTheme>;
  }
}

const mergeTheme = (
  base: ChatTheme,
  overrides?: Partial<ChatTheme>
): ChatTheme => {
  if (!overrides) return base;

  return {
    ...base,
    ...overrides,
    panel: {
      ...base.panel,
      ...(overrides.panel ?? {}),
    },
    colors: {
      ...base.colors,
      ...(overrides.colors ?? {}),
    },
    header: {
      ...base.header,
      ...(overrides.header ?? {}),
    },
    widget: {
      ...base.widget,
      ...(overrides.widget ?? {}),
    },
  };
};

export const getChatTheme = (): ChatTheme => {
  if (typeof window === "undefined") {
    return DEFAULT_CHAT_THEME;
  }
  return mergeTheme(DEFAULT_CHAT_THEME, window.IA_CHAT_WIDGET_THEME);
};
