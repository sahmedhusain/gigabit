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
	// First check if this post exists in group_posts with a valid group_id
	var groupID uint
	var groupPostCount int
	err := s.db.QueryRow("SELECT COUNT(*), COALESCE(group_id, 0) FROM group_posts WHERE id = ?", postID).Scan(&groupPostCount, &groupID)
	if err != nil {
		return err
	}

	isGroupPost := groupPostCount > 0 && groupID > 0

	if isGroupPost {
		// Remove any previous reaction (like or dislike) before liking
		_, err = s.db.Exec("DELETE FROM likes WHERE entity_type = 'group_post' AND entity_id = ? AND user_id = ?", postID, userID)
		if err != nil {
			return err
		}

		query := `INSERT INTO likes (entity_type, entity_id, user_id, reaction_type, created_at) VALUES ('group_post', ?, ?, 'like', ?)`
		_, err = s.db.Exec(query, postID, userID, time.Now())

		if err == nil && s.hub != nil {
			likeData := map[string]interface{}{
				"post_id": postID,
				"user_id": userID,
				"type":    "group_post",
			}
			s.hub.BroadcastLikeUpdate(postID, userID, "like", likeData)
		}

		return err
	}

	var likeCount int
	err = s.db.QueryRow("SELECT COUNT(*) FROM likes WHERE post_id = ? AND user_id = ?", postID, userID).Scan(&likeCount)
	if err != nil {
		return err
	}

	if likeCount > 0 {
		return nil
	}

	query := `INSERT INTO likes (post_id, user_id, created_at) VALUES (?, ?, ?)`
	_, err = s.db.Exec(query, postID, userID, time.Now())

	if err == nil && s.hub != nil {
		likeData := map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
		}
		s.hub.BroadcastLikeUpdate(postID, userID, "like", likeData)
	}

	return err
}

func (s *LikeService) UnlikePost(postID, userID uint) error {
	// First check if this post exists in group_posts with a valid group_id
	var groupID uint
	var groupPostCount int
	err := s.db.QueryRow("SELECT COUNT(*), COALESCE(group_id, 0) FROM group_posts WHERE id = ?", postID).Scan(&groupPostCount, &groupID)
	if err != nil {
		return err
	}

	isGroupPost := groupPostCount > 0 && groupID > 0

	var query string
	if isGroupPost {
		query = `DELETE FROM likes WHERE entity_type = 'group_post' AND entity_id = ? AND user_id = ? AND reaction_type = 'like'`
	} else {
		query = `DELETE FROM likes WHERE post_id = ? AND user_id = ?`
	}

	_, err = s.db.Exec(query, postID, userID)

	if err == nil && s.hub != nil {
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

func (s *LikeService) IsPostGroupPost(postID uint) (bool, uint, error) {
	// First check if this post exists in group_posts with a valid group_id
	var groupID uint
	var groupPostCount int
	err := s.db.QueryRow("SELECT COUNT(*), COALESCE(group_id, 0) FROM group_posts WHERE id = ?", postID).Scan(&groupPostCount, &groupID)
	if err != nil {
		return false, 0, err
	}

	// If it exists in group_posts and has a valid group_id, it's a group post
	if groupPostCount > 0 && groupID > 0 {
		return true, groupID, nil
	}

	// If not in group_posts, check if it exists in the regular posts table
	var regularPostCount int
	err = s.db.QueryRow("SELECT COUNT(*) FROM posts WHERE id = ?", postID).Scan(&regularPostCount)
	if err != nil {
		return false, 0, err
	}

	// If it exists in posts table, it's a regular post
	if regularPostCount > 0 {
		return false, 0, nil
	}

	// Otherwise, it's not found
	return false, 0, nil
}

func (s *LikeService) GetPostLikeCount(postID uint) (int64, error) {
	// First check if this post exists in group_posts with a valid group_id
	var groupID uint
	var groupPostCount int
	err := s.db.QueryRow("SELECT COUNT(*), COALESCE(group_id, 0) FROM group_posts WHERE id = ?", postID).Scan(&groupPostCount, &groupID)
	if err != nil {
		return 0, err
	}

	isGroupPost := groupPostCount > 0 && groupID > 0

	var likeCount int64
	if isGroupPost {
		err = s.db.QueryRow("SELECT COUNT(*) FROM likes WHERE entity_type = 'group_post' AND entity_id = ?", postID).Scan(&likeCount)
	} else {
		err = s.db.QueryRow("SELECT COUNT(*) FROM likes WHERE post_id = ?", postID).Scan(&likeCount)
	}

	return likeCount, err
}

func (s *LikeService) DislikePost(postID, userID uint) error {
	// First check if this post exists in group_posts with a valid group_id
	var groupID uint
	var groupPostCount int
	err := s.db.QueryRow("SELECT COUNT(*), COALESCE(group_id, 0) FROM group_posts WHERE id = ?", postID).Scan(&groupPostCount, &groupID)
	if err != nil {
		return err
	}

	isGroupPost := groupPostCount > 0 && groupID > 0

	if isGroupPost {
		// Remove any previous reaction (like or dislike) before disliking
		_, err = s.db.Exec("DELETE FROM likes WHERE entity_type = 'group_post' AND entity_id = ? AND user_id = ?", postID, userID)
		if err != nil {
			return err
		}

		query := `INSERT INTO likes (entity_type, entity_id, user_id, reaction_type, created_at) VALUES ('group_post', ?, ?, 'dislike', ?)`
		_, err = s.db.Exec(query, postID, userID, time.Now())

		if err == nil && s.hub != nil {
			dislikeData := map[string]interface{}{
				"post_id": postID,
				"user_id": userID,
				"type":    "group_post",
			}
			s.hub.BroadcastLikeUpdate(postID, userID, "dislike", dislikeData)
		}

		return err
	}

	_, err = s.db.Exec("DELETE FROM likes WHERE post_id = ? AND user_id = ?", postID, userID)
	if err != nil {
		return err
	}

	query := `INSERT INTO likes (post_id, user_id, reaction_type, created_at) VALUES (?, ?, 'dislike', ?)`
	_, err = s.db.Exec(query, postID, userID, time.Now())

	if err == nil && s.hub != nil {
		dislikeData := map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
		}
		s.hub.BroadcastLikeUpdate(postID, userID, "dislike", dislikeData)
	}

	return err
}

func (s *LikeService) UndislikePost(postID, userID uint) error {
	// First check if this post exists in group_posts with a valid group_id
	var groupID uint
	var groupPostCount int
	err := s.db.QueryRow("SELECT COUNT(*), COALESCE(group_id, 0) FROM group_posts WHERE id = ?", postID).Scan(&groupPostCount, &groupID)
	if err != nil {
		return err
	}

	isGroupPost := groupPostCount > 0 && groupID > 0

	var query string
	if isGroupPost {
		query = `DELETE FROM likes WHERE entity_type = 'group_post' AND entity_id = ? AND user_id = ? AND reaction_type = 'dislike'`
	} else {
		query = `DELETE FROM likes WHERE post_id = ? AND user_id = ? AND reaction_type = 'dislike'`
	}

	_, err = s.db.Exec(query, postID, userID)

	if err == nil && s.hub != nil {
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
