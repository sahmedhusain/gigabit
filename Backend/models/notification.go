package models

import (
	"time"
)

type Notification struct {
	ID           uint      `json:"id"`
	UserID       uint      `json:"user_id"`     // Recipient
	ActorID      uint      `json:"actor_id"`    // Who performed the action
	Type         string    `json:"type"`        // "follow_request", "group_invite", "join_request", "event_created", "message", etc.
	EntityType   string    `json:"entity_type"` // "user", "group", "event", "post", "message"
	EntityID     uint      `json:"entity_id"`   // ID of the entity
	Title        string    `json:"title"`
	Message      string    `json:"message"`
	IsRead       bool      `json:"is_read"`
	RedirectURL  string    `json:"redirect_url"`  // e.g., "/chat/123", "/post/456"
	RedirectType string    `json:"redirect_type"` // "chat", "post", "profile", "group", "event", "discover"
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type NotificationResponse struct {
	ID           uint         `json:"id"`
	UserID       uint         `json:"user_id"`
	ActorID      uint         `json:"actor_id"`
	Type         string       `json:"type"`
	EntityType   string       `json:"entity_type"`
	EntityID     uint         `json:"entity_id"`
	Title        string       `json:"title"`
	Message      string       `json:"message"`
	IsRead       bool         `json:"is_read"`
	RedirectURL  string       `json:"redirect_url"`
	RedirectType string       `json:"redirect_type"`
	CreatedAt    time.Time    `json:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at"`
	Actor        UserResponse `json:"actor"`
	Data         interface{}  `json:"data,omitempty"` // Additional data based on type
}

type CreateNotificationRequest struct {
	UserID     uint   `json:"user_id"`
	Type       string `json:"type"`
	EntityType string `json:"entity_type"`
	EntityID   uint   `json:"entity_id"`
	Title      string `json:"title"`
	Message    string `json:"message"`
}

type MarkNotificationsReadRequest struct {
	NotificationIDs []uint `json:"notification_ids"`
	MarkAll         bool   `json:"mark_all"`
}

type NotificationSettings struct {
	ID                 uint                `json:"id"`
	UserID             uint                `json:"user_id"`
	SoundEnabled       bool                `json:"sound_enabled"`
	SoundTheme         string              `json:"sound_theme"` // "classic", "soft", "modern"
	BrowserPushEnabled bool                `json:"browser_push_enabled"`
	QuietHoursEnabled  bool                `json:"quiet_hours_enabled"`
	QuietHoursStart    string              `json:"quiet_hours_start"`   // HH:MM format
	QuietHoursEnd      string              `json:"quiet_hours_end"`     // HH:MM format
	MutedConversations []MutedConversation `json:"muted_conversations"` // conversation IDs with types
	CreatedAt          time.Time           `json:"created_at"`
	UpdatedAt          time.Time           `json:"updated_at"`
}

type MutedConversation struct {
	ID   uint   `json:"id"`
	Type string `json:"type"` // "private" or "group"
}

type NotificationSettingsRequest struct {
	SoundEnabled       bool                `json:"sound_enabled"`
	SoundTheme         string              `json:"sound_theme"`
	BrowserPushEnabled bool                `json:"browser_push_enabled"`
	QuietHoursEnabled  bool                `json:"quiet_hours_enabled"`
	QuietHoursStart    string              `json:"quiet_hours_start"`
	QuietHoursEnd      string              `json:"quiet_hours_end"`
	MutedConversations []MutedConversation `json:"muted_conversations"`
}

// Notification types
const (
	NotificationFollowRequest  = "follow_request"
	NotificationFollowAccepted = "follow_accepted"
	NotificationGroupInvite    = "group_invite"
	NotificationJoinRequest    = "join_request"
	NotificationJoinAccepted   = "join_accepted"
	NotificationEventCreated   = "event_created"
	NotificationNewMessage     = "new_message"
	NotificationPostLiked      = "post_liked"
	NotificationPostCommented  = "post_commented"
	NotificationEventReminder  = "event_reminder"
	NotificationGroupPost      = "group_post"
	NotificationImageShared    = "image_shared"
	NotificationPostShared     = "post_shared"
	NotificationNewPost        = "new_post"
	NotificationNewPoll        = "new_poll"
	NotificationPollVoted      = "poll_voted"
	NotificationEventResponse  = "event_response"
	NotificationCommentReplied = "comment_replied"
	NotificationGroupMessage   = "group_message"
	NotificationPrivateMessage = "private_message"
)
