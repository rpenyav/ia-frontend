// src/infrastructure/config/env.ts

const TOKEN_COOKIE_NAME = "ia_chat_access_token";

// Si quieres centralizar también la URL base de la API:
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export const getApiBaseUrl = (): string => API_BASE_URL;

const isBrowser = (): boolean => typeof document !== "undefined";

let memoryToken: string | null = null;

const readTokenFromCookie = (): string | null => {
  if (!isBrowser()) return memoryToken;

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${TOKEN_COOKIE_NAME}=([^;]*)`)
  );

  return match ? decodeURIComponent(match[1]) : null;
};

export const getAuthToken = (): string | null => {
  if (!isBrowser()) {
    return memoryToken;
  }
  return readTokenFromCookie();
};

export const setAuthToken = (token: string | null): void => {
  if (!isBrowser()) {
    memoryToken = token;
    return;
  }

  if (!token) {
    // Borramos la cookie
    document.cookie = `${TOKEN_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
    memoryToken = null;
    return;
  }

  // Ajusta Max-Age a lo que tenga tu JWT (aquí 1h)
  const maxAgeSeconds = 60 * 60;

  document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(
    token
  )}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`;

  memoryToken = token;
};
