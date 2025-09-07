package services

import (
	"database/sql"
	"log"
	"social/models"
	"social/websocket"
	"time"
)

type PostService struct {
	db  *sql.DB
	hub *websocket.Hub
}

func NewPostService(db *sql.DB, hub *websocket.Hub) *PostService {
	return &PostService{
		db:  db,
		hub: hub,
	}
}

func (s *PostService) CreatePost(post *models.Post) error {
	query := `
		INSERT INTO posts (user_id, content, image_url, privacy, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	result, err := s.db.Exec(query, post.UserID, post.Content, post.ImageURL, post.Privacy, now, now)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	post.ID = uint(id)
	post.CreatedAt = now
	post.UpdatedAt = now

	// Broadcast real-time post creation to followers
	if s.hub != nil {
		postData := map[string]interface{}{
			"id":         post.ID,
			"user_id":    post.UserID,
			"content":    post.Content,
			"image_url":  post.ImageURL,
			"privacy":    post.Privacy,
			"created_at": post.CreatedAt,
		}
		s.hub.BroadcastPostUpdate(post.ID, post.UserID, "create", postData)
	}

	return nil
}

func (s *PostService) AddPostPrivacyUsers(postID uint, userIDs []uint) error {
	if len(userIDs) == 0 {
		return nil
	}

	query := `INSERT INTO post_privacy (post_id, user_id) VALUES (?, ?)`
	
	for _, userID := range userIDs {
		_, err := s.db.Exec(query, postID, userID)
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *PostService) GetPostByID(postID uint, currentUserID uint) (*models.PostResponse, error) {
	query := `
		SELECT p.id, p.user_id, p.content, p.image_url, p.privacy, p.created_at, p.updated_at,
			   u.first_name, u.last_name, u.avatar, u.nickname,
			   COUNT(DISTINCT l.id) as like_count,
			   COUNT(DISTINCT c.id) as comment_count,
			   CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
		FROM posts p
		JOIN users u ON p.user_id = u.id
		LEFT JOIN likes l ON p.id = l.post_id
		LEFT JOIN comments c ON p.id = c.post_id
		LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = ?
		WHERE p.id = ?
		GROUP BY p.id, u.id
	`

	var post models.PostResponse
	var user models.UserResponse

	err := s.db.QueryRow(query, currentUserID, postID).Scan(
		&post.ID, &post.UserID, &post.Content, &post.ImageURL, &post.Privacy,
		&post.CreatedAt, &post.UpdatedAt,
		&user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
		&post.LikeCount, &post.CommentCount, &post.IsLiked,
	)
	if err != nil {
		return nil, err
	}

	user.ID = post.UserID
	post.User = user

	// Check if current user can view this post
	canView, err := s.CanViewPost(postID, currentUserID)
	if err != nil || !canView {
		return nil, err
	}

	// Fetch comments for this post
	commentService := NewCommentService(s.db, s.hub)
	comments, err := commentService.GetPostComments(postID, 50, 0) // Get up to 50 comments
	if err != nil {
		log.Printf("Failed to get comments for post %d: %v", postID, err)
		// Don't fail the request, just set empty comments
		post.Comments = []models.CommentResponse{}
	} else {
		post.Comments = comments
	}

	return &post, nil
}

func (s *PostService) GetUserPosts(userID uint, currentUserID uint, limit, offset int) ([]models.PostResponse, error) {
	query := `
		SELECT p.id, p.user_id, p.content, p.image_url, p.privacy, p.created_at, p.updated_at,
			   u.first_name, u.last_name, u.avatar, u.nickname,
			   COUNT(DISTINCT l.id) as like_count,
			   COUNT(DISTINCT c.id) as comment_count,
			   CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
		FROM posts p
		JOIN users u ON p.user_id = u.id
		LEFT JOIN likes l ON p.id = l.post_id
		LEFT JOIN comments c ON p.id = c.post_id
		LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = ?
		WHERE p.user_id = ?
		GROUP BY p.id, u.id
		ORDER BY p.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(query, currentUserID, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []models.PostResponse
	for rows.Next() {
		var post models.PostResponse
		var user models.UserResponse

		err := rows.Scan(
			&post.ID, &post.UserID, &post.Content, &post.ImageURL, &post.Privacy,
			&post.CreatedAt, &post.UpdatedAt,
			&user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
			&post.LikeCount, &post.CommentCount, &post.IsLiked,
		)
		if err != nil {
			return nil, err
		}

		// Check if current user can view this post
		canView, err := s.CanViewPost(post.ID, currentUserID)
		if err != nil || !canView {
			continue
		}

		user.ID = post.UserID
		post.User = user
		posts = append(posts, post)
	}

	return posts, nil
}

func (s *PostService) GetFeedPosts(currentUserID uint, limit, offset int) ([]models.PostResponse, error) {
	query := `
		SELECT DISTINCT p.id, p.user_id, p.content, p.image_url, p.privacy, p.created_at, p.updated_at,
			   u.first_name, u.last_name, u.avatar, u.nickname,
			   COUNT(DISTINCT l.id) as like_count,
			   COUNT(DISTINCT c.id) as comment_count,
			   CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
		FROM posts p
		JOIN users u ON p.user_id = u.id
		LEFT JOIN likes l ON p.id = l.post_id
		LEFT JOIN comments c ON p.id = c.post_id
		LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = ?
		LEFT JOIN follows f ON p.user_id = f.following_id AND f.follower_id = ? AND f.status = 'accepted'
		LEFT JOIN post_privacy pp ON p.id = pp.post_id
		WHERE (
			-- User's own posts
			p.user_id = ?
			-- Public posts
			OR p.privacy = 'public'
			-- Almost private posts from followed users
			OR (p.privacy = 'almost_private' AND f.id IS NOT NULL)
			-- Private posts specifically shared with user
			OR (p.privacy = 'private' AND pp.user_id = ?)
		)
		GROUP BY p.id, u.id
		ORDER BY p.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(query, currentUserID, currentUserID, currentUserID, currentUserID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []models.PostResponse
	for rows.Next() {
		var post models.PostResponse
		var user models.UserResponse

		err := rows.Scan(
			&post.ID, &post.UserID, &post.Content, &post.ImageURL, &post.Privacy,
			&post.CreatedAt, &post.UpdatedAt,
			&user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
			&post.LikeCount, &post.CommentCount, &post.IsLiked,
		)
		if err != nil {
			return nil, err
		}

		user.ID = post.UserID
		post.User = user
		posts = append(posts, post)
	}

	return posts, nil
}

func (s *PostService) UpdatePost(postID uint, userID uint, updateReq *models.UpdatePostRequest) error {
	// First check if user owns the post
	var ownerID uint
	err := s.db.QueryRow("SELECT user_id FROM posts WHERE id = ?", postID).Scan(&ownerID)
	if err != nil {
		return err
	}

	if ownerID != userID {
		return sql.ErrNoRows // Unauthorized
	}

	query := `
		UPDATE posts SET content = ?, image_url = ?, privacy = ?, updated_at = ?
		WHERE id = ? AND user_id = ?
	`

	now := time.Now()
	_, err = s.db.Exec(query, updateReq.Content, updateReq.ImageURL, updateReq.Privacy, now, postID, userID)
	if err != nil {
		return err
	}

	// Update post privacy if privacy is 'private'
	if updateReq.Privacy == "private" {
		// Clear existing privacy settings
		s.db.Exec("DELETE FROM post_privacy WHERE post_id = ?", postID)
		// Add new privacy settings
		s.AddPostPrivacyUsers(postID, updateReq.SpecificUserIDs)
	}

	return nil
}

func (s *PostService) DeletePost(postID uint, userID uint) error {
	// Check if user owns the post
	var ownerID uint
	err := s.db.QueryRow("SELECT user_id FROM posts WHERE id = ?", postID).Scan(&ownerID)
	if err != nil {
		return err
	}

	if ownerID != userID {
		return sql.ErrNoRows // Unauthorized
	}

	// Delete related data first (foreign key constraints)
	s.db.Exec("DELETE FROM post_privacy WHERE post_id = ?", postID)
	s.db.Exec("DELETE FROM likes WHERE post_id = ?", postID)
	s.db.Exec("DELETE FROM comments WHERE post_id = ?", postID)

	// Delete the post
	_, err = s.db.Exec("DELETE FROM posts WHERE id = ? AND user_id = ?", postID, userID)
	return err
}

func (s *PostService) CanViewPost(postID uint, currentUserID uint) (bool, error) {
	query := `
		SELECT p.user_id, p.privacy
		FROM posts p
		WHERE p.id = ?
	`

	var ownerID uint
	var privacy string
	err := s.db.QueryRow(query, postID).Scan(&ownerID, &privacy)
	if err != nil {
		return false, err
	}

	// User can always view their own posts
	if ownerID == currentUserID {
		return true, nil
	}

	switch privacy {
	case "public":
		return true, nil
	case "almost_private":
		// Check if current user follows the post owner
		return s.isFollowing(currentUserID, ownerID)
	case "private":
		// Check if current user is in the specific user list
		return s.isInPostPrivacyList(postID, currentUserID)
	default:
		return false, nil
	}
}

func (s *PostService) isFollowing(followerID, followingID uint) (bool, error) {
	query := `
		SELECT COUNT(*) FROM follows 
		WHERE follower_id = ? AND following_id = ? AND status = 'accepted'
	`

	var count int
	err := s.db.QueryRow(query, followerID, followingID).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func (s *PostService) isInPostPrivacyList(postID, userID uint) (bool, error) {
	query := `
		SELECT COUNT(*) FROM post_privacy 
		WHERE post_id = ? AND user_id = ?
	`

	var count int
	err := s.db.QueryRow(query, postID, userID).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}