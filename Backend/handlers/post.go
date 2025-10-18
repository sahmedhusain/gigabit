package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	// "strings"

	"social/models"
	"social/services"

	// "social/utils"
	"social/websocket"
)

type PostHandler struct {
	postService         *services.PostService
	commentService      *services.CommentService
	likeService         *services.LikeService
	notificationService *services.NotificationService
	hub                 *websocket.Hub
}

func NewPostHandler(db *sql.DB, hub *websocket.Hub) *PostHandler {
	return &PostHandler{
		postService:         services.NewPostService(db, hub),
		commentService:      services.NewCommentService(db, hub),
		likeService:         services.NewLikeService(db, hub),
		notificationService: services.NewNotificationService(db, hub),
		hub:                 hub,
	}
}

func (h *PostHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.CreatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Invalid request data for CreatePost: %v", err)
		writeError(w, http.StatusBadRequest, "Invalid request data: "+err.Error())
		return
	}

	// Set default privacy if not provided
	if req.Privacy == "" {
		req.Privacy = "public"
	}

	// Validate privacy value
	validPrivacy := []string{"public", "followers", "friends", "listed"}
	isValid := false
	for _, v := range validPrivacy {
		if req.Privacy == v {
			isValid = true
			break
		}
	}

	if !isValid {
		writeError(w, http.StatusBadRequest, "Invalid privacy setting. Must be 'public', 'followers', 'friends', or 'listed'")
		return
	}

	log.Printf("Creating post with privacy: %s for user: %v", req.Privacy, userID)

	post := &models.Post{
		UserID:   userID.(uint),
		Content:  req.Content,
		ImageURL: &req.ImageURL,
		Privacy:  req.Privacy,
	}

	if req.ImageURL == "" {
		post.ImageURL = nil
	}

	if err := h.postService.CreatePost(post); err != nil {
		log.Printf("Failed to create post: %v", err)
		writeError(w, http.StatusInternalServerError, "Failed to create post")
		return
	}

	// Add specific users for listed posts
	if req.Privacy == "listed" {
		if len(req.SpecificUserIDs) == 0 {
			writeError(w, http.StatusBadRequest, "Listed posts must specify at least one user")
			return
		}
		if err := h.postService.AddPostPrivacyUsers(post.ID, req.SpecificUserIDs); err != nil {
			log.Printf("Failed to add privacy users for post %d: %v", post.ID, err)
			writeError(w, http.StatusInternalServerError, "Failed to set post privacy")
			return
		}
		log.Printf("Added %d users to listed post %d", len(req.SpecificUserIDs), post.ID)
	}

	log.Printf("Post created successfully with ID: %d", post.ID)
	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "Post created successfully",
		"post":    post,
	})
}

func (h *PostHandler) GetPost(w http.ResponseWriter, r *http.Request, postIDStr string) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	post, err := h.postService.GetPostByID(uint(postID), userID.(uint))
	if err != nil {
		writeError(w, http.StatusNotFound, "Post not found")
		return
	}

	writeJSON(w, http.StatusOK, post)
}

func (h *PostHandler) GetPosts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	currentUserID := r.Context().Value("user_id")
	if currentUserID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Get pagination parameters
	limitStr := r.URL.Query().Get("limit")
	if limitStr == "" {
		limitStr = "50"
	}
	offsetStr := r.URL.Query().Get("offset")
	if offsetStr == "" {
		offsetStr = "0"
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit > 50 {
		limit = 50
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	// Use the service layer to get posts with proper privacy filtering
	posts, err := h.postService.GetFeedPosts(currentUserID.(uint), limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get posts")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"posts":  posts,
		"limit":  limit,
		"offset": offset,
	})
}

