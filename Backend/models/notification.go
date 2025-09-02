package models

import (
	"time"
)

type Notification struct {
	ID         uint      `json:"id"`
	UserID     uint      `json:"user_id"`     // Recipient
	ActorID    uint      `json:"actor_id"`    // Who performed the action
	Type       string    `json:"type"`        // "follow_request", "group_invite", "join_request", "event_created", "message", etc.
	EntityType string    `json:"entity_type"` // "user", "group", "event", "post", "message"
	EntityID   uint      `json:"entity_id"`   // ID of the entity
	Title      string    `json:"title"`
	Message    string    `json:"message"`
	IsRead     bool      `json:"is_read"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type NotificationResponse struct {
	ID         uint         `json:"id"`
	UserID     uint         `json:"user_id"`
	ActorID    uint         `json:"actor_id"`
	Type       string       `json:"type"`
	EntityType string       `json:"entity_type"`
	EntityID   uint         `json:"entity_id"`
	Title      string       `json:"title"`
	Message    string       `json:"message"`
	IsRead     bool         `json:"is_read"`
	CreatedAt  time.Time    `json:"created_at"`
	UpdatedAt  time.Time    `json:"updated_at"`
	Actor      UserResponse `json:"actor"`
	Data       interface{}  `json:"data,omitempty"` // Additional data based on type
}

type CreateNotificationRequest struct {
	UserID     uint        `json:"user_id" binding:"required"`
	Type       string      `json:"type" binding:"required"`
	EntityType string      `json:"entity_type" binding:"required"`
	EntityID   uint        `json:"entity_id" binding:"required"`
	Title      string      `json:"title" binding:"required,max=100"`
	Message    string      `json:"message" binding:"required,max=500"`
	Data       interface{} `json:"data,omitempty"`
}

type MarkNotificationsReadRequest struct {
	NotificationIDs []uint `json:"notification_ids"`
	MarkAll         bool   `json:"mark_all"`
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
	NotificationGroupPostLiked = "group_post_liked"
)
