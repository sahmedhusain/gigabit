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
	// Check if this is a regular post
	var regularPostCount int
	err := s.db.QueryRow("SELECT COUNT(*) FROM posts WHERE id = ?", postID).Scan(&regularPostCount)
	if err != nil {
		return err
	}

	if regularPostCount > 0 {
		// Handle regular post like
		return s.likeRegularPost(postID, userID)
	}

	// Check if this is a group post
	var groupPostCount int
	err = s.db.QueryRow("SELECT COUNT(*) FROM group_posts WHERE id = ?", postID).Scan(&groupPostCount)
	if err != nil {
		return err
	}

	if groupPostCount > 0 {
		// Handle group post like
		return s.likeGroupPost(postID, userID)
	}

	// Post not found
	return sql.ErrNoRows
}

func (s *LikeService) likeRegularPost(postID, userID uint) error {
	// Remove any previous reaction for this user on this post
	_, err := s.db.Exec("DELETE FROM likes WHERE post_id = ? AND user_id = ?", postID, userID)
	if err != nil {
		return err
	}

	// Insert new like
	query := `INSERT INTO likes (user_id, post_id, created_at) VALUES (?, ?, ?)`
	_, err = s.db.Exec(query, userID, postID, time.Now())

	if err == nil && s.hub != nil {
		likeData := map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
		}
		s.hub.BroadcastLikeUpdate(postID, userID, "like", likeData)
	}

	return err
}

func (s *LikeService) likeGroupPost(postID, userID uint) error {
	// Remove any previous reaction for this user on this group post
	_, err := s.db.Exec("DELETE FROM likes WHERE entity_type = 'group_posts' AND entity_id = ? AND user_id = ?", postID, userID)
	if err != nil {
		return err
	}

	// Insert new like
	query := `INSERT INTO likes (user_id, entity_type, entity_id, created_at) VALUES (?, 'group_posts', ?, ?)`
	_, err = s.db.Exec(query, userID, postID, time.Now())

	if err == nil && s.hub != nil {
		likeData := map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
			"type":    "group_posts",
		}
		s.hub.BroadcastLikeUpdate(postID, userID, "like", likeData)
	}

	return err
}

func (s *LikeService) UnlikePost(postID, userID uint) error {
	// Check if this is a regular post
	var regularPostCount int
	err := s.db.QueryRow("SELECT COUNT(*) FROM posts WHERE id = ?", postID).Scan(&regularPostCount)
	if err != nil {
		return err
	}

	if regularPostCount > 0 {
		// Handle regular post unlike
		return s.unlikeRegularPost(postID, userID)
	}

	// Check if this is a group post
	var groupPostCount int
	err = s.db.QueryRow("SELECT COUNT(*) FROM group_posts WHERE id = ?", postID).Scan(&groupPostCount)
	if err != nil {
		return err
	}

	if groupPostCount > 0 {
		// Handle group post unlike
		return s.unlikeGroupPost(postID, userID)
	}

	// Post not found
	return sql.ErrNoRows
}

func (s *LikeService) unlikeRegularPost(postID, userID uint) error {
	query := `DELETE FROM likes WHERE post_id = ? AND user_id = ?`
	_, err := s.db.Exec(query, postID, userID)

	if err == nil && s.hub != nil {
		likeData := map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
		}
		s.hub.BroadcastLikeUpdate(postID, userID, "unlike", likeData)
	}

	return err
}

func (s *LikeService) unlikeGroupPost(postID, userID uint) error {
	query := `DELETE FROM likes WHERE entity_type = 'group_posts' AND entity_id = ? AND user_id = ?`
	_, err := s.db.Exec(query, postID, userID)

	if err == nil && s.hub != nil {
		likeData := map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
			"type":    "group_posts",
		}
		s.hub.BroadcastLikeUpdate(postID, userID, "unlike", likeData)
	}

	return err
}

