package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"gigabit/models"
	"gigabit/services"
	"gigabit/websocket"
)

type ShareHandler struct {
	shareService        *services.ShareService
	notificationService *services.NotificationService
}

func NewShareHandler(db *sql.DB, hub *websocket.Hub) *ShareHandler {
	return &ShareHandler{
		shareService:        services.NewShareService(db, hub),
		notificationService: services.NewNotificationService(db, hub),
	}
}

func (h *ShareHandler) SharePost(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.ShareRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Invalid request data for SharePost: %v", err)
		writeError(w, http.StatusBadRequest, "Invalid request data: "+err.Error())
		return
	}

	if len(req.ConversationIDs) > 5 || len(req.GroupIDs) > 5 || len(req.UserIDs) > 5 {
		writeError(w, http.StatusBadRequest, "Cannot share to more than 5 chats, groups, or users at once")
		return
	}

	if len(req.ConversationIDs) == 0 && len(req.GroupIDs) == 0 && len(req.UserIDs) == 0 {
		writeError(w, http.StatusBadRequest, "Must specify at least one chat, group, or user to share to")
		return
	}

	if err := h.shareService.SharePost(userID.(uint), &req); err != nil {
		log.Printf("Failed to share post: %v", err)
		writeError(w, http.StatusInternalServerError, "Failed to share post")
		return
	}

	log.Printf("Post %d shared successfully by user %v to %d chats and %d groups", req.PostID, userID, len(req.ConversationIDs), len(req.GroupIDs))
	writeJSON(w, http.StatusOK, map[string]string{"message": "Post shared successfully"})
}

func (h *ShareHandler) GetRecentChatsAndGroups(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	items, err := h.shareService.GetRecentChatsAndGroups(userID.(uint))
	if err != nil {
		log.Printf("Failed to get recent chats and groups: %v", err)
		writeError(w, http.StatusInternalServerError, "Failed to get recent chats and groups")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"chats": items,
	})
}

func (h *ShareHandler) SearchShareableEntities(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	query := r.URL.Query().Get("q")
	if query == "" {
		writeError(w, http.StatusBadRequest, "Search query is required")
		return
	}

	items, err := h.shareService.SearchShareableEntities(userID.(uint), query)
	if err != nil {
		log.Printf("Failed to search shareable entities: %v", err)
		writeError(w, http.StatusInternalServerError, "Failed to search shareable entities")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"chats": items,
	})
}
