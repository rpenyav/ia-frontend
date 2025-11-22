// src/infrastructure/contexts/ChatContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ConversationService,
  ChatService,
} from "../../core/application/services";
import type {
  Conversation,
  ChatMessage,
  ChatAttachment,
} from "../../interfaces";
import { ConversationRepository, ChatRepository } from "../repositories";
import { isAuthModeNone } from "../config/chatConfig";

const conversationRepository = new ConversationRepository();
const chatRepository = new ChatRepository();

const conversationService = new ConversationService(conversationRepository);
const chatService = new ChatService(chatRepository);

const IS_EPHEMERAL = isAuthModeNone;

interface ChatContextValue {
  conversations: Conversation[];
  selectedConversationId: string | null;
  messages: ChatMessage[];
  loadingConversations: boolean;
  loadingMessages: boolean;
  isStreaming: boolean;
  error: string;

  reloadConversations: () => Promise<void>;
  selectConversation: (idOrNew: string | null) => Promise<void>;
  sendMessage: (text: string, attachments?: ChatAttachment[]) => Promise<void>;
  createConversation: (title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const useChatContext = (): ChatContextValue => {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatContext debe usarse dentro de ChatProvider");
  }
  return ctx;
};

export interface ChatProviderProps {
  children: ReactNode;
}

const SELECTED_CONVERSATION_STORAGE_KEY = "ia_chat_selected_conversation_id";

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] =
    useState<boolean>(false);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const reloadConversations = async () => {
    if (IS_EPHEMERAL) {
      // Modo sin auth: no hay conversaciones persistentes
      return;
    }

    setLoadingConversations(true);
    setError("");
    try {
      const data = await conversationService.getConversations();
      setConversations(data);
    } catch (e) {
      console.error(e);
      setError("No se han podido cargar las conversaciones.");
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (IS_EPHEMERAL) {
        // Sin auth → no tocar backend de conversaciones
        setConversations([]);
        setSelectedConversationId(null);
        setMessages([]);
        return;
      }

      try {
        const storedId = window.localStorage.getItem(
          SELECTED_CONVERSATION_STORAGE_KEY
        );

        await reloadConversations();

        if (storedId) {
          setSelectedConversationId(storedId);
          setLoadingMessages(true);
          try {
            const detail =
              await conversationService.getConversationWithMessages(storedId);

            const sortedMessages = [...detail.messages].sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            );

            setMessages(sortedMessages);
          } catch (e) {
            // ⚠️ Importante: NO borramos la clave de localStorage aquí
            console.error(
              "[ChatContext] No se ha podido cargar la conversación almacenada",
              e
            );
            // Podemos dejar selectedConversationId tal cual o ponerlo a null,
            // pero sin tocar localStorage. Para evitar estados raros, lo
            // dejamos a null:
            setSelectedConversationId(null);
          } finally {
            setLoadingMessages(false);
          }
        }
      } catch (e) {
        console.error(e);
        setError("No se han podido cargar las conversaciones.");
      }
    };

    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (IS_EPHEMERAL) return;

    if (selectedConversationId) {
      window.localStorage.setItem(
        SELECTED_CONVERSATION_STORAGE_KEY,
        selectedConversationId
      );
    } else {
      window.localStorage.removeItem(SELECTED_CONVERSATION_STORAGE_KEY);
    }
  }, [selectedConversationId]);

  const selectConversation = async (idOrNew: string | null) => {
    setError("");

    if (IS_EPHEMERAL) {
      // Modo none: ignoramos selección (todo es efímero)
      return;
    }

    if (!idOrNew) {
      setSelectedConversationId(null);
      setMessages([]);
      return;
    }

    setSelectedConversationId(idOrNew);
    setLoadingMessages(true);

    try {
      const detail = await conversationService.getConversationWithMessages(
        idOrNew
      );

      const sortedMessages = [...detail.messages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      setMessages(sortedMessages);
    } catch (e) {
      console.error(e);
      setError("No se ha podido cargar la conversación seleccionada.");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async (
    text: string,
    attachments: ChatAttachment[] = []
  ) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const now = new Date().toISOString();
    const currentConversationId = IS_EPHEMERAL
      ? undefined
      : selectedConversationId ?? undefined;

    const userMessage: ChatMessage = {
      id: `${now}-user`,
      role: "user",
      content: trimmed,
      createdAt: now,
      conversationId: currentConversationId,
      attachments,
    };

    const assistantId = `${now}-assistant`;
    const assistantBase: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: now,
      conversationId: currentConversationId,
    };

    // Usuario + placeholder del bot
    setMessages((prev) => [...prev, userMessage, assistantBase]);
    setError("");
    setIsStreaming(true);

    try {
      const result = await chatService.sendMessage(
        {
          conversationId: currentConversationId ?? null,
          message: trimmed,
          attachments,
        },
        (delta, newConversationId) => {
          const safeDelta = typeof delta === "string" ? delta : "";
          if (!safeDelta) return;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content: (msg.content ?? "") + safeDelta,
                    conversationId: newConversationId ?? msg.conversationId,
                  }
                : msg
            )
          );

          if (
            !IS_EPHEMERAL &&
            newConversationId &&
            newConversationId !== selectedConversationId
          ) {
            setSelectedConversationId(newConversationId);
          }
        }
      );

      if (
        !IS_EPHEMERAL &&
        result.conversationId &&
        result.conversationId !== selectedConversationId
      ) {
        setSelectedConversationId(result.conversationId);
      }

      if (!IS_EPHEMERAL) {
        await reloadConversations();
      }
    } catch (e) {
      console.error(e);
      setError("Ha ocurrido un error al generar la respuesta.");
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content:
                  msg.content ||
                  "Lo siento, no he podido generar una respuesta en este momento.",
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const createConversation = async (title: string) => {
    if (IS_EPHEMERAL) {
      // Sin auth → no creamos conversaciones en BBDD
      return;
    }

    const trimmed = title.trim();
    if (!trimmed) return;

    setError("");

    try {
      const newConversation = await conversationService.createConversation(
        trimmed
      );

      setConversations((prev) => [...prev, newConversation]);
      setSelectedConversationId(newConversation.id);
      setMessages([]);
    } catch (e) {
      console.error(e);
      setError("No se ha podido crear la conversación.");
    }
  };

  const deleteConversation = async (id: string) => {
    if (IS_EPHEMERAL) {
      // Sin auth → nada que borrar en backend
      return;
    }

    setError("");

    try {
      const previousList = conversations;
      const index = previousList.findIndex((c) => c.id === id);

      await conversationService.deleteConversation(id);

      const newList = previousList.filter((c) => c.id !== id);
      setConversations(newList);

      if (selectedConversationId === id) {
        if (newList.length > 0) {
          const newIndex = index > 0 ? index - 1 : 0;
          const newSelectedId = newList[newIndex].id;

          setSelectedConversationId(newSelectedId);
          setLoadingMessages(true);

          try {
            const detail =
              await conversationService.getConversationWithMessages(
                newSelectedId
              );

            const sortedMessages = [...detail.messages].sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            );

            setMessages(sortedMessages);
          } finally {
            setLoadingMessages(false);
          }
        } else {
          setSelectedConversationId(null);
          setMessages([]);
        }
      }
    } catch (e) {
      console.error(e);
      setError("No se ha podido eliminar la conversación.");
    }
  };

  const value = useMemo<ChatContextValue>(
    () => ({
      conversations,
      selectedConversationId,
      messages,
      loadingConversations,
      loadingMessages,
      isStreaming,
      error,
      reloadConversations,
      selectConversation,
      sendMessage,
      createConversation,
      deleteConversation,
    }),
    [
      conversations,
      selectedConversationId,
      messages,
      loadingConversations,
      loadingMessages,
      isStreaming,
      error,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
