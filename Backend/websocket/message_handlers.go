package websocket

import (
	"log"
)

// handleMessage processes different types of messages
func (h *Hub) handleMessage(message Message) {
	switch message.Type {
	case MessageTypePrivateMessage:
		h.handlePrivateMessage(message)
	case MessageTypeGroupMessage:
		h.handleGroupMessage(message)
	case MessageTypeNotification:
		h.handleNotification(message)
	case MessageTypeUserStatus:
		h.handleUserStatus(message)
	case MessageTypeTyping:
		h.handleTypingIndicator(message)
	case MessageTypePostUpdate:
		h.handlePostUpdate(message)
	case MessageTypeGroupPostUpdate:
		h.handleGroupPostUpdate(message)
	case MessageTypeCommentUpdate:
		if message.Action == "create" {
			h.handleCommentCreate(message)
		} else {
			h.handleCommentUpdate(message)
		}
	case MessageTypeLikeUpdate:
		h.handleLikeUpdate(message)
	case MessageTypeLike:
		h.handleLike(message)
	case MessageTypeFollowUpdate:
		h.handleFollowUpdate(message)
	case MessageTypeFollow:
		h.handleFollow(message)
	case MessageTypeUnfollow:
		h.handleUnfollow(message)
	case MessageTypeFollowRequest:
		h.handleFollowRequest(message)
	case MessageTypeCancelFollowRequest:
		h.handleCancelFollowRequest(message)
	case MessageTypeGroupUpdate:
		h.handleGroupUpdate(message)
	case MessageTypeEventUpdate:
		h.handleEventUpdate(message)
	case MessageTypePing:
		h.handlePing(message)
	case MessageTypePong:
		h.handlePong(message)
	default:
		log.Printf("Unknown message type: %s", message.Type)
	}
}

