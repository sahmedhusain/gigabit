package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"social/websocket"
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

	// Get user ID from auth middleware
	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Upgrade HTTP connection to WebSocket
	h.hub.ServeWS(w, r, userID.(uint))
}

func (h *WebSocketHandler) GetOnlineUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Get user ID from auth middleware
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

	// Get user ID from auth middleware
	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	if targetUserIDStr == "" {
		writeError(w, http.StatusBadRequest, "User ID required")
		return
	}

	// Convert string to uint
	userIDUint, err := strconv.ParseUint(targetUserIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Get database from context
	db := r.Context().Value("db").(*sql.DB)

	// Get user's status from database
	var status string
	err = db.QueryRow("SELECT status FROM users WHERE id = ?", uint(userIDUint)).Scan(&status)
	if err != nil {
		log.Printf("Failed to get status for user %d: %v", uint(userIDUint), err)
		status = "offline" // Default if not found
	}

	isOnline := h.hub.IsUserOnline(uint(userIDUint))
	// Only consider online if connected AND status is 'online'
	actualOnline := isOnline && status == "online"

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"user_id": uint(userIDUint),
		"status":  status,
		"online":  actualOnline,
	})
}
