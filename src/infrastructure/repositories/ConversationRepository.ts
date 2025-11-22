// src/infrastructure/repositories/ConversationRepository.ts
import { fetchWithAuth } from "../api/api";
import { API_ENDPOINTS } from "../../core/domain/constants/apiEndpoints";
import type { Conversation, ConversationWithMessages } from "../../interfaces";

export class ConversationRepository {
  async getAll(): Promise<Conversation[]> {
    return await fetchWithAuth<Conversation[]>(API_ENDPOINTS.CONVERSATIONS);
  }

  async getWithMessages(id: string): Promise<ConversationWithMessages> {
    return await fetchWithAuth<ConversationWithMessages>(
      `${API_ENDPOINTS.CONVERSATIONS}/${id}`
    );
  }

  async create(title: string, channel: string): Promise<Conversation> {
    return await fetchWithAuth<Conversation>(API_ENDPOINTS.CONVERSATIONS, {
      method: "POST",
      body: JSON.stringify({ title, channel }),
    });
  }

  async delete(id: string): Promise<void> {
    await fetchWithAuth<void>(`${API_ENDPOINTS.CONVERSATIONS}/${id}`, {
      method: "DELETE",
    });
  }
}
