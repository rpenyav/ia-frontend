// src/interfaces/chat/Conversation.ts

import type { ChatMessage } from "./ChatMessage";

export interface Conversation {
  id: string;
  title: string;
  channel?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: ChatMessage[];
}
