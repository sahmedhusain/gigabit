package models

import "time"

type UnifiedChatItem struct {
	ID              string         `json:"id"`
	Type            string         `json:"type"`
	Name            string         `json:"name"`
	Avatar          *string        `json:"avatar,omitempty"`
	LastMessage     *string        `json:"lastMessage,omitempty"`
	LastMessageTime time.Time      `json:"lastMessageTime"`
	HasUnread       bool           `json:"hasUnread"`
	UnreadCount     int            `json:"unreadCount"`
	IsOnline        bool           `json:"isOnline,omitempty"`
	IsTyping        bool           `json:"isTyping,omitempty"`
	TypingUsers     []string       `json:"typingUsers,omitempty"`
	Participants    []UserResponse `json:"participants,omitempty"`
	Participant     *UserResponse  `json:"participant,omitempty"`
	Group           *GroupResponse `json:"group,omitempty"`
	ConversationID  uint           `json:"conversationId"`
	ParticipantID   *uint          `json:"participantId,omitempty"`
}
