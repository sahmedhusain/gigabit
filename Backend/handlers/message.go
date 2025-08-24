package handlers

import (
"database/sql"
"encoding/json"
"net/http"
"social/models"
"social/services"
"social/websocket"
"strconv"
"time"
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
message.ImageURL = &req.ImageURL
}

var err error
if req.MessageType == "private" {
if req.ReceiverID == 0 {
writeError(w, http.StatusBadRequest, "Receiver ID required for private messages")
return
}
message.ReceiverID = req.ReceiverID
err = h.messageService.SendPrivateMessage(message)
} else if req.MessageType == "group" {
if req.GroupID == 0 {
writeError(w, http.StatusBadRequest, "Group ID required for group messages")
return
}
message.GroupID = &req.GroupID
err = h.messageService.SendGroupMessage(message)
}

if err != nil {
if err == sql.ErrNoRows {
writeError(w, http.StatusForbidden, "Cannot send message")
} else {
writeError(w, http.StatusInternalServerError, "Failed to send message")
}
return
}

// Send real-time message via websocket
wsMessage := websocket.Message{
Type:      websocket.MessageTypePrivateMessage,
From:      userID,
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

writeJSON(w, http.StatusCreated, map[string]interface{}{
"message": "Message sent successfully",
"data":    message,
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

// Get pagination parameters
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

// Get pagination parameters
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

conversations, err := h.messageService.GetUserConversations(userID)
if err != nil {
writeError(w, http.StatusInternalServerError, "Failed to get conversations")
return
}

writeJSON(w, http.StatusOK, map[string]interface{}{
"conversations": conversations,
"count":         len(conversations),
})
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

// Send typing indicator via websocket
wsMessage := websocket.Message{
Type:      websocket.MessageTypeTyping,
From:      userID,
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

writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Typing indicator sent"})
}
