package websocket

import (
	"time"
)

func (h *Hub) loadUserGroups(client *Client) {
	if h.db == nil {
		return
	}
	query := `SELECT group_id FROM group_members WHERE user_id = ? AND status = 'member'`
	rows, err := h.db.Query(query, client.ID)
	if err != nil {
		return
	}
	defer rows.Close()
	client.mu.Lock()
	defer client.mu.Unlock()
	for rows.Next() {
		var groupID uint
		if err := rows.Scan(&groupID); err != nil {
			continue
		}
		client.Groups[groupID] = true
	}
}

func (h *Hub) loadUserFollowing(client *Client) {
	if h.db == nil {
		return
	}
	query := `SELECT following_id FROM follows WHERE follower_id = ? AND status = 'accepted'`
	rows, err := h.db.Query(query, client.ID)
	if err != nil {
		return
	}
	defer rows.Close()
	client.mu.Lock()
	defer client.mu.Unlock()
	for rows.Next() {
		var followingID uint
		if err := rows.Scan(&followingID); err != nil {
			continue
		}
		client.Following[followingID] = true
	}
}

func (h *Hub) sendErrorMessage(userID uint, errorMsg string) {
	h.SendToUser(userID, Message{
		Type:      MessageTypeError,
		From:      0,
		To:        userID,
		Content:   errorMsg,
		Timestamp: time.Now().Unix(),
	})
}
