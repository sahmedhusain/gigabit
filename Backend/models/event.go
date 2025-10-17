package models

import (
	"database/sql"
	"encoding/json"
	"time"
)

type Event struct {
	ID           uint           `json:"id"`
	GroupID      uint           `json:"group_id"`
	CreatorID    uint           `json:"creator_id"`
	Title        string         `json:"title"`
	Description  string         `json:"description"`
	EventTime    time.Time      `json:"event_time"`
	Location     string         `json:"location"`
	Canceled     bool           `json:"canceled"`
	CancelReason sql.NullString `json:"cancel_reason"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

// MarshalJSON custom marshaling to handle sql.NullString properly
func (e Event) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]interface{}{
		"id":            e.ID,
		"group_id":      e.GroupID,
		"creator_id":    e.CreatorID,
		"title":         e.Title,
		"description":   e.Description,
		"event_time":    e.EventTime,
		"location":      e.Location,
		"canceled":      e.Canceled,
		"cancel_reason": nullStringToPtr(e.CancelReason),
		"created_at":    e.CreatedAt,
		"updated_at":    e.UpdatedAt,
	})
}

type EventResponse struct {
	ID            uint                  `json:"id"`
	GroupID       uint                  `json:"group_id"`
	CreatorID     uint                  `json:"creator_id"`
	Title         string                `json:"title"`
	Description   string                `json:"description"`
	EventTime     time.Time             `json:"event_time"`
	Location      string                `json:"location"`
	Canceled      bool                  `json:"canceled"`
	CancelReason  sql.NullString        `json:"cancel_reason"`
	CreatedAt     time.Time             `json:"created_at"`
	UpdatedAt     time.Time             `json:"updated_at"`
	Creator       UserResponse          `json:"creator"`
	Group         GroupEventResponse    `json:"group"`
	GoingCount    int                   `json:"going_count"`
	NotGoingCount int                   `json:"not_going_count"`
	UserResponse  string                `json:"user_response"` // "going", "not_going", "none"
	Responses     []EventResponseDetail `json:"responses,omitempty"`
}

// MarshalJSON custom marshaling to handle sql.NullString properly
func (e EventResponse) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]interface{}{
		"id":              e.ID,
		"group_id":        e.GroupID,
		"creator_id":      e.CreatorID,
		"title":           e.Title,
		"description":     e.Description,
		"event_time":      e.EventTime,
		"location":        e.Location,
		"canceled":        e.Canceled,
		"cancel_reason":   nullStringToPtr(e.CancelReason),
		"created_at":      e.CreatedAt,
		"updated_at":      e.UpdatedAt,
		"creator":         e.Creator,
		"group":           e.Group,
		"going_count":     e.GoingCount,
		"not_going_count": e.NotGoingCount,
		"user_response":   e.UserResponse,
		"responses":       e.Responses,
	})
}

// Helper function to convert sql.NullString to *string
func nullStringToPtr(ns sql.NullString) *string {
	if ns.Valid {
		return &ns.String
	}
	return nil
}

type GroupEventResponse struct {
	ID    uint   `json:"id"`
	Title string `json:"title"`
}

type CreateEventRequest struct {
	Title       string    `json:"title" binding:"required,min=1,max=100"`
	Description string    `json:"description" binding:"max=500"`
	EventTime   time.Time `json:"event_time" binding:"required"`
	Location    string    `json:"location" binding:"max=200"`
}

type UpdateEventRequest struct {
	Title       string    `json:"title,omitempty" binding:"omitempty,min=1,max=100"`
	Description string    `json:"description,omitempty" binding:"omitempty,max=500"`
	EventTime   time.Time `json:"event_time"`
	Location    string    `json:"location,omitempty" binding:"omitempty,max=200"`
}

type EventResponseOption struct {
	ID        uint      `json:"id"`
	EventID   uint      `json:"event_id"`
	UserID    uint      `json:"user_id"`
	Option    string    `json:"option"` // "going", "not_going"
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type EventResponseDetail struct {
	ID        uint         `json:"id"`
	EventID   uint         `json:"event_id"`
	User      UserResponse `json:"user"`
	Option    string       `json:"option"`
	CreatedAt time.Time    `json:"created_at"`
}

type EventResponseRequest struct {
	Option string `json:"option" binding:"required,oneof=going not_going"`
}

type CancelEventRequest struct {
	CancelReason string `json:"cancel_reason" binding:"required,min=1,max=200"`
}
