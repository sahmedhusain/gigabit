package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"social/models"
	"social/services"
	"social/websocket"
)

type MessageHandler struct {
	messageService      *services.MessageService
	chatService         *services.ChatService
	notificationService *services.NotificationService
	hub                 *websocket.Hub
}

func NewMessageHandler(db *sql.DB, hub *websocket.Hub) *MessageHandler {
	return &MessageHandler{
		messageService:      services.NewMessageService(db),
		chatService:         services.NewChatService(db),
		notificationService: services.NewNotificationService(db, hub),
		hub:                 hub,
	}
}

func (h *MessageHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.CreateMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	message := &models.Message{
		SenderID:    userID,
		Content:     req.Content,
		MessageType: req.MessageType,
	}

	if req.ImageURL != "" {
		message.Content = req.ImageURL
	}

	var err error
	var conversationID uint
	if req.MessageType == "private" {
		if req.ReceiverID == 0 {
			writeError(w, http.StatusBadRequest, "Receiver ID required for private messages")
			return
		}
		message.ReceiverID = req.ReceiverID
		err = h.messageService.SendPrivateMessage(message)
		conversationID, _ = h.messageService.GetPrivateConversationID(message.SenderID, message.ReceiverID)
	} else if req.MessageType == "group" {
		if req.GroupID == 0 {
			writeError(w, http.StatusBadRequest, "Group ID required for group messages")
			return
		}
		message.GroupID = &req.GroupID
		err = h.messageService.SendGroupMessage(message)
		conversationID, _ = h.messageService.GetGroupConversationID(req.GroupID)
	}

	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot send message")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to send message")
		}
		return
	}

	var senderFirstName, senderLastName, senderAvatar string
	senderQuery := `SELECT first_name, last_name, avatar FROM users WHERE id = ?`
	db := h.messageService.GetDB()
	err = db.QueryRow(senderQuery, userID).Scan(&senderFirstName, &senderLastName, &senderAvatar)
	if err != nil {
		senderFirstName = "Unknown"
		senderLastName = "User"
	}

	wsMessage := websocket.Message{
		Type:      websocket.MessageTypePrivateMessage,
		From:      userID,
		Content:   message.Content,
		Timestamp: time.Now().Unix(),
		Data: map[string]interface{}{
			"id": message.ID,
			"message_type": func() string {
				if strings.HasPrefix(message.Content, "http") {
					return "image"
				} else if strings.HasPrefix(message.Content, "Shared a post:") {
					return "share"
				}
				return "text"
			}(),
			"sender": map[string]interface{}{
				"id":         userID,
				"first_name": senderFirstName,
				"last_name":  senderLastName,
				"avatar":     senderAvatar,
			},
			"conversation_id": conversationID,
			"created_at":      message.CreatedAt.Format(time.RFC3339),
		},
	}

	var imageWsMessage *websocket.Message
	if strings.HasPrefix(message.Content, "http") {
		imageWsMessage = &websocket.Message{
			Type:      websocket.MessageTypeImageShared,
			From:      userID,
			Content:   message.Content,
			Timestamp: time.Now().Unix(),
			Data: map[string]interface{}{
				"id":        message.ID,
				"image_url": message.Content,
				"sender": map[string]interface{}{
					"id":         userID,
					"first_name": senderFirstName,
					"last_name":  senderLastName,
					"avatar":     senderAvatar,
				},
				"conversation_id": conversationID,
				"created_at":      message.CreatedAt.Format(time.RFC3339),
			},
		}
	}

	if req.MessageType == "private" {
		wsMessage.To = req.ReceiverID
		h.hub.BroadcastMessage(wsMessage)

		if imageWsMessage != nil {
			imageWsMessage.To = req.ReceiverID
			h.hub.BroadcastMessage(*imageWsMessage)
		}

		if strings.HasPrefix(message.Content, "http") {
			go h.notificationService.NotifyImageShared(userID, 0, false, 0, req.ReceiverID)
		} else if strings.HasPrefix(message.Content, "Shared a post:") {
			go h.notificationService.NotifyPostShared(userID, 0, false, 0, req.ReceiverID)
		} else {
			go h.notificationService.NotifyPrivateMessage(userID, req.ReceiverID, message.ID)
		}
	} else if req.MessageType == "group" {
		wsMessage.Type = websocket.MessageTypeGroupMessage
		wsMessage.GroupID = req.GroupID
		h.hub.BroadcastMessage(wsMessage)

		if imageWsMessage != nil {
			imageWsMessage.Type = websocket.MessageTypeGroupMessage
			imageWsMessage.GroupID = req.GroupID
			h.hub.BroadcastMessage(*imageWsMessage)
		}

		if strings.HasPrefix(message.Content, "http") {
			memberIDs, err := h.notificationService.GetGroupMemberIDs(req.GroupID, userID)
			if err == nil {
				for _, memberID := range memberIDs {
					h.notificationService.NotifyImageShared(userID, 0, true, req.GroupID, memberID)
				}
			}
		} else if strings.HasPrefix(message.Content, "Shared a post:") {
			memberIDs, err := h.notificationService.GetGroupMemberIDs(req.GroupID, userID)
			if err == nil {
				for _, memberID := range memberIDs {
					h.notificationService.NotifyPostShared(userID, 0, true, req.GroupID, memberID)
				}
			}
		} else {
			go h.notificationService.NotifyGroupMessage(userID, req.GroupID, message.ID)
		}
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message":         "Message sent successfully",
		"data":            message,
		"conversation_id": conversationID,
	})
}

