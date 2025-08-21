package handlers

import (
	"database/sql"
	"net/http"
	"social/models"
	"social/services"
	"social/websocket"
	"strconv"

	"github.com/gin-gonic/gin"
)

type PostHandler struct {
	postService    *services.PostService
	commentService *services.CommentService
	likeService    *services.LikeService
}

func NewPostHandler(db *sql.DB, hub *websocket.Hub) *PostHandler {
	return &PostHandler{
		postService:    services.NewPostService(db, hub),
		commentService: services.NewCommentService(db, hub),
		likeService:    services.NewLikeService(db, hub),
	}
}

func (h *PostHandler) CreatePost(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.CreatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default privacy if not provided
	if req.Privacy == "" {
		req.Privacy = "public"
	}

	post := &models.Post{
		UserID:     userID.(uint),
		Content:    req.Content,
		ImageURL:   &req.ImageURL,
		Privacy:    req.Privacy,
		CategoryID: req.CategoryID,
	}

	if req.ImageURL == "" {
		post.ImageURL = nil
	}

	if err := h.postService.CreatePost(post); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
		return
	}

	// Add specific users for private posts
	if req.Privacy == "private" && len(req.SpecificUserIDs) > 0 {
		if err := h.postService.AddPostPrivacyUsers(post.ID, req.SpecificUserIDs); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set post privacy"})
			return
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Post created successfully",
		"post":    post,
	})
}

func (h *PostHandler) GetPost(c *gin.Context) {
	postIDStr := c.Param("id")
	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	post, err := h.postService.GetPostByID(uint(postID), userID.(uint))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	c.JSON(http.StatusOK, post)
}

func (h *PostHandler) GetUserPosts(c *gin.Context) {
	userIDStr := c.Param("user_id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	currentUserID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get pagination parameters
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit > 50 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	posts, err := h.postService.GetUserPosts(uint(userID), currentUserID.(uint), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get posts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"posts":  posts,
		"count":  len(posts),
		"limit":  limit,
		"offset": offset,
	})
}

func (h *PostHandler) GetFeedPosts(c *gin.Context) {
	currentUserID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get pagination parameters
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit > 50 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	posts, err := h.postService.GetFeedPosts(currentUserID.(uint), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get feed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"posts":  posts,
		"count":  len(posts),
		"limit":  limit,
		"offset": offset,
	})
}

func (h *PostHandler) UpdatePost(c *gin.Context) {
	postIDStr := c.Param("id")
	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.UpdatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.postService.UpdatePost(uint(postID), userID.(uint), &req); err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot update this post"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update post"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post updated successfully"})
}

func (h *PostHandler) DeletePost(c *gin.Context) {
	postIDStr := c.Param("id")
	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	if err := h.postService.DeletePost(uint(postID), userID.(uint)); err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusForbidden, gin.H{"error": "Cannot delete this post"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully"})
}

func (h *PostHandler) LikePost(c *gin.Context) {
	postIDStr := c.Param("id")
	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	if err := h.likeService.LikePost(uint(postID), userID.(uint)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to like post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post liked successfully"})
}

func (h *PostHandler) UnlikePost(c *gin.Context) {
	postIDStr := c.Param("id")
	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	if err := h.likeService.UnlikePost(uint(postID), userID.(uint)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unlike post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post unliked successfully"})
}

func (h *PostHandler) GetPostsByCategory(c *gin.Context) {
	categoryIDStr := c.Param("category_id")
	categoryID, err := strconv.ParseUint(categoryIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	currentUserID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get pagination parameters
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit > 50 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	posts, err := h.postService.GetPostsByCategory(uint(categoryID), currentUserID.(uint), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get posts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"posts":       posts,
		"count":       len(posts),
		"limit":       limit,
		"offset":      offset,
		"category_id": categoryID,
	})
}
