package handlers

import (
	"database/sql"
	"net/http"

	"social/services"
)

type ChatHandler struct {
	chatService *services.ChatService
}

func NewChatHandler(db *sql.DB) *ChatHandler {
	return &ChatHandler{
		chatService: services.NewChatService(db),
	}
}

func (h *ChatHandler) GetUnifiedChats(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	chats, err := h.chatService.GetUnifiedChats(userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get chats")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"chats": chats,
	})
}
