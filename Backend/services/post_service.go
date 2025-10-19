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

func (s *PostService) GetPostPrivacyUsers(postID uint) ([]uint, error) {
	query := `SELECT user_id FROM post_privacy WHERE post_id = ?`

	rows, err := s.db.Query(query, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userIDs []uint
	for rows.Next() {
		var userID uint
		err := rows.Scan(&userID)
		if err != nil {
			return nil, err
		}
		userIDs = append(userIDs, userID)
	}

	return userIDs, nil
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
	return s.GetPostByIDWithSort(postID, currentUserID, "newest")
}

func (s *PostService) GetPostByIDWithSort(postID uint, currentUserID uint, sort string) (*models.PostResponse, error) {
	query := `
SELECT p.id, p.user_id, p.content, p.image_url, p.privacy, p.share_count, p.created_at, p.updated_at,
       u.first_name, u.last_name, u.avatar, u.nickname,
       COUNT(DISTINCT l.id) as like_count,
       COUNT(DISTINCT c.id) as comment_count,
       CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END as is_liked,
       CASE WHEN b.id IS NOT NULL THEN 1 ELSE 0 END as is_bookmarked
FROM posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN likes l ON p.id = l.post_id
LEFT JOIN comments c ON p.id = c.post_id
LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = ?
LEFT JOIN bookmarks b ON p.id = b.post_id AND b.user_id = ?
WHERE p.id = ?
GROUP BY p.id, u.id
`

	var post models.PostResponse
	var user models.UserResponse

	err := s.db.QueryRow(query, currentUserID, currentUserID, postID).Scan(
		&post.ID, &post.UserID, &post.Content, &post.ImageURL, &post.Privacy, &post.ShareCount,
		&post.CreatedAt, &post.UpdatedAt,
		&user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
		&post.LikeCount, &post.CommentCount, &post.IsLiked, &post.IsBookmarked,
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

	// Fetch specific user IDs for listed posts
	if post.Privacy == "listed" {
		userIDs, err := s.GetPostPrivacyUsers(postID)
		if err != nil {
			log.Printf("Failed to get privacy users for post %d: %v", postID, err)
			// Don't fail the request, just set empty list
			post.SpecificUserIDs = []uint{}
		} else {
			post.SpecificUserIDs = userIDs
		}
	}

	// Fetch comments for this post
	commentService := NewCommentService(s.db, s.hub)
	comments, err := commentService.GetPostCommentsSorted(postID, 50, 0, sort) // Get up to 50 comments
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
SELECT p.id, p.user_id, p.content, p.image_url, p.privacy, p.share_count, p.created_at, p.updated_at,
   u.first_name, u.last_name, u.avatar, u.nickname,
   COUNT(DISTINCT l.id) as like_count,
   COUNT(DISTINCT c.id) as comment_count,
   CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END as is_liked,
   CASE WHEN b.id IS NOT NULL THEN 1 ELSE 0 END as is_bookmarked
FROM posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN likes l ON p.id = l.post_id
LEFT JOIN comments c ON p.id = c.post_id
LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = ?
LEFT JOIN bookmarks b ON p.id = b.post_id AND b.user_id = ?
WHERE p.user_id = ?
GROUP BY p.id, u.id
ORDER BY p.created_at DESC
LIMIT ? OFFSET ?
`

	rows, err := s.db.Query(query, currentUserID, currentUserID, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []models.PostResponse
	for rows.Next() {
		var post models.PostResponse
		var user models.UserResponse

		err := rows.Scan(
			&post.ID, &post.UserID, &post.Content, &post.ImageURL, &post.Privacy, &post.ShareCount,
			&post.CreatedAt, &post.UpdatedAt,
			&user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
			&post.LikeCount, &post.CommentCount, &post.IsLiked, &post.IsBookmarked,
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
SELECT p.id, p.user_id, p.content, p.image_url, p.privacy, p.share_count, p.created_at, p.updated_at,
   u.first_name, u.last_name, u.avatar, u.nickname,
   (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
   (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
   (SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked,
   (SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM bookmarks WHERE post_id = p.id AND user_id = ?) as is_bookmarked
FROM posts p
JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC
LIMIT ? OFFSET ?
`

	rows, err := s.db.Query(query, currentUserID, currentUserID, limit, offset)
	if err != nil {
		log.Printf("Error getting feed posts: %v", err)
		return nil, err
	}
	defer rows.Close()

	var posts []models.PostResponse
	for rows.Next() {
		var post models.PostResponse
		var user models.UserResponse

		err := rows.Scan(
			&post.ID, &post.UserID, &post.Content, &post.ImageURL, &post.Privacy, &post.ShareCount,
			&post.CreatedAt, &post.UpdatedAt,
			&user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
			&post.LikeCount, &post.CommentCount, &post.IsLiked, &post.IsBookmarked,
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

	// Update post privacy if privacy is 'listed'
	if updateReq.Privacy == "listed" {
		// Clear existing privacy settings
		s.db.Exec("DELETE FROM post_privacy WHERE post_id = ?", postID)
		// Add new privacy settings
		s.AddPostPrivacyUsers(postID, updateReq.SpecificUserIDs)
	} else {
		// If not listed, clear any existing privacy settings
		s.db.Exec("DELETE FROM post_privacy WHERE post_id = ?", postID)
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
	case "followers":
		// Check if current user follows the post owner
		return s.isFollowing(currentUserID, ownerID)
	case "friends":
		// Check if users are mutual followers (friends)
		return s.AreFriends(currentUserID, ownerID)
	case "listed":
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

// GetUserLikedPosts returns posts that the user has liked
func (s *PostService) GetUserLikedPosts(userID uint, limit, offset int) ([]models.PostResponse, error) {
	query := `
SELECT DISTINCT p.id, p.user_id, p.content, p.image_url, p.privacy, p.share_count, p.created_at, p.updated_at,
       u.first_name, u.last_name, u.avatar, u.nickname,
       COUNT(DISTINCT l2.id) as like_count,
       COUNT(DISTINCT c.id) as comment_count,
       1 as is_liked,
       CASE WHEN b.id IS NOT NULL THEN 1 ELSE 0 END as is_bookmarked
FROM posts p
JOIN users u ON p.user_id = u.id
JOIN likes ul ON p.id = ul.post_id AND ul.user_id = ?
LEFT JOIN likes l2 ON p.id = l2.post_id
LEFT JOIN comments c ON p.id = c.post_id
LEFT JOIN bookmarks b ON p.id = b.post_id AND b.user_id = ?
GROUP BY p.id, u.id
ORDER BY ul.created_at DESC
LIMIT ? OFFSET ?
`

	rows, err := s.db.Query(query, userID, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []models.PostResponse
	for rows.Next() {
		var post models.PostResponse
		var user models.UserResponse

		err := rows.Scan(
			&post.ID, &post.UserID, &post.Content, &post.ImageURL, &post.Privacy, &post.ShareCount,
			&post.CreatedAt, &post.UpdatedAt,
			&user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
			&post.LikeCount, &post.CommentCount, &post.IsLiked, &post.IsBookmarked,
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

// GetUserCommentedPosts returns posts that the user has commented on
func (s *PostService) GetUserCommentedPosts(userID uint, limit, offset int) ([]models.PostResponse, error) {
	query := `
	SELECT DISTINCT p.id, p.user_id, p.content, p.image_url, p.privacy, p.share_count, p.created_at, p.updated_at,
	       u.first_name, u.last_name, u.avatar, u.nickname,
	       COUNT(DISTINCT l.id) as like_count,
	       COUNT(DISTINCT c2.id) as comment_count,
	       CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END as is_liked,
	       CASE WHEN b.id IS NOT NULL THEN 1 ELSE 0 END as is_bookmarked
	FROM posts p
	JOIN users u ON p.user_id = u.id
	JOIN comments c ON p.id = c.post_id AND c.user_id = ?
	LEFT JOIN likes l ON p.id = l.post_id
	LEFT JOIN comments c2 ON p.id = c2.post_id
	LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = ?
	LEFT JOIN bookmarks b ON p.id = b.post_id AND b.user_id = ?
	GROUP BY p.id, u.id
	ORDER BY p.created_at DESC
	LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(query, userID, userID, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []models.PostResponse
	for rows.Next() {
		var post models.PostResponse
		var user models.UserResponse

		err := rows.Scan(
			&post.ID, &post.UserID, &post.Content, &post.ImageURL, &post.Privacy, &post.ShareCount,
			&post.CreatedAt, &post.UpdatedAt,
			&user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
			&post.LikeCount, &post.CommentCount, &post.IsLiked, &post.IsBookmarked,
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

// GetAllFeedPosts returns all posts that the user is allowed to see, regardless of who posted them
func (s *PostService) GetAllFeedPosts(currentUserID uint, limit int, offset int) ([]models.PostResponse, error) {
	// This is the same as the original GetFeedPosts - shows all posts user can see
	posts, err := s.GetFeedPosts(currentUserID, limit, offset)
	return posts, err
}

// GetFollowingFeedPosts returns posts only from users that the current user is following
func (s *PostService) GetFollowingFeedPosts(currentUserID uint, limit int, offset int) ([]models.PostResponse, error) {
	query := `
SELECT p.id, p.user_id, p.content, p.image_url, p.privacy, p.share_count, p.created_at, p.updated_at,
       u.first_name, u.last_name, u.avatar, u.nickname,
       (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
       (SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked,
       (SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM bookmarks WHERE post_id = p.id AND user_id = ?) as is_bookmarked
FROM posts p
JOIN users u ON p.user_id = u.id
JOIN follows f ON p.user_id = f.following_id AND f.follower_id = ? AND f.status = 'accepted'
ORDER BY p.created_at DESC
LIMIT ? OFFSET ?
`

	rows, err := s.db.Query(query, currentUserID, currentUserID, currentUserID, limit, offset)
	if err != nil {
		log.Printf("Error getting following feed posts: %v", err)
		return nil, err
	}
	defer rows.Close()

	var posts []models.PostResponse
	for rows.Next() {
		var post models.PostResponse
		var user models.UserResponse

		err := rows.Scan(
			&post.ID, &post.UserID, &post.Content, &post.ImageURL, &post.Privacy, &post.ShareCount,
			&post.CreatedAt, &post.UpdatedAt,
			&user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
			&post.LikeCount, &post.CommentCount, &post.IsLiked, &post.IsBookmarked,
		)
		if err != nil {
			return nil, err
		}

		// Check if current user can view this post (respects privacy settings)
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

// GetFriendsFeedPosts returns posts only from friends (mutual followers)
func (s *PostService) GetFriendsFeedPosts(currentUserID uint, limit int, offset int) ([]models.PostResponse, error) {
	query := `
SELECT p.id, p.user_id, p.content, p.image_url, p.privacy, p.share_count, p.created_at, p.updated_at,
       u.first_name, u.last_name, u.avatar, u.nickname,
       (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
       (SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked,
       (SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM bookmarks WHERE post_id = p.id AND user_id = ?) as is_bookmarked
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.user_id IN (
    SELECT f1.following_id
    FROM follows f1
    JOIN follows f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id
    WHERE f1.follower_id = ? AND f1.status = 'accepted' AND f2.status = 'accepted'
)
ORDER BY p.created_at DESC
LIMIT ? OFFSET ?
`

	rows, err := s.db.Query(query, currentUserID, currentUserID, currentUserID, limit, offset)
	if err != nil {
		log.Printf("Error getting friends feed posts: %v", err)
		return nil, err
	}
	defer rows.Close()

	var posts []models.PostResponse
	for rows.Next() {
		var post models.PostResponse
		var user models.UserResponse

		err := rows.Scan(
			&post.ID, &post.UserID, &post.Content, &post.ImageURL, &post.Privacy, &post.ShareCount,
			&post.CreatedAt, &post.UpdatedAt,
			&user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
			&post.LikeCount, &post.CommentCount, &post.IsLiked, &post.IsBookmarked,
		)
		if err != nil {
			return nil, err
		}

		// Check if current user can view this post (respects privacy settings)
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
