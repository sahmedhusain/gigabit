package handlers

import (
	"net/http"
	"social/middleware"
	"social/models"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type FeedHandler struct {
	DB *gorm.DB
}

func NewFeedHandler(db *gorm.DB) *FeedHandler {
	return &FeedHandler{DB: db}
}

func (h *FeedHandler) GetNewsFeed(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get pagination parameters
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")
	
	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}
	
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 50 {
		limit = 10
	}
	
	offset := (page - 1) * limit

	// Get friend IDs
	friendIDs, err := h.getFriendIDs(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get friends"})
		return
	}

	// Include user's own posts in the feed
	userIDs := append(friendIDs, userID)

	// Get posts from friends and self, ordered by creation time
	var posts []models.Post
	if err := h.DB.Preload("User").Preload("Comments.User").
		Where("user_id IN ?", userIDs).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get news feed"})
		return
	}

	// Build response with post details
	var responses []models.PostResponse
	for _, post := range posts {
		response := h.buildPostResponse(post, userID)
		responses = append(responses, response)
	}

	// Get total count for pagination info
	var totalCount int64
	h.DB.Model(&models.Post{}).Where("user_id IN ?", userIDs).Count(&totalCount)
	
	totalPages := int((totalCount + int64(limit) - 1) / int64(limit))

	c.JSON(http.StatusOK, gin.H{
		"posts": responses,
		"pagination": gin.H{
			"current_page": page,
			"total_pages":  totalPages,
			"total_posts":  totalCount,
			"limit":        limit,
		},
	})
}

func (h *FeedHandler) GetUserPosts(c *gin.Context) {
	currentUserID, _ := middleware.GetUserID(c)
	
	userIDParam := c.Param("userId")
	userID, err := strconv.ParseUint(userIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Check if user exists
	var user models.User
	if err := h.DB.First(&user, uint(userID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Get pagination parameters
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")
	
	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}
	
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 50 {
		limit = 10
	}
	
	offset := (page - 1) * limit

	// Get user's posts
	var posts []models.Post
	if err := h.DB.Preload("User").Preload("Comments.User").
		Where("user_id = ?", uint(userID)).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user posts"})
		return
	}

	// Build response with post details
	var responses []models.PostResponse
	for _, post := range posts {
		response := h.buildPostResponse(post, currentUserID)
		responses = append(responses, response)
	}

	// Get total count for pagination info
	var totalCount int64
	h.DB.Model(&models.Post{}).Where("user_id = ?", uint(userID)).Count(&totalCount)
	
	totalPages := int((totalCount + int64(limit) - 1) / int64(limit))

	c.JSON(http.StatusOK, gin.H{
		"posts": responses,
		"user":  user.ToResponse(),
		"pagination": gin.H{
			"current_page": page,
			"total_pages":  totalPages,
			"total_posts":  totalCount,
			"limit":        limit,
		},
	})
}

func (h *FeedHandler) getFriendIDs(userID uint) ([]uint, error) {
	var friendships []models.Friendship
	if err := h.DB.Where("(requester_id = ? OR addressee_id = ?) AND status = ?",
		userID, userID, models.FriendshipAccepted).Find(&friendships).Error; err != nil {
		return nil, err
	}

	var friendIDs []uint
	for _, friendship := range friendships {
		if friendship.RequesterID == userID {
			friendIDs = append(friendIDs, friendship.AddresseeID)
		} else {
			friendIDs = append(friendIDs, friendship.RequesterID)
		}
	}

	return friendIDs, nil
}

func (h *FeedHandler) buildPostResponse(post models.Post, currentUserID uint) models.PostResponse {
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
