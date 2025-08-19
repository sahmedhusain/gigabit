package models

import (
	"time"
)

type FriendshipStatus string

const (
	FriendshipPending  FriendshipStatus = "pending"
	FriendshipAccepted FriendshipStatus = "accepted"
	FriendshipBlocked  FriendshipStatus = "blocked"
)

type Friendship struct {
	ID          uint             `json:"id"`
	RequesterID uint             `json:"requester_id"`
	RequesteeID uint             `json:"requestee_id"`
	Status      FriendshipStatus `json:"status"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
}

type FriendshipResponse struct {
	ID          uint             `json:"id"`
	RequesterID uint             `json:"requester_id"`
	AddresseeID uint             `json:"addressee_id"`
	Status      FriendshipStatus `json:"status"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
	Requester   UserResponse     `json:"requester"`
	Addressee   UserResponse     `json:"addressee"`
}

type FriendRequest struct {
	AddresseeID uint `json:"addressee_id" binding:"required"`
}
