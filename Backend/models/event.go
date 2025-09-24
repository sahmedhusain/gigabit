package models

import (
	"time"
)

type Event struct {
	ID          uint      `json:"id"`
	GroupID     uint      `json:"group_id"`
	CreatorID   uint      `json:"creator_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	EventTime   time.Time `json:"event_time"`
	Location    string    `json:"location"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type EventResponse struct {
	ID            uint                  `json:"id"`
	GroupID       uint                  `json:"group_id"`
	CreatorID     uint                  `json:"creator_id"`
	Title         string                `json:"title"`
	Description   string                `json:"description"`
	EventTime     time.Time             `json:"event_time"`
	Location      string                `json:"location"`
	CreatedAt     time.Time             `json:"created_at"`
	UpdatedAt     time.Time             `json:"updated_at"`
	Creator       UserResponse          `json:"creator"`
	Group         GroupEventResponse    `json:"group"`
	GoingCount    int                   `json:"going_count"`
	NotGoingCount int                   `json:"not_going_count"`
	UserResponse  string                `json:"user_response"` // "going", "not_going", "none"
	Responses     []EventResponseDetail `json:"responses,omitempty"`
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
	Title       string    `json:"title" binding:"min=1,max=100"`
	Description string    `json:"description" binding:"max=500"`
	EventTime   time.Time `json:"event_time"`
	Location    string    `json:"location" binding:"max=200"`
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
