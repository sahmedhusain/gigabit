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
	// First check if this is a group post
	var isGroupPost bool
	err := s.db.QueryRow("SELECT COUNT(*) > 0 FROM group_posts WHERE id = ?", postID).Scan(&isGroupPost)
	if err != nil {
		return err
	}

	if isGroupPost {
		// Check if user already liked the group post
		var count int
		err := s.db.QueryRow("SELECT COUNT(*) FROM likes WHERE entity_type = 'group_post' AND entity_id = ? AND user_id = ?", postID, userID).Scan(&count)
		if err != nil {
			return err
		}

		if count > 0 {
			return nil // Already liked
		}

		// Add like for group post
		query := `INSERT INTO likes (entity_type, entity_id, user_id, created_at) VALUES ('group_post', ?, ?, ?)`
		_, err = s.db.Exec(query, postID, userID, time.Now())

		if err == nil && s.hub != nil {
			// Broadcast real-time like update
			likeData := map[string]interface{}{
				"post_id": postID,
				"user_id": userID,
				"type":    "group_post",
			}
			s.hub.BroadcastLikeUpdate(postID, userID, "like", likeData)
		}

		return err
	}

	// Regular post handling
	// Check if user already liked the post
	var count int
	err = s.db.QueryRow("SELECT COUNT(*) FROM likes WHERE post_id = ? AND user_id = ?", postID, userID).Scan(&count)
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
	// First check if this is a group post
	var isGroupPost bool
	err := s.db.QueryRow("SELECT COUNT(*) > 0 FROM group_posts WHERE id = ?", postID).Scan(&isGroupPost)
	if err != nil {
		return err
	}

	var query string
	if isGroupPost {
		query = `DELETE FROM likes WHERE entity_type = 'group_post' AND entity_id = ? AND user_id = ?`
	} else {
		query = `DELETE FROM likes WHERE post_id = ? AND user_id = ?`
	}

	_, err = s.db.Exec(query, postID, userID)

	if err == nil && s.hub != nil {
		// Broadcast real-time unlike update
		likeData := map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
		}
		if isGroupPost {
			likeData["type"] = "group_post"
		}
		s.hub.BroadcastLikeUpdate(postID, userID, "unlike", likeData)
	}

	return err
}

func (s *LikeService) IsPostLikedByUser(postID, userID uint) (bool, error) {
	// First check if this is a group post
	var isGroupPost bool
	err := s.db.QueryRow("SELECT COUNT(*) > 0 FROM group_posts WHERE id = ?", postID).Scan(&isGroupPost)
	if err != nil {
		return false, err
	}

	var count int
	if isGroupPost {
		err = s.db.QueryRow("SELECT COUNT(*) FROM likes WHERE entity_type = 'group_post' AND entity_id = ? AND user_id = ?", postID, userID).Scan(&count)
	} else {
		err = s.db.QueryRow("SELECT COUNT(*) FROM likes WHERE post_id = ? AND user_id = ?", postID, userID).Scan(&count)
	}

	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (s *LikeService) GetPostLikeCount(postID uint) (int64, error) {
	// First check if this is a group post
	var isGroupPost bool
	err := s.db.QueryRow("SELECT COUNT(*) > 0 FROM group_posts WHERE id = ?", postID).Scan(&isGroupPost)
	if err != nil {
		return 0, err
	}

	var count int64
	if isGroupPost {
		err = s.db.QueryRow("SELECT COUNT(*) FROM likes WHERE entity_type = 'group_post' AND entity_id = ?", postID).Scan(&count)
	} else {
		err = s.db.QueryRow("SELECT COUNT(*) FROM likes WHERE post_id = ?", postID).Scan(&count)
	}

	return count, err
}

// DislikePost adds a dislike to a post (removes any existing like first)
func (s *LikeService) DislikePost(postID, userID uint) error {
	// First check if this is a group post
	var isGroupPost bool
	err := s.db.QueryRow("SELECT COUNT(*) > 0 FROM group_posts WHERE id = ?", postID).Scan(&isGroupPost)
	if err != nil {
		return err
	}

	if isGroupPost {
		// Remove any existing like or dislike first
		_, err = s.db.Exec("DELETE FROM likes WHERE entity_type = 'group_post' AND entity_id = ? AND user_id = ?", postID, userID)
		if err != nil {
			return err
		}

		// Add dislike for group post
		query := `INSERT INTO likes (entity_type, entity_id, user_id, reaction_type, created_at) VALUES ('group_post', ?, ?, 'dislike', ?)`
		_, err = s.db.Exec(query, postID, userID, time.Now())

		if err == nil && s.hub != nil {
			// Broadcast real-time dislike update
			dislikeData := map[string]interface{}{
				"post_id": postID,
				"user_id": userID,
				"type":    "group_post",
			}
			s.hub.BroadcastLikeUpdate(postID, userID, "dislike", dislikeData)
		}

		return err
	}

	// Regular post handling
	// Remove any existing like or dislike first
	_, err = s.db.Exec("DELETE FROM likes WHERE post_id = ? AND user_id = ?", postID, userID)
	if err != nil {
		return err
	}

	// Add dislike
	query := `INSERT INTO likes (post_id, user_id, reaction_type, created_at) VALUES (?, ?, 'dislike', ?)`
	_, err = s.db.Exec(query, postID, userID, time.Now())

	if err == nil && s.hub != nil {
		// Broadcast real-time dislike update
		dislikeData := map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
		}
		s.hub.BroadcastLikeUpdate(postID, userID, "dislike", dislikeData)
	}

	return err
}

// UndislikePost removes a dislike from a post
func (s *LikeService) UndislikePost(postID, userID uint) error {
	// First check if this is a group post
	var isGroupPost bool
	err := s.db.QueryRow("SELECT COUNT(*) > 0 FROM group_posts WHERE id = ?", postID).Scan(&isGroupPost)
	if err != nil {
		return err
	}

	var query string
	if isGroupPost {
		query = `DELETE FROM likes WHERE entity_type = 'group_post' AND entity_id = ? AND user_id = ? AND reaction_type = 'dislike'`
	} else {
		query = `DELETE FROM likes WHERE post_id = ? AND user_id = ? AND reaction_type = 'dislike'`
	}

	_, err = s.db.Exec(query, postID, userID)

	if err == nil && s.hub != nil {
		// Broadcast real-time undislike update
		dislikeData := map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
		}
		if isGroupPost {
			dislikeData["type"] = "group_post"
		}
		s.hub.BroadcastLikeUpdate(postID, userID, "undislike", dislikeData)
	}

	return err
}
