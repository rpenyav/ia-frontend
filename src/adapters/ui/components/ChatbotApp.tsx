// src/adapters/ui/react/chat/ChatbotApp.tsx

import { Chatbot } from "./Chatbot";
import {
  AuthProvider,
  useAuthContext,
  ChatProvider,
} from "../../../infrastructure/contexts";

import {
  CHAT_AUTH_MODE,
  isAuthModeNone,
} from "../../../infrastructure/config/chatConfig";
import { ChatbotLayout } from "../layout";
import { LoginForm } from "./LoginForm";

const ChatWithAuth = () => {
  const { token, logout } = useAuthContext();

  if (!token) {
    return (
      <ChatbotLayout>
        <LoginForm />
      </ChatbotLayout>
    );
  }

  return (
    <ChatProvider>
      <ChatbotLayout onLogout={logout} showLogout>
        <Chatbot />
      </ChatbotLayout>
    </ChatProvider>
  );
};

export const ChatbotApp = () => {
  if (isAuthModeNone) {
    // Modo sin autenticación: no hay AuthProvider ni LoginForm
    return (
      <ChatProvider>
        <ChatbotLayout>
          <Chatbot />
        </ChatbotLayout>
      </ChatProvider>
    );
  }

  // Modo local (con login)
  console.log("[ChatbotApp] CHAT_AUTH_MODE =", CHAT_AUTH_MODE);
  return (
    <AuthProvider>
      <ChatWithAuth />
    </AuthProvider>
  );
};
