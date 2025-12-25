package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"gigabit/services"
)

type ConversationHandler struct {
	chatService *services.ChatService
}

func NewConversationHandler(db *sql.DB) *ConversationHandler {
	return &ConversationHandler{
		chatService: services.NewChatService(db),
	}
}

func (h *ConversationHandler) DeleteConversation(w http.ResponseWriter, r *http.Request, conversationIDStr string) {
	conversationID, err := strconv.ParseUint(conversationIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid conversation ID")
		return
	}

	currentUserID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	err = h.chatService.DeleteConversation(uint(conversationID), currentUserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to delete conversation")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Conversation deleted successfully",
	})
}
