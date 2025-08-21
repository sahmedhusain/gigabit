package handlers

import (
	"fmt"
	"net/http"
	"social/websocket"

	"github.com/gin-gonic/gin"
)

type WebSocketHandler struct {
	hub *websocket.Hub
}

func NewWebSocketHandler(hub *websocket.Hub) *WebSocketHandler {
	return &WebSocketHandler{
		hub: hub,
	}
}

func (h *WebSocketHandler) HandleWebSocket(c *gin.Context) {
	// Get user ID from auth middleware
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Upgrade HTTP connection to WebSocket
	h.hub.ServeWS(c.Writer, c.Request, userID.(uint))
}

func (h *WebSocketHandler) GetOnlineUsers(c *gin.Context) {
	// Get user ID from auth middleware
	_, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	onlineUsers := h.hub.GetOnlineUsers()
	c.JSON(http.StatusOK, gin.H{
		"online_users": onlineUsers,
		"count":        len(onlineUsers),
	})
}

func (h *WebSocketHandler) CheckUserStatus(c *gin.Context) {
	// Get user ID from auth middleware
	_, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	targetUserID := c.Param("user_id")
	if targetUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID required"})
		return
	}

	// Convert string to uint
	var userIDUint uint
	if _, err := fmt.Sscanf(targetUserID, "%d", &userIDUint); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	isOnline := h.hub.IsUserOnline(userIDUint)
	status := "offline"
	if isOnline {
		status = "online"
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id": userIDUint,
		"status":  status,
		"online":  isOnline,
	})
}