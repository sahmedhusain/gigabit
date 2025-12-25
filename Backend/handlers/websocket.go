package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"gigabit/websocket"
)

type WebSocketHandler struct {
	hub *websocket.Hub
}

func NewWebSocketHandler(hub *websocket.Hub) *WebSocketHandler {
	return &WebSocketHandler{
		hub: hub,
	}
}

func (h *WebSocketHandler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	h.hub.ServeWS(w, r, userID.(uint))
}

func (h *WebSocketHandler) GetOnlineUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	onlineUsers := h.hub.GetOnlineUsers()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"online_users": onlineUsers,
		"count":        len(onlineUsers),
	})
}

func (h *WebSocketHandler) CheckUserStatus(w http.ResponseWriter, r *http.Request, targetUserIDStr string) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	if targetUserIDStr == "" {
		writeError(w, http.StatusBadRequest, "User ID required")
		return
	}

	userIDUint, err := strconv.ParseUint(targetUserIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	db := r.Context().Value("db").(*sql.DB)

	var status string
	err = db.QueryRow("SELECT status FROM users WHERE id = ?", uint(userIDUint)).Scan(&status)
	if err != nil {
		log.Printf("Failed to get status for user %d: %v", uint(userIDUint), err)
		status = "offline"
	}

	isOnline := h.hub.IsUserOnline(uint(userIDUint))
	actualOnline := isOnline && status == "online"

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"user_id": uint(userIDUint),
		"status":  status,
		"online":  actualOnline,
	})
}
