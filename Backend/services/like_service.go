package services

import (
	"database/sql"
	"social/websocket"
	"time"
)

type LikeService struct {
	db  *sql.DB
	hub *websocket.Hub
}

func NewLikeService(db *sql.DB, hub *websocket.Hub) *LikeService {
	return &LikeService{
		db:  db,
		hub: hub,
	}
}

func (s *LikeService) LikePost(postID, userID uint) error {
	// Check if user already liked the post
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM likes WHERE post_id = ? AND user_id = ?", postID, userID).Scan(&count)
	if err != nil {
		return err
	}

	if count > 0 {
		return nil // Already liked
	}

	// Add like
	query := `INSERT INTO likes (post_id, user_id, created_at) VALUES (?, ?, ?)`
	_, err = s.db.Exec(query, postID, userID, time.Now())
	
	if err == nil && s.hub != nil {
		// Broadcast real-time like update
		likeData := map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
		}
		s.hub.BroadcastLikeUpdate(postID, userID, "like", likeData)
	}
	
	return err
}

func (s *LikeService) UnlikePost(postID, userID uint) error {
	query := `DELETE FROM likes WHERE post_id = ? AND user_id = ?`
	_, err := s.db.Exec(query, postID, userID)
	
	if err == nil && s.hub != nil {
		// Broadcast real-time unlike update
		likeData := map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
		}
		s.hub.BroadcastLikeUpdate(postID, userID, "unlike", likeData)
	}
	
	return err
}

func (s *LikeService) IsPostLikedByUser(postID, userID uint) (bool, error) {
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM likes WHERE post_id = ? AND user_id = ?", postID, userID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (s *LikeService) GetPostLikeCount(postID uint) (int64, error) {
	var count int64
	err := s.db.QueryRow("SELECT COUNT(*) FROM likes WHERE post_id = ?", postID).Scan(&count)
	return count, err
}