func (h *MessageHandler) GetPrivateMessages(w http.ResponseWriter, r *http.Request, userIDStr string) {
	targetUserID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	currentUserID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	limitStr := r.URL.Query().Get("limit")
	if limitStr == "" {
		limitStr = "50"
	}
	offsetStr := r.URL.Query().Get("offset")
	if offsetStr == "" {
		offsetStr = "0"
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit > 100 {
		limit = 50
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	messages, err := h.messageService.GetPrivateMessages(currentUserID, uint(targetUserID), limit, offset)
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot access these messages")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to get messages")
		}
		return
	}

	var unreadMessageIDs []uint
	for _, msg := range messages {
		if !msg.IsRead && msg.SenderID != currentUserID {
			unreadMessageIDs = append(unreadMessageIDs, msg.ID)
		}
	}
	if len(unreadMessageIDs) > 0 {
		_ = h.messageService.MarkMessagesAsRead(unreadMessageIDs, currentUserID)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"messages": messages,
		"count":    len(messages),
		"limit":    limit,
		"offset":   offset,
	})
}

func (h *MessageHandler) GetGroupMessages(w http.ResponseWriter, r *http.Request, groupIDStr string) {
	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	limitStr := r.URL.Query().Get("limit")
	if limitStr == "" {
		limitStr = "50"
	}
	offsetStr := r.URL.Query().Get("offset")
	if offsetStr == "" {
		offsetStr = "0"
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit > 100 {
		limit = 50
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	messages, err := h.messageService.GetGroupMessages(uint(groupID), userID, limit, offset)
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot access group messages")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to get group messages")
		}
		return
	}

	var messageIDs []uint
	for _, msg := range messages {
		if !msg.IsRead && msg.SenderID != userID {
			messageIDs = append(messageIDs, msg.ID)
		}
	}
	if len(messageIDs) > 0 {
		_ = h.messageService.MarkMessagesAsRead(messageIDs, userID)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"messages": messages,
		"count":    len(messages),
		"limit":    limit,
		"offset":   offset,
	})
}

func (h *MessageHandler) GetConversations(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	chats, err := h.chatService.GetUnifiedChats(userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get conversations")
		return
	}

	conversations := make([]models.ConversationResponse, 0, len(chats))
	for _, chat := range chats {
		conversation := models.ConversationResponse{
			ID:          chat.ConversationID,
			Type:        chat.Type,
			UnreadCount: chat.UnreadCount,
			UpdatedAt:   chat.LastMessageTime.Format(time.RFC3339),
		}

		if chat.LastMessage != nil {
			messageSummary := &models.MessageSummary{
				Content:   *chat.LastMessage,
				CreatedAt: chat.LastMessageTime.Format(time.RFC3339),
			}

			if chat.LastMessageType != nil {
				messageSummary.MessageType = *chat.LastMessageType
			} else {
				if strings.HasPrefix(*chat.LastMessage, "http") {
					messageSummary.MessageType = "image"
				} else if strings.HasPrefix(*chat.LastMessage, "Shared a post:") {
					messageSummary.MessageType = "share"
				} else {
					messageSummary.MessageType = "text"
				}
			}

			if chat.LastMessageSender != nil {
				messageSummary.SenderID = chat.LastMessageSender.ID
				messageSummary.Sender = chat.LastMessageSender
			} else if chat.Participant != nil {
				messageSummary.SenderID = chat.Participant.ID
				messageSummary.Sender = chat.Participant
			}

			conversation.LastMessage = messageSummary
		}

		if chat.Type == "private" {
			conversation.Participant = chat.Participant
		} else if chat.Type == "group" {
			conversation.Group = chat.Group
		}

		conversations = append(conversations, conversation)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"conversations": conversations,
		"count":         len(conversations),
	})
}