func (s *LikeService) IsPostGroupPost(postID uint) (bool, uint, error) {
	// Check if this is a regular post first (consistent with LikePost method)
	var regularPostCount int
	err := s.db.QueryRow("SELECT COUNT(*) FROM posts WHERE id = ?", postID).Scan(&regularPostCount)
	if err != nil {
		return false, 0, err
	}

	if regularPostCount > 0 {
		// This is a regular post, even if it also exists in group_posts (prioritize regular posts)
		return false, 0, nil
	}

	// Check if this is a group post
	var groupID uint
	var groupPostCount int
	err = s.db.QueryRow("SELECT COUNT(*), COALESCE(group_id, 0) FROM group_posts WHERE id = ?", postID).Scan(&groupPostCount, &groupID)
	if err != nil {
		return false, 0, err
	}

	if groupPostCount > 0 && groupID > 0 {
		return true, groupID, nil
	}

	// Post not found
	return false, 0, sql.ErrNoRows
}

func (s *LikeService) GetPostLikeCount(postID uint) (int64, error) {
	// Check if this is a regular post
	var regularPostCount int
	err := s.db.QueryRow("SELECT COUNT(*) FROM posts WHERE id = ?", postID).Scan(&regularPostCount)
	if err != nil {
		return 0, err
	}

	if regularPostCount > 0 {
		var likeCount int64
		err = s.db.QueryRow("SELECT COUNT(*) FROM likes WHERE post_id = ?", postID).Scan(&likeCount)
		return likeCount, err
	}

	// Check if this is a group post
	var groupPostCount int
	err = s.db.QueryRow("SELECT COUNT(*) FROM group_posts WHERE id = ?", postID).Scan(&groupPostCount)
	if err != nil {
		return 0, err
	}

	if groupPostCount > 0 {
		var likeCount int64
		err = s.db.QueryRow("SELECT COUNT(*) FROM likes WHERE entity_type = 'group_posts' AND entity_id = ?", postID).Scan(&likeCount)
		return likeCount, err
	}

	// Post not found
	return 0, sql.ErrNoRows
}

func (s *LikeService) DislikePost(postID, userID uint) error {
	// Check if this is a regular post
	var regularPostCount int
	err := s.db.QueryRow("SELECT COUNT(*) FROM posts WHERE id = ?", postID).Scan(&regularPostCount)
	if err != nil {
		return err
	}

	if regularPostCount > 0 {
		// Handle regular post dislike
		return s.dislikeRegularPost(postID, userID)
	}

	// Check if this is a group post
	var groupPostCount int
	err = s.db.QueryRow("SELECT COUNT(*) FROM group_posts WHERE id = ?", postID).Scan(&groupPostCount)
	if err != nil {
		return err
	}

	if groupPostCount > 0 {
		// Handle group post dislike
		return s.dislikeGroupPost(postID, userID)
	}

	// Post not found
	return sql.ErrNoRows
}

func (s *LikeService) dislikeRegularPost(postID, userID uint) error {
	// Remove any previous reaction for this user on this post
	_, err := s.db.Exec("DELETE FROM likes WHERE post_id = ? AND user_id = ?", postID, userID)
	if err != nil {
		return err
	}

	// Insert new dislike
	query := `INSERT INTO likes (user_id, post_id, reaction_type, created_at) VALUES (?, ?, 'dislike', ?)`
	_, err = s.db.Exec(query, userID, postID, time.Now())

	if err == nil && s.hub != nil {
		dislikeData := map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
		}
		s.hub.BroadcastLikeUpdate(postID, userID, "dislike", dislikeData)
	}

	return err
}

func (s *LikeService) dislikeGroupPost(postID, userID uint) error {
	// Remove any previous reaction for this user on this group post
	_, err := s.db.Exec("DELETE FROM likes WHERE entity_type = 'group_posts' AND entity_id = ? AND user_id = ?", postID, userID)
	if err != nil {
		return err
	}

	// Insert new dislike
	query := `INSERT INTO likes (user_id, entity_type, entity_id, reaction_type, created_at) VALUES (?, 'group_posts', ?, 'dislike', ?)`
	_, err = s.db.Exec(query, userID, postID, time.Now())

	if err == nil && s.hub != nil {
		dislikeData := map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
			"type":    "group_posts",
		}
		s.hub.BroadcastLikeUpdate(postID, userID, "dislike", dislikeData)
	}

	return err
}

