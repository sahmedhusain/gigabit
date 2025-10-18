package models

import (
	"time"
)

type Message struct {
	ID          uint      `json:"id"`
	SenderID    uint      `json:"sender_id"`
	ReceiverID  uint      `json:"receiver_id"`
	GroupID     *uint     `json:"group_id"` // Null for private messages
	Content     string    `json:"content"`
	ImageURL    *string   `json:"image_url"`
	MessageType string    `json:"message_type"` // "private", "group"
	IsRead      bool      `json:"is_read"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type MessageResponse struct {
	ID          uint                  `json:"id"`
	SenderID    uint                  `json:"sender_id"`
	ReceiverID  uint                  `json:"receiver_id"`
	GroupID     *uint                 `json:"group_id"`
	Content     string                `json:"content"`
	ImageURL    *string               `json:"image_url"`
	MessageType string                `json:"message_type"`
	IsRead      bool                  `json:"is_read"`
	CreatedAt   time.Time             `json:"created_at"`
	UpdatedAt   time.Time             `json:"updated_at"`
	Sender      UserResponse          `json:"sender"`
	Receiver    *UserResponse         `json:"receiver,omitempty"` // Null for group messages
	Group       *GroupMessageResponse `json:"group,omitempty"`    // Null for private messages
}

type GroupMessageResponse struct {
	ID    uint   `json:"id"`
	Title string `json:"title"`
}

type CreateMessageRequest struct {
	ReceiverID  uint   `json:"receiver_id,omitempty"`
	GroupID     uint   `json:"group_id,omitempty"`
	Content     string `json:"content" binding:"required,min=1,max=1000"`
	ImageURL    string `json:"image_url"`
	MessageType string `json:"message_type" binding:"required,oneof=private group"`
}

type Conversation struct {
	ID            string                `json:"id"`
	ParticipantID uint                  `json:"participant_id,omitempty"` // For private chats
	GroupID       uint                  `json:"group_id,omitempty"`       // For group chats
	LastMessage   MessageResponse       `json:"last_message"`
	UnreadCount   int                   `json:"unread_count"`
	UpdatedAt     time.Time             `json:"updated_at"`
	Participant   *UserResponse         `json:"participant,omitempty"`
	Group         *GroupMessageResponse `json:"group,omitempty"`
}

type PrivateConversation struct {
	ID             uint      `json:"id"`
	Participant1ID uint      `json:"participant1_id"`
	Participant2ID uint      `json:"participant2_id"`
	LastMessageID  *uint     `json:"last_message_id,omitempty"`
	UnreadCount1   int       `json:"unread_count1"`
	UnreadCount2   int       `json:"unread_count2"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type GroupConversation struct {
	ID            uint      `json:"id"`
	GroupID       uint      `json:"group_id"`
	LastMessageID *uint     `json:"last_message_id,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type MarkReadRequest struct {
	MessageIDs []uint `json:"message_ids" binding:"required"`
}

type TypingIndicator struct {
	UserID         uint   `json:"user_id"`
	ConversationID string `json:"conversation_id"`
	IsTyping       bool   `json:"is_typing"`
}

type ConversationResponse struct {
	ID          uint            `json:"id"`
	Type        string          `json:"type"` // "private" or "group"
	Participant *UserResponse   `json:"participant,omitempty"`
	Group       *GroupResponse  `json:"group,omitempty"`
	LastMessage *MessageSummary `json:"last_message,omitempty"`
	UnreadCount int             `json:"unread_count"`
	UpdatedAt   string          `json:"updated_at"`
}

type MessageSummary struct {
	Content   string        `json:"content"`
	CreatedAt string        `json:"created_at"`
	SenderID  uint          `json:"sender_id,omitempty"`
	Sender    *UserResponse `json:"sender,omitempty"`
}

type ConversationSearchResult struct {
	Type              string    `json:"type"` // "private" or "group"
	ConversationID    uint      `json:"conversation_id"`
	ParticipantID     uint      `json:"participant_id,omitempty"` // For private chats
	GroupID           *uint     `json:"group_id,omitempty"`       // For group chats
	GroupName         *string   `json:"group_name,omitempty"`
	GroupAvatar       *string   `json:"group_avatar,omitempty"`
	ParticipantName   string    `json:"participant_name"`
	ParticipantAvatar *string   `json:"participant_avatar,omitempty"`
	SenderName        string    `json:"sender_name"`
	SenderAvatar      *string   `json:"sender_avatar,omitempty"`
	MatchingMessageID uint      `json:"matching_message_id"`
	MatchingMessage   string    `json:"matching_message"`
	MessageTime       time.Time `json:"message_time"`
}
