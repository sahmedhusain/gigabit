package models

import "time"

type UnifiedChatItem struct {
	ID                string         `json:"id"`
	Type              string         `json:"type"`
	Name              string         `json:"name"`
	Avatar            *string        `json:"avatar,omitempty"`
	LastMessage       *string        `json:"lastMessage,omitempty"`
	LastMessageTime   *time.Time     `json:"lastMessageTime,omitempty"`
	LastMessageSender *UserResponse  `json:"lastMessageSender,omitempty"`
	HasUnread         bool           `json:"hasUnread"`
	UnreadCount       int            `json:"unreadCount"`
	Unread            int            `json:"unread,omitempty"` // For frontend compatibility
	IsOnline          bool           `json:"isOnline,omitempty"`
	IsTyping          bool           `json:"isTyping,omitempty"`
	TypingUsers       []string       `json:"typingUsers,omitempty"`
	Participants      []UserResponse `json:"participants,omitempty"`
	Participant       *UserResponse  `json:"participant,omitempty"`
	Group             *GroupResponse `json:"group,omitempty"`
	ConversationID    uint           `json:"conversationId"`
	ParticipantID     *uint          `json:"participantId,omitempty"`
	GroupID           *uint          `json:"groupId,omitempty"` // For frontend compatibility
}
