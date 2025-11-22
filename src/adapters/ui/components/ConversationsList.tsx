// src/adapters/ui/react/chat/ConversationsList.tsx
import { useState, type ChangeEvent, type FormEvent } from "react";
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
        {/* <span className="ia-chatbot-toolbar-label">Conversación</span> */}

        <div className="ia-chatbot-toolbar-actions">
          <select
            className="ia-chatbot-select"
            value={selectedConversationId ?? ""}
            onChange={handleSelectChange}
            disabled={loading || conversations.length === 0}
          >
            <option value="">Selecciona una conversación...</option>
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
            Nueva
          </button>

          <button
            type="button"
            className="ia-chatbot-new-conversation-button"
            onClick={handleOpenDelete}
            disabled={loading || !selectedConversationId}
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Modal crear conversación */}
      {showCreateModal && (
        <div className="ia-chatbot-modal-backdrop">
          <div className="ia-chatbot-modal">
            <h2 className="ia-chatbot-modal-title">Nueva conversación</h2>
            <form onSubmit={handleCreateSubmit}>
              <label className="ia-chatbot-modal-label">
                Título de la conversación
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
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="ia-chatbot-button ia-chatbot-button-primary"
                  disabled={!newTitle.trim()}
                >
                  Crear
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
            <h2 className="ia-chatbot-modal-title">Eliminar conversación</h2>
            <p className="ia-chatbot-modal-label">
              ¿Seguro que quieres eliminar la conversación seleccionada?
            </p>

            <div className="ia-chatbot-modal-actions">
              <button
                type="button"
                className="ia-chatbot-button ia-chatbot-button-secondary"
                onClick={handleCancelDelete}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="ia-chatbot-button ia-chatbot-button-primary"
                onClick={handleConfirmDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
