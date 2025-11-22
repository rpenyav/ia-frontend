// src/core/domain/constants/apiEndpoints.ts
export const API_ENDPOINTS = {
  AUTH_LOGIN: "/auth/login",

  CONVERSATIONS: "/conversations",
  CONVERSATION_DETAIL: (id: string) => `/conversations/${id}`,

  CHAT_MESSAGE: "/chat/message",
  UPLOAD_SINGLE: "/uploads",
  UPLOAD_MULTIPLE: "/uploads/multiple",
} as const;