func (h *MessageHandler) GetConversationMessages(w http.ResponseWriter, r *http.Request, conversationIDStr string) {
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

	limitStr := r.URL.Query().Get("limit")
	if limitStr == "" {
		limitStr = "10"
	}
	offsetStr := r.URL.Query().Get("offset")
	if offsetStr == "" {
		offsetStr = "0"
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit > 100 {
		limit = 10
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	messages, err := h.messageService.GetConversationMessages(uint(conversationID), currentUserID, limit, offset)
	if err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot access these messages")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to get messages")
		}
		return
	}

	var unreadMessageIDs []uint
	for _, msg := range messages {
		if !msg.IsRead && msg.SenderID != currentUserID {
			unreadMessageIDs = append(unreadMessageIDs, msg.ID)
		}
	}
	if len(unreadMessageIDs) > 0 {
		_ = h.messageService.MarkMessagesAsRead(unreadMessageIDs, currentUserID)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"messages": messages,
		"count":    len(messages),
		"limit":    limit,
		"offset":   offset,
	})
}

func (h *MessageHandler) SendTypingIndicator(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.TypingIndicator
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	req.UserID = userID

	wsMessage := websocket.Message{
		Type:      websocket.MessageTypeTyping,
		From:      userID,
		Timestamp: time.Now().Unix(),
		Data:      req,
	}

	if len(req.ConversationID) > 8 && req.ConversationID[:8] == "private_" {
		targetUserIDStr := req.ConversationID[8:]
		if targetUserID, err := strconv.ParseUint(targetUserIDStr, 10, 32); err == nil {
			wsMessage.To = uint(targetUserID)
		}
	} else if len(req.ConversationID) > 6 && req.ConversationID[:6] == "group_" {
		groupIDStr := req.ConversationID[6:]
		if groupID, err := strconv.ParseUint(groupIDStr, 10, 32); err == nil {
			wsMessage.Type = websocket.MessageTypeGroupMessage
			wsMessage.GroupID = uint(groupID)
		}
	}

	h.hub.BroadcastMessage(wsMessage)

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Typing indicator sent"})
}

func (h *MessageHandler) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.MarkReadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.messageService.MarkMessagesAsRead(req.MessageIDs, userID); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to mark messages as read")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Messages marked as read",
		"count":   len(req.MessageIDs),
	})
}

func (h *MessageHandler) MarkAsUnread(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.MarkReadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.messageService.MarkMessagesAsUnread(req.MessageIDs, userID); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to mark messages as unread")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Messages marked as unread",
		"count":   len(req.MessageIDs),
	})
}

func (h *MessageHandler) DeleteMessage(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	messageIDStr := strings.TrimPrefix(r.URL.Path, "/api/messages/")
	messageID, err := strconv.ParseUint(messageIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid message ID")
		return
	}

	log.Printf("🗑️ [DeleteMessage] Starting deletion for message ID: %d by user: %d", messageID, userID)

	err = h.messageService.DeleteMessage(uint(messageID), userID)
	if err != nil {
		log.Printf("❌ [DeleteMessage] DeleteMessage service error: %v", err)
		if strings.Contains(err.Error(), "not found") {
			writeError(w, http.StatusNotFound, err.Error())
		} else if strings.Contains(err.Error(), "only delete your own") {
			writeError(w, http.StatusForbidden, err.Error())
		} else if strings.Contains(err.Error(), "within 3 days") {
			writeError(w, http.StatusBadRequest, err.Error())
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to delete message")
		}
		return
	}

	log.Printf("✅ [DeleteMessage] Message %d deleted successfully", messageID)

	var messageType string
	checkQuery := `
		SELECT 'private' as type FROM private_messages WHERE id = ?
		UNION ALL
		SELECT 'group' as type FROM group_messages WHERE id = ?
		LIMIT 1
	`
	db := h.messageService.GetDB()
	err = db.QueryRow(checkQuery, messageID, messageID).Scan(&messageType)
	if err != nil {
		log.Printf("❌ [DeleteMessage] Error determining message type for message %d: %v", messageID, err)
		messageType = "unknown"
	} else {
		log.Printf("📋 [DeleteMessage] Message %d type determined: %s", messageID, messageType)
	}

	wsMessage := websocket.Message{
		Type:      websocket.MessageTypeMessageDeleted,
		From:      userID,
		Timestamp: time.Now().Unix(),
		Data: map[string]interface{}{
			"message_id":   uint(messageID),
			"message_type": messageType,
		},
	}

	log.Printf("📡 [DeleteMessage] Broadcasting message deletion: type=%s, id=%d, message_type=%s", wsMessage.Type, messageID, messageType)

	var conversationType string
	var receiverID, groupID uint
	conversationCheckQuery := `
		SELECT 'private' as type, 
		       CASE WHEN pc.participant1_id = ? THEN pc.participant2_id ELSE pc.participant1_id END as other_id, 
		       0 as group_id
		FROM private_messages pm 
		JOIN private_conversations pc ON pm.conversation_id = pc.id 
		WHERE pm.id = ?
		UNION ALL
		SELECT 'group' as type, 0 as other_id, gc.group_id
		FROM group_messages gm 
		JOIN group_conversations gc ON gm.conversation_id = gc.id 
		WHERE gm.id = ?
		LIMIT 1
	`
	err = db.QueryRow(conversationCheckQuery, userID, messageID, messageID).Scan(&conversationType, &receiverID, &groupID)
	if err == nil {
		log.Printf("📋 [DeleteMessage] Conversation check successful: type=%s, receiverID=%d, groupID=%d", conversationType, receiverID, groupID)
		if conversationType == "private" {
			wsMessage.To = receiverID
			log.Printf("📡 [DeleteMessage] Broadcasting private message deletion to user %d", receiverID)
			h.hub.BroadcastMessage(wsMessage)
		} else if conversationType == "group" {
			wsMessage.GroupID = groupID
			log.Printf("📡 [DeleteMessage] Broadcasting group message deletion to group %d", groupID)
			h.hub.BroadcastMessage(wsMessage)
		}
	} else {
		log.Printf("❌ [DeleteMessage] Error determining conversation type for message %d: %v", messageID, err)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Message deleted successfully",
	})
}

