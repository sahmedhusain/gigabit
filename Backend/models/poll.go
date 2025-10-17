package models

import "time"

// Poll represents a poll created by a user
type Poll struct {
	ID                   uint       `json:"id"`
	UserID               uint       `json:"user_id"`
	GroupID              *uint      `json:"group_id"`
	Title                string     `json:"title"`
	Description          *string    `json:"description"`
	AllowMultipleChoices bool       `json:"allow_multiple_choices"`
	ExpiresAt            *time.Time `json:"expires_at"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}

// PollOption represents a single option in a poll
type PollOption struct {
	ID          uint      `json:"id"`
	PollID      uint      `json:"poll_id"`
	OptionText  string    `json:"option_text"`
	OptionOrder int       `json:"option_order"`
	CreatedAt   time.Time `json:"created_at"`
}

// PollVote represents a user's vote on a poll option
type PollVote struct {
	ID        uint      `json:"id"`
	PollID    uint      `json:"poll_id"`
	OptionID  uint      `json:"option_id"`
	UserID    uint      `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}

// PollOptionResponse includes vote count and voting status
type PollOptionResponse struct {
	ID          uint     `json:"id"`
	OptionText  string   `json:"option_text"`
	OptionOrder int      `json:"option_order"`
	VoteCount   int64    `json:"vote_count"`
	Percentage  float64  `json:"percentage"`
	Voters      []string `json:"voters"`       // Usernames of voters (limited to show)
	TotalVoters int64    `json:"total_voters"` // Total unique voters for this option
}

// PollResponse includes all poll data with options and user voting status
type PollResponse struct {
	ID                   uint                 `json:"id"`
	UserID               uint                 `json:"user_id"`
	GroupID              *uint                `json:"group_id"`
	Title                string               `json:"title"`
	Description          *string              `json:"description"`
	AllowMultipleChoices bool                 `json:"allow_multiple_choices"`
	ExpiresAt            *time.Time           `json:"expires_at"`
	CreatedAt            time.Time            `json:"created_at"`
	UpdatedAt            time.Time            `json:"updated_at"`
	Creator              UserResponse         `json:"creator"`
	Options              []PollOptionResponse `json:"options"`
	TotalVotes           int64                `json:"total_votes"`
	UserVoted            bool                 `json:"user_voted"`
	UserVotes            []uint               `json:"user_votes"` // Option IDs user voted for
	IsExpired            bool                 `json:"is_expired"`
}

// CreatePollRequest is the request payload for creating a new poll
type CreatePollRequest struct {
	GroupID              *uint    `json:"group_id"`
	Title                string   `json:"title" binding:"required,min=3,max=200"`
	Description          string   `json:"description" binding:"max=500"`
	Options              []string `json:"options" binding:"required,min=2,max=10"`
	AllowMultipleChoices bool     `json:"allow_multiple_choices"`
	ExpiresAt            *string  `json:"expires_at"` // ISO 8601 format
}

// VotePollRequest is the request payload for voting on a poll
type VotePollRequest struct {
	OptionIDs []uint `json:"option_ids" binding:"required,min=1"`
}
