// src/adapters/ui/react/chat/ConversationsList.tsx
import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Conversation } from "../../../interfaces";

export interface ConversationsListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  loading: boolean;
  onChange: (idOrNew: string | null) => Promise<void>;
  onCreateConversation: (title: string) => Promise<void>;
  onDeleteConversation: (id: string) => Promise<void>;
}

export const ConversationsList = ({
  conversations,
  selectedConversationId,
  loading,
  onChange,
  onCreateConversation,
  onDeleteConversation,
}: ConversationsListProps) => {
  const { t } = useTranslation("common");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /**
   * Si no hay conversación seleccionada pero sí hay conversaciones,
   * seleccionamos por defecto la última creada (último elemento del array).
   * Esto solo actúa como *fallback*: si el contexto ya ha cargado una
   * conversación persistida, `selectedConversationId` vendrá informado
   * y no entraremos aquí.
   */
  useEffect(() => {
    if (loading) return;
    if (selectedConversationId) return;
    if (!conversations || conversations.length === 0) return;

    const lastConversation = conversations[conversations.length - 1];
    if (lastConversation && lastConversation.id) {
      void onChange(lastConversation.id);
    }
  }, [loading, selectedConversationId, conversations, onChange]);

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || null;
    void onChange(value);
  };

  const handleOpenCreate = () => {
    setNewTitle("");
    setShowCreateModal(true);
  };

  const handleCloseCreate = () => {
    setShowCreateModal(false);
    setNewTitle("");
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    await onCreateConversation(title);
    setShowCreateModal(false);
    setNewTitle("");
  };

  const handleOpenDelete = () => {
    if (!selectedConversationId) return;
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedConversationId) return;
    await onDeleteConversation(selectedConversationId);
    setShowDeleteModal(false);
  };

  return (
    <>
      <div className="ia-chatbot-toolbar">
        <div className="ia-chatbot-toolbar-actions">
          <select
            className="ia-chatbot-select"
            value={selectedConversationId ?? ""}
            onChange={handleSelectChange}
            disabled={loading || conversations.length === 0}
          >
            <option value="">
              {t(
                "conversations_select_placeholder",
                "Selecciona una conversación..."
              )}
            </option>
            {conversations.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="ia-chatbot-new-conversation-button"
            onClick={handleOpenCreate}
            disabled={loading}
          >
            {t("conversations_new_button", "Nueva")}
          </button>

          <button
            type="button"
            className="ia-chatbot-new-conversation-button"
            onClick={handleOpenDelete}
            disabled={loading || !selectedConversationId}
          >
            {t("conversations_delete_button", "Eliminar")}
          </button>
        </div>
      </div>

      {/* Modal crear conversación */}
      {showCreateModal && (
        <div className="ia-chatbot-modal-backdrop">
          <div className="ia-chatbot-modal">
            <h2 className="ia-chatbot-modal-title">
              {t("conversations_create_title", "Nueva conversación")}
            </h2>
            <form onSubmit={handleCreateSubmit}>
              <label className="ia-chatbot-modal-label">
                {t("conversations_create_label", "Título de la conversación")}
                <input
                  className="ia-chatbot-modal-input"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
              </label>

              <div className="ia-chatbot-modal-actions">
                <button
                  type="button"
                  className="ia-chatbot-button ia-chatbot-button-secondary"
                  onClick={handleCloseCreate}
                >
                  {t("common_cancel", "Cancelar")}
                </button>
                <button
                  type="submit"
                  className="ia-chatbot-button ia-chatbot-button-primary"
                  disabled={!newTitle.trim()}
                >
                  {t("common_create", "Crear")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {showDeleteModal && (
        <div className="ia-chatbot-modal-backdrop">
          <div className="ia-chatbot-modal">
            <h2 className="ia-chatbot-modal-title">
              {t("conversations_delete_title", "Eliminar conversación")}
            </h2>
            <p className="ia-chatbot-modal-label">
              {t(
                "conversations_delete_confirm",
                "¿Seguro que quieres eliminar la conversación seleccionada?"
              )}
            </p>

            <div className="ia-chatbot-modal-actions">
              <button
                type="button"
                className="ia-chatbot-button ia-chatbot-button-secondary"
                onClick={handleCancelDelete}
              >
                {t("common_cancel", "Cancelar")}
              </button>
              <button
                type="button"
                className="ia-chatbot-button ia-chatbot-button-primary"
                onClick={handleConfirmDelete}
              >
                {t("conversations_delete_button", "Eliminar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