func (h *PostHandler) GetUserPosts(w http.ResponseWriter, r *http.Request, userIDStr string) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	currentUserID := r.Context().Value("user_id")
	if currentUserID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Get pagination parameters
	limitStr := r.URL.Query().Get("limit")
	if limitStr == "" {
		limitStr = "20"
	}
	offsetStr := r.URL.Query().Get("offset")
	if offsetStr == "" {
		offsetStr = "0"
	}

	limit, err1 := strconv.Atoi(limitStr)
	if err1 != nil || limit > 50 {
		limit = 20
	}

	offset, err2 := strconv.Atoi(offsetStr)
	if err2 != nil || offset < 0 {
		offset = 0
	}

	posts, err := h.postService.GetUserPosts(uint(userID), currentUserID.(uint), limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get posts")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"posts":  posts,
		"count":  len(posts),
		"limit":  limit,
		"offset": offset,
	})
}

func (h *PostHandler) GetFeedPosts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	currentUserID := r.Context().Value("user_id")
	if currentUserID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Get pagination parameters
	limitStr := r.URL.Query().Get("limit")
	if limitStr == "" {
		limitStr = "20"
	}
	offsetStr := r.URL.Query().Get("offset")
	if offsetStr == "" {
		offsetStr = "0"
	}

	limit, errLimit := strconv.Atoi(limitStr)
	if errLimit != nil || limit > 50 {
		limit = 20
	}

	offset, errOffset := strconv.Atoi(offsetStr)
	if errOffset != nil || offset < 0 {
		offset = 0
	}

	// Get filter parameter to determine which feed to show
	filter := r.URL.Query().Get("filter")

	var posts []models.PostResponse
	var err error
	switch filter {
	case "following":
		posts, err = h.postService.GetFollowingFeedPosts(currentUserID.(uint), limit, offset)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to get feed")
			return
		}
	case "friends":
		posts, err = h.postService.GetFriendsFeedPosts(currentUserID.(uint), limit, offset)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to get feed")
			return
		}
	default: // "all" or empty
		posts, err = h.postService.GetFeedPosts(currentUserID.(uint), limit, offset)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to get feed")
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"posts":  posts,
		"limit":  limit,
		"offset": offset,
	})
}

func (h *PostHandler) UpdatePost(w http.ResponseWriter, r *http.Request, postIDStr string) {
	if r.Method != http.MethodPut {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.UpdatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.postService.UpdatePost(uint(postID), userID.(uint), &req); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot update this post")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to update post")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Post updated successfully"})
}

func (h *PostHandler) DeletePost(w http.ResponseWriter, r *http.Request, postIDStr string) {
	if r.Method != http.MethodDelete {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	if err := h.postService.DeletePost(uint(postID), userID.(uint)); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot delete this post")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to delete post")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Post deleted successfully"})
}

func (h *PostHandler) LikePost(w http.ResponseWriter, r *http.Request, postIDStr string) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	if err := h.likeService.LikePost(uint(postID), userID.(uint)); err != nil {
		log.Printf("Failed to like post %d for user %v: %v", postID, userID, err)
		writeError(w, http.StatusInternalServerError, "Failed to like post")
		return
	}

	// Get post owner to send notification
	post, err := h.postService.GetPostByID(uint(postID), userID.(uint))
	if err == nil && post != nil {
		// Send notification to post owner (async, don't wait for it)
		go h.notificationService.NotifyPostLiked(userID.(uint), post.UserID, uint(postID))
	}

	log.Printf("Post %d liked successfully by user %v", postID, userID)
	writeJSON(w, http.StatusOK, map[string]string{"message": "Post liked successfully"})
}

func (h *PostHandler) UnlikePost(w http.ResponseWriter, r *http.Request, postIDStr string) {
	if r.Method != http.MethodDelete {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	if err := h.likeService.UnlikePost(uint(postID), userID.(uint)); err != nil {
		log.Printf("Failed to unlike post %d for user %v: %v", postID, userID, err)
		writeError(w, http.StatusInternalServerError, "Failed to unlike post")
		return
	}

	log.Printf("Post %d unliked successfully by user %v", postID, userID)
	writeJSON(w, http.StatusOK, map[string]string{"message": "Post unliked successfully"})
}

func (h *PostHandler) DislikePost(w http.ResponseWriter, r *http.Request, postIDStr string) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	if err := h.likeService.DislikePost(uint(postID), userID.(uint)); err != nil {
		log.Printf("Failed to dislike post %d for user %v: %v", postID, userID, err)
		writeError(w, http.StatusInternalServerError, "Failed to dislike post")
		return
	}

	log.Printf("Post %d disliked successfully by user %v", postID, userID)
	writeJSON(w, http.StatusOK, map[string]string{"message": "Post disliked successfully"})
}

