package websocket

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	MessageTypePrivateMessage      = "private_message"
	MessageTypeGroupMessage        = "group_message"
	MessageTypeNotification        = "notification"
	MessageTypeUserStatus          = "user_status"
	MessageTypeTyping              = "typing"
	MessageTypePostUpdate          = "post_update"
	MessageTypeGroupPostUpdate     = "group_post_update"
	MessageTypeCommentUpdate       = "comment_update"
	MessageTypeLikeUpdate          = "like_update"
	MessageTypeLike                = "like"
	MessageTypeFollowUpdate        = "follow_update"
	MessageTypeFollow              = "follow"
	MessageTypeUnfollow            = "unfollow"
	MessageTypeFollowRequest       = "follow_request"
	MessageTypeCancelFollowRequest = "cancel_follow_request"
	MessageTypeFollowStatus        = "follow_status"
	MessageTypeFollowerCountUpdate = "follower_count_update"
	MessageTypeGroupUpdate         = "group_update"
	MessageTypeEventUpdate         = "event_update"
	MessageTypeLayoutSync          = "layout_sync"
	MessageTypeSearch              = "search"
	MessageTypeSearchResults       = "search_results"
	MessageTypeError               = "error"
	MessageTypePing                = "ping"
	MessageTypePong                = "pong"
	MessageTypePollUpdate          = "poll_update"
	MessageTypePollVoteUpdate      = "poll_vote_update"
	MessageTypeMessageDeleted      = "message_deleted"
	MessageTypeSharedPost          = "shared_post"
	MessageTypeImageShared         = "image_shared"
)

type Message struct {
	Type      string      `json:"type"`
	From      uint        `json:"from"`
	To        uint        `json:"to,omitempty"`
	GroupID   uint        `json:"group_id,omitempty"`
	PostID    uint        `json:"post_id,omitempty"`
	CommentID uint        `json:"comment_id,omitempty"`
	EventID   uint        `json:"event_id,omitempty"`
	Content   string      `json:"content"`
	Action    string      `json:"action,omitempty"`
	Data      interface{} `json:"data,omitempty"`
	MessageID string      `json:"message_id,omitempty"`
	Timestamp int64       `json:"timestamp"`
}

type Client struct {
	ID        uint
	Hub       *Hub
	Conn      *websocket.Conn
	Send      chan Message
	Groups    map[uint]bool
	Following map[uint]bool
	LastPing  time.Time
	Closed    bool
	mu        sync.RWMutex
}
