// src/infrastructure/repositories/ConversationRepository.ts
import { fetchWithAuth } from "../api/api";
import { API_ENDPOINTS } from "../../core/domain/constants/apiEndpoints";
import type { Conversation, ConversationWithMessages } from "../../interfaces";

interface PaginatedConversations {
  pageSize: number;
  pageNumber: number;
  totalRegisters: number;
  list: Conversation[];
}

export class ConversationRepository {
  async getAll(): Promise<Conversation[]> {
    // 👇 Usamos any porque el backend puede devolver array o paginado
    const raw = await fetchWithAuth<any>(API_ENDPOINTS.CONVERSATIONS);

    // Caso 1: el backend ya devuelve un array de conversaciones
    if (Array.isArray(raw)) {
      return raw as Conversation[];
    }

    // Caso 2: backend devuelve paginado { pageSize, pageNumber, totalRegisters, list: [...] }
    if (
      raw &&
      typeof raw === "object" &&
      Array.isArray((raw as PaginatedConversations).list)
    ) {
      const paginated = raw as PaginatedConversations;
      console.info(
        "[ConversationRepository] /conversations ha devuelto un paginado. Usando paginated.list como array de conversaciones."
      );
      return paginated.list;
    }

    // Caso 3: formato inesperado → log de aviso y devolvemos []
    console.error(
      "[ConversationRepository] /conversations debería devolver un array o un objeto con { list }, pero se ha recibido:",
      raw
    );
    return [];
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
