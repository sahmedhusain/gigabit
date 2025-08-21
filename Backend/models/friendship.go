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

type Follow struct {
	ID          uint      `json:"id"`
	FollowerID  uint      `json:"follower_id"`
	FollowingID uint      `json:"following_id"`
	Status      string    `json:"status"` // "pending", "accepted", "declined"
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type FollowUserResponse struct {
	ID         uint      `json:"id"`
	FirstName  string    `json:"first_name"`
	LastName   string    `json:"last_name"`
	Avatar     *string   `json:"avatar"`
	Nickname   *string   `json:"nickname"`
	FollowedAt time.Time `json:"followed_at"`
}

type FollowRequestResponse struct {
	RequestID   uint               `json:"request_id"`
	User        FollowUserResponse `json:"user"`
	RequestedAt time.Time          `json:"requested_at"`
}
