package handlers

import (
	"database/sql"
	"net/http"
	"social/models"
	"social/services"
	"social/websocket"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type MessageHandler struct {
	messageService *services.MessageService
	hub            *websocket.Hub
}

func NewMessageHandler(db *sql.DB, hub *websocket.Hub) *MessageHandler {
	return &MessageHandler{
		messageService: services.NewMessageService(db),
		hub:            hub,
	}
}

func (h *MessageHandler) SendMessage(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.CreateMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	message := &models.Message{
		SenderID:    userID.(uint),
		Content:     req.Content,
		MessageType: req.MessageType,
	}

	if req.ImageURL != "" {
		message.ImageURL = &req.ImageURL
	}

	var err error
	if req.MessageType == "private" {
		if req.ReceiverID == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Receiver ID required for private messages"})
			return
		}
		message.ReceiverID = req.ReceiverID
		err = h.messageService.SendPrivateMessage(message)
	} else if req.MessageType == "group" {
		if req.GroupID == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Group ID required for group messages"})
			return
		}
		message.GroupID = &req.GroupID
		err = h.messageService.SendGroupMessage(message)
	}

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot send message"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		}
		return
	}

	// Send real-time message via websocket
	wsMessage := websocket.Message{
		Type:      websocket.MessageTypePrivateMessage,
		From:      userID.(uint),
		Content:   req.Content,
		Timestamp: time.Now().Unix(),
		Data: map[string]interface{}{
			"id":           message.ID,
			"message_type": req.MessageType,
			"image_url":    req.ImageURL,
		},
	}

	if req.MessageType == "private" {
		wsMessage.To = req.ReceiverID
		h.hub.BroadcastMessage(wsMessage)
	} else if req.MessageType == "group" {
		wsMessage.Type = websocket.MessageTypeGroupMessage
		wsMessage.GroupID = req.GroupID
		h.hub.BroadcastMessage(wsMessage)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Message sent successfully",
		"data":    message,
	})
}

func (h *MessageHandler) GetPrivateMessages(c *gin.Context) {
	userIDStr := c.Param("user_id")
	targetUserID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	currentUserID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get pagination parameters
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit > 100 {
		limit = 50
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	messages, err := h.messageService.GetPrivateMessages(currentUserID.(uint), uint(targetUserID), limit, offset)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot access these messages"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get messages"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
		"count":    len(messages),
		"limit":    limit,
		"offset":   offset,
	})
}

func (h *MessageHandler) GetGroupMessages(c *gin.Context) {
	groupIDStr := c.Param("group_id")
	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get pagination parameters
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit > 100 {
		limit = 50
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	messages, err := h.messageService.GetGroupMessages(uint(groupID), userID.(uint), limit, offset)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot access group messages"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get group messages"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
		"count":    len(messages),
		"limit":    limit,
		"offset":   offset,
	})
}

func (h *MessageHandler) GetConversations(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	conversations, err := h.messageService.GetUserConversations(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get conversations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"conversations": conversations,
		"count":         len(conversations),
	})
}

func (h *MessageHandler) MarkAsRead(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.MarkReadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.messageService.MarkMessagesAsRead(req.MessageIDs, userID.(uint)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark messages as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Messages marked as read",
		"count":   len(req.MessageIDs),
	})
}

func (h *MessageHandler) SendTypingIndicator(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.TypingIndicator
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.UserID = userID.(uint)

	// Send typing indicator via websocket
	wsMessage := websocket.Message{
		Type:      websocket.MessageTypeTyping,
		From:      userID.(uint),
		Timestamp: time.Now().Unix(),
		Data:      req,
	}

	// Parse conversation ID to determine if it's private or group
	if len(req.ConversationID) > 8 && req.ConversationID[:8] == "private_" {
		// Private conversation
		targetUserIDStr := req.ConversationID[8:]
		if targetUserID, err := strconv.ParseUint(targetUserIDStr, 10, 32); err == nil {
			wsMessage.To = uint(targetUserID)
		}
	} else if len(req.ConversationID) > 6 && req.ConversationID[:6] == "group_" {
		// Group conversation
		groupIDStr := req.ConversationID[6:]
		if groupID, err := strconv.ParseUint(groupIDStr, 10, 32); err == nil {
			wsMessage.Type = websocket.MessageTypeGroupMessage
			wsMessage.GroupID = uint(groupID)
		}
	}

	h.hub.BroadcastMessage(wsMessage)

	c.JSON(http.StatusOK, gin.H{"message": "Typing indicator sent"})
}