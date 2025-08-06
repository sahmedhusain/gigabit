package handlers

import (
	"net/http"
	"social/middleware"
	"social/models"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CommentHandler struct {
	DB *gorm.DB
}

func NewCommentHandler(db *gorm.DB) *CommentHandler {
	return &CommentHandler{DB: db}
}

func (h *CommentHandler) CreateComment(c *gin.Context) {
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

	var req models.CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if post exists
	var post models.Post
	if err := h.DB.First(&post, uint(postID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	comment := models.Comment{
		UserID:  userID,
		PostID:  uint(postID),
		Content: req.Content,
	}

	if err := h.DB.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create comment"})
		return
	}

	// Load user information for response
	h.DB.Preload("User").First(&comment, comment.ID)

	response := models.CommentResponse{
		ID:        comment.ID,
		UserID:    comment.UserID,
		PostID:    comment.PostID,
		Content:   comment.Content,
		CreatedAt: comment.CreatedAt,
		UpdatedAt: comment.UpdatedAt,
		User:      comment.User.ToResponse(),
	}

	c.JSON(http.StatusCreated, response)
}

func (h *CommentHandler) UpdateComment(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	commentIDParam := c.Param("id")
	commentID, err := strconv.ParseUint(commentIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	var req models.UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var comment models.Comment
	if err := h.DB.Where("id = ? AND user_id = ?", uint(commentID), userID).First(&comment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found or not authorized"})
		return
	}

	comment.Content = req.Content

	if err := h.DB.Save(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update comment"})
		return
	}

	// Load user information for response
	h.DB.Preload("User").First(&comment, comment.ID)

	response := models.CommentResponse{
		ID:        comment.ID,
		UserID:    comment.UserID,
		PostID:    comment.PostID,
		Content:   comment.Content,
		CreatedAt: comment.CreatedAt,
		UpdatedAt: comment.UpdatedAt,
		User:      comment.User.ToResponse(),
	}

	c.JSON(http.StatusOK, response)
}

func (h *CommentHandler) DeleteComment(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	commentIDParam := c.Param("id")
	commentID, err := strconv.ParseUint(commentIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	var comment models.Comment
	if err := h.DB.Where("id = ? AND user_id = ?", uint(commentID), userID).First(&comment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found or not authorized"})
		return
	}

	if err := h.DB.Delete(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete comment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted successfully"})
}

func (h *CommentHandler) GetPostComments(c *gin.Context) {
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

	var comments []models.Comment
	if err := h.DB.Preload("User").Where("post_id = ?", uint(postID)).
		Order("created_at ASC").Find(&comments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get comments"})
		return
	}

	var responses []models.CommentResponse
	for _, comment := range comments {
		responses = append(responses, models.CommentResponse{
			ID:        comment.ID,
			UserID:    comment.UserID,
			PostID:    comment.PostID,
			Content:   comment.Content,
			CreatedAt: comment.CreatedAt,
			UpdatedAt: comment.UpdatedAt,
			User:      comment.User.ToResponse(),
		})
	}

	c.JSON(http.StatusOK, gin.H{"comments": responses})
}
