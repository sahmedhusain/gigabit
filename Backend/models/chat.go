package models

import "time"

type UnifiedChatItem struct {
	ID              string        `json:"id"`
	Type            string        `json:"type"`
	Name            string        `json:"name"`
	Avatar          *string       `json:"avatar,omitempty"`
	LastMessage     *string       `json:"lastMessage,omitempty"`
	LastMessageTime time.Time     `json:"lastMessageTime"`
	HasUnread       bool          `json:"hasUnread"`
	UnreadCount     int           `json:"unreadCount"`
	IsOnline        bool          `json:"isOnline,omitempty"`
	Participants    []UserResponse `json:"participants,omitempty"`
}