func (s *LikeService) UndislikePost(postID, userID uint) error {
	// Check if this is a regular post
	var regularPostCount int
	err := s.db.QueryRow("SELECT COUNT(*) FROM posts WHERE id = ?", postID).Scan(&regularPostCount)
	if err != nil {
		return err
	}

	if regularPostCount > 0 {
		// Handle regular post undislike
		return s.undislikeRegularPost(postID, userID)
	}

	// Check if this is a group post
	var groupPostCount int
	err = s.db.QueryRow("SELECT COUNT(*) FROM group_posts WHERE id = ?", postID).Scan(&groupPostCount)
	if err != nil {
		return err
	}

	if groupPostCount > 0 {
		// Handle group post undislike
		return s.undislikeGroupPost(postID, userID)
	}

	// Post not found
	return sql.ErrNoRows
}

func (s *LikeService) undislikeRegularPost(postID, userID uint) error {
	query := `DELETE FROM likes WHERE post_id = ? AND user_id = ? AND reaction_type = 'dislike'`
	_, err := s.db.Exec(query, postID, userID)

	if err == nil && s.hub != nil {
		dislikeData := map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
		}
		s.hub.BroadcastLikeUpdate(postID, userID, "undislike", dislikeData)
	}

	return err
}

func (s *LikeService) undislikeGroupPost(postID, userID uint) error {
	query := `DELETE FROM likes WHERE entity_type = 'group_posts' AND entity_id = ? AND user_id = ? AND reaction_type = 'dislike'`
	_, err := s.db.Exec(query, postID, userID)

	if err == nil && s.hub != nil {
		dislikeData := map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
			"type":    "group_posts",
		}
		s.hub.BroadcastLikeUpdate(postID, userID, "undislike", dislikeData)
	}

	return err
}

func (s *LikeService) LikeGroupPost(postID, userID uint) error {
	// Remove any previous reaction for this user on this group post
	_, err := s.db.Exec("DELETE FROM likes WHERE entity_type = 'group_posts' AND entity_id = ? AND user_id = ?", postID, userID)
	if err != nil {
		return err
	}

	// Insert new like
	query := `INSERT INTO likes (user_id, entity_type, entity_id, created_at) VALUES (?, 'group_posts', ?, ?)`
	_, err = s.db.Exec(query, userID, postID, time.Now())

	if err == nil && s.hub != nil {
		likeData := map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
			"type":    "group_posts",
		}
		s.hub.BroadcastLikeUpdate(postID, userID, "like", likeData)
	}

	return err
}

func (s *LikeService) UnlikeGroupPost(postID, userID uint) error {
	query := `DELETE FROM likes WHERE entity_type = 'group_posts' AND entity_id = ? AND user_id = ?`
	_, err := s.db.Exec(query, postID, userID)

	if err == nil && s.hub != nil {
		likeData := map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
			"type":    "group_posts",
		}
		s.hub.BroadcastLikeUpdate(postID, userID, "unlike", likeData)
	}

	return err
}

func (s *LikeService) DislikeGroupPost(postID, userID uint) error {
	// Remove any previous reaction for this user on this group post
	_, err := s.db.Exec("DELETE FROM likes WHERE entity_type = 'group_posts' AND entity_id = ? AND user_id = ?", postID, userID)
	if err != nil {
		return err
	}

	// Insert new dislike
	query := `INSERT INTO likes (user_id, entity_type, entity_id, reaction_type, created_at) VALUES (?, 'group_posts', ?, 'dislike', ?)`
	_, err = s.db.Exec(query, userID, postID, time.Now())

	if err == nil && s.hub != nil {
		dislikeData := map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
			"type":    "group_posts",
		}
		s.hub.BroadcastLikeUpdate(postID, userID, "dislike", dislikeData)
	}

	return err
}

func (s *LikeService) UndislikeGroupPost(postID, userID uint) error {
	query := `DELETE FROM likes WHERE entity_type = 'group_posts' AND entity_id = ? AND user_id = ? AND reaction_type = 'dislike'`
	_, err := s.db.Exec(query, postID, userID)

	if err == nil && s.hub != nil {
		dislikeData := map[string]interface{}{
			"post_id": postID,
			"user_id": userID,
			"type":    "group_posts",
		}
		s.hub.BroadcastLikeUpdate(postID, userID, "undislike", dislikeData)
	}

	return err
}
