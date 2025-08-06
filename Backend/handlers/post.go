package handlers

import (
	"net/http"
	"social/middleware"
	"social/models"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PostHandler struct {
	DB *gorm.DB
}

func NewPostHandler(db *gorm.DB) *PostHandler {
	return &PostHandler{DB: db}
}

func (h *PostHandler) CreatePost(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.CreatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	post := models.Post{
		UserID:   userID,
		Content:  req.Content,
		ImageURL: req.ImageURL,
	}

	if err := h.DB.Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
		return
	}

	// Load user information for response
	h.DB.Preload("User").First(&post, post.ID)

	response := h.buildPostResponse(post, userID)
	c.JSON(http.StatusCreated, response)
}

func (h *PostHandler) GetPost(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	
	postIDParam := c.Param("id")
	postID, err := strconv.ParseUint(postIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	var post models.Post
	if err := h.DB.Preload("User").Preload("Comments.User").First(&post, uint(postID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	response := h.buildPostResponse(post, userID)
	c.JSON(http.StatusOK, response)
}

func (h *PostHandler) UpdatePost(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	postIDParam := c.Param("id")
	postID, err := strconv.ParseUint(postIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	var req models.UpdatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var post models.Post
	if err := h.DB.Where("id = ? AND user_id = ?", uint(postID), userID).First(&post).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found or not authorized"})
		return
	}

	post.Content = req.Content
	post.ImageURL = req.ImageURL

	if err := h.DB.Save(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update post"})
		return
	}

	// Load user information for response
	h.DB.Preload("User").First(&post, post.ID)

	response := h.buildPostResponse(post, userID)
	c.JSON(http.StatusOK, response)
}

func (h *PostHandler) DeletePost(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	postIDParam := c.Param("id")
	postID, err := strconv.ParseUint(postIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	var post models.Post
	if err := h.DB.Where("id = ? AND user_id = ?", uint(postID), userID).First(&post).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found or not authorized"})
		return
	}

	if err := h.DB.Delete(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully"})
}

func (h *PostHandler) LikePost(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	postIDParam := c.Param("id")
	postID, err := strconv.ParseUint(postIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	// Check if post exists
	var post models.Post
	if err := h.DB.First(&post, uint(postID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	// Check if already liked
	var existingLike models.Like
	if err := h.DB.Where("user_id = ? AND post_id = ?", userID, uint(postID)).First(&existingLike).Error; err == nil {
		// Unlike the post
		if err := h.DB.Delete(&existingLike).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unlike post"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Post unliked", "liked": false})
		return
	}

	// Like the post
	like := models.Like{
		UserID: userID,
		PostID: uint(postID),
	}

	if err := h.DB.Create(&like).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to like post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post liked", "liked": true})
}

func (h *PostHandler) buildPostResponse(post models.Post, currentUserID uint) models.PostResponse {
	// Count likes
	var likeCount int64
	h.DB.Model(&models.Like{}).Where("post_id = ?", post.ID).Count(&likeCount)

	// Check if current user liked the post
	var isLiked bool
	if currentUserID > 0 {
		var like models.Like
		if err := h.DB.Where("user_id = ? AND post_id = ?", currentUserID, post.ID).First(&like).Error; err == nil {
			isLiked = true
		}
	}

	// Build comments response
	var comments []models.CommentResponse
	for _, comment := range post.Comments {
		comments = append(comments, models.CommentResponse{
			ID:        comment.ID,
			UserID:    comment.UserID,
			PostID:    comment.PostID,
			Content:   comment.Content,
			CreatedAt: comment.CreatedAt,
			UpdatedAt: comment.UpdatedAt,
			User:      comment.User.ToResponse(),
		})
	}

	return models.PostResponse{
		ID:        post.ID,
		UserID:    post.UserID,
		Content:   post.Content,
		ImageURL:  post.ImageURL,
		CreatedAt: post.CreatedAt,
		UpdatedAt: post.UpdatedAt,
		User:      post.User.ToResponse(),
		LikeCount: likeCount,
		IsLiked:   isLiked,
		Comments:  comments,
	}
}