func (h *PostHandler) UndislikePost(w http.ResponseWriter, r *http.Request, postIDStr string) {
	if r.Method != http.MethodDelete {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	if err := h.likeService.UndislikePost(uint(postID), userID.(uint)); err != nil {
		log.Printf("Failed to undislike post %d for user %v: %v", postID, userID, err)
		writeError(w, http.StatusInternalServerError, "Failed to undislike post")
		return
	}

	log.Printf("Post %d undisliked successfully by user %v", postID, userID)
	writeJSON(w, http.StatusOK, map[string]string{"message": "Post undisliked successfully"})
}

// CreateComment handles creating a new comment on a post
func (h *PostHandler) CreateComment(w http.ResponseWriter, r *http.Request, postIDStr string) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.CreateCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request data: "+err.Error())
		return
	}

	// Require either content or image
	if req.Content == "" && req.ImageURL == "" {
		writeError(w, http.StatusBadRequest, "Comment must have either text or image")
		return
	}

	comment := &models.Comment{
		PostID:  uint(postID),
		UserID:  userID.(uint),
		Content: req.Content,
	}

	if req.ImageURL != "" {
		comment.ImageURL = &req.ImageURL
	}

	if err := h.commentService.CreateComment(comment); err != nil {
		log.Printf("Failed to create comment: %v", err)
		writeError(w, http.StatusInternalServerError, "Failed to create comment")
		return
	}

	// Get post owner to send notification
	post, err := h.postService.GetPostByID(uint(postID), userID.(uint))
	if err == nil && post != nil {
		// Send notification to post owner (async, don't wait for it)
		go h.notificationService.NotifyPostCommented(userID.(uint), post.UserID, uint(postID))
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "Comment created successfully",
		"comment": comment,
	})
}

// GetPostComments handles getting comments for a specific post
func (h *PostHandler) GetPostComments(w http.ResponseWriter, r *http.Request, postIDStr string) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	// Get pagination parameters
	limitStr := r.URL.Query().Get("limit")
	if limitStr == "" {
		limitStr = "20"
	}
	offsetStr := r.URL.Query().Get("offset")
	if offsetStr == "" {
		offsetStr = "0"
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit > 100 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	comments, err := h.commentService.GetPostComments(uint(postID), limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get comments")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"comments": comments,
		"count":    len(comments),
		"limit":    limit,
		"offset":   offset,
		"post_id":  postID,
	})
}

func (h *PostHandler) GetUserLikedPosts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Get pagination parameters
	limitStr := r.URL.Query().Get("limit")
	if limitStr == "" {
		limitStr = "20"
	}
	offsetStr := r.URL.Query().Get("offset")
	if offsetStr == "" {
		offsetStr = "0"
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit > 50 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	posts, err := h.postService.GetUserLikedPosts(userID.(uint), limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get liked posts")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"posts":  posts,
		"count":  len(posts),
		"limit":  limit,
		"offset": offset,
	})
}

func (h *PostHandler) GetUserCommentedPosts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	userID := r.Context().Value("user_id")
	if userID == nil {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Get pagination parameters
	limitStr := r.URL.Query().Get("limit")
	if limitStr == "" {
		limitStr = "20"
	}
	offsetStr := r.URL.Query().Get("offset")
	if offsetStr == "" {
		offsetStr = "0"
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit > 50 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	posts, err := h.postService.GetUserCommentedPosts(userID.(uint), limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get commented posts")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"posts":  posts,
		"count":  len(posts),
		"limit":  limit,
		"offset": offset,
	})
}