func (h *MessageHandler) parseConversationID(chatID string) uint {
	if strings.HasPrefix(chatID, "private_") {
		if id, err := strconv.ParseUint(chatID[8:], 10, 32); err == nil {
			return uint(id)
		}
	} else if strings.HasPrefix(chatID, "group_") {
		if id, err := strconv.ParseUint(chatID[6:], 10, 32); err == nil {
			return uint(id)
		}
	}
	return 0
}

func (h *MessageHandler) MarkConversationAsRead(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req struct {
		ConversationID   uint   `json:"conversation_id"`
		ConversationType string `json:"conversation_type"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("MarkConversationAsRead: Failed to decode request body: %v", err)
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	log.Printf("MarkConversationAsRead: ConversationID=%d, UserID=%d, Type=%s", req.ConversationID, userID, req.ConversationType)

	if req.ConversationID == 0 {
		log.Printf("MarkConversationAsRead: ConversationID is 0")
		writeError(w, http.StatusBadRequest, "Conversation ID is required")
		return
	}

	if err := h.messageService.MarkConversationAsRead(req.ConversationID, userID, req.ConversationType); err != nil {
		log.Printf("MarkConversationAsRead: Service error: %v", err)
		writeError(w, http.StatusInternalServerError, "Failed to mark conversation as read")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":         "Conversation marked as read",
		"conversation_id": req.ConversationID,
	})
}

func (h *MessageHandler) MarkConversationAsUnread(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req struct {
		ConversationID   uint   `json:"conversation_id"`
		ConversationType string `json:"conversation_type"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("MarkConversationAsUnread: Failed to decode request body: %v", err)
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	log.Printf("MarkConversationAsUnread: ConversationID=%d, UserID=%d, Type=%s", req.ConversationID, userID, req.ConversationType)

	if req.ConversationID == 0 {
		log.Printf("MarkConversationAsUnread: ConversationID is 0")
		writeError(w, http.StatusBadRequest, "Conversation ID is required")
		return
	}

	if err := h.messageService.MarkConversationAsUnread(req.ConversationID, userID, req.ConversationType); err != nil {
		log.Printf("MarkConversationAsUnread: Service error: %v", err)
		writeError(w, http.StatusInternalServerError, "Failed to mark conversation as unread")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":         "Conversation marked as unread",
		"conversation_id": req.ConversationID,
	})
}

func (h *MessageHandler) SearchMessages(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	query := r.URL.Query().Get("q")
	if strings.TrimSpace(query) == "" {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"results": []interface{}{},
			"count":   0,
		})
		return
	}

	limitStr := r.URL.Query().Get("limit")
	if limitStr == "" {
		limitStr = "20"
	}
	offsetStr := r.URL.Query().Get("offset")
	if offsetStr == "" {
		offsetStr = "0"
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit > 100 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	results, err := h.messageService.SearchMessages(userID, query, limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to search messages")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"results": results,
		"count":   len(results),
		"limit":   limit,
		"offset":  offset,
	})
}
