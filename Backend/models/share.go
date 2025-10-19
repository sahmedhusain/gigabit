package models

import "time"

type Share struct {
	ID             uint      `json:"id"`
	PostID         uint      `json:"post_id"`
	UserID         uint      `json:"user_id"`
	ConversationID *uint     `json:"conversation_id"` // For private chats
	GroupID        *uint     `json:"group_id"`        // For group chats
	MessageID      uint      `json:"message_id"`      // The message created when sharing
	CreatedAt      time.Time `json:"created_at"`
}

type ShareRequest struct {
	PostID          uint   `json:"post_id" binding:"required"`
	ConversationIDs []uint `json:"conversation_ids"` // Max 5
	GroupIDs        []uint `json:"group_ids"`        // Max 5
	UserIDs         []uint `json:"user_ids"`         // Max 5 - for following users without existing conversations
}
