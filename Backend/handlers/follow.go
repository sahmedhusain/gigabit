package handlers

import (
	"database/sql"
	"net/http"
	"social/models"
	"social/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

type FollowHandler struct {
	followService *services.FollowService
	userService   *services.UserService
}

func NewFollowHandler(db *sql.DB) *FollowHandler {
	return &FollowHandler{
		followService: services.NewFollowService(db),
		userService:   services.NewUserService(db),
	}
}

func (h *FollowHandler) SendFollowRequest(c *gin.Context) {
	currentUserID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	targetUserIDParam := c.Param("id")
	targetUserID, err := strconv.ParseUint(targetUserIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Check if trying to follow themselves
	if currentUserID.(uint) == uint(targetUserID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot follow yourself"})
		return
	}

	// Check if target user exists
	targetUser, err := h.userService.GetUserByID(uint(targetUserID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if already following or request exists
	existingFollow, err := h.followService.GetFollowRelation(currentUserID.(uint), uint(targetUserID))
	if err == nil && existingFollow != nil {
		switch existingFollow.Status {
		case "accepted":
			c.JSON(http.StatusConflict, gin.H{"error": "Already following this user"})
		case "pending":
			c.JSON(http.StatusConflict, gin.H{"error": "Follow request already sent"})
		default:
			c.JSON(http.StatusConflict, gin.H{"error": "Follow request exists"})
		}
		return
	}

	// Create follow request
	followRequest := &models.Follow{
		FollowerID:  currentUserID.(uint),
		FollowingID: uint(targetUserID),
		Status:      "pending",
	}

	// If target user has public profile, auto-accept
	if !targetUser.IsPrivate {
		followRequest.Status = "accepted"
	}

	if err := h.followService.CreateFollowRequest(followRequest); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send follow request"})
		return
	}

	message := "Follow request sent"
	if !targetUser.IsPrivate {
		message = "Now following user"
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": message,
		"status":  followRequest.Status,
	})
}

func (h *FollowHandler) RespondToFollowRequest(c *gin.Context) {
	currentUserID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	followerIDParam := c.Param("id")
	followerID, err := strconv.ParseUint(followerIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		Action string `json:"action" binding:"required,oneof=accept decline"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get the follow request
	followRequest, err := h.followService.GetFollowRelation(uint(followerID), currentUserID.(uint))
	if err != nil || followRequest == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Follow request not found"})
		return
	}

	if followRequest.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Follow request not pending"})
		return
	}

	// Update follow request status
	if req.Action == "accept" {
		followRequest.Status = "accepted"
	} else {
		followRequest.Status = "declined"
	}

	if err := h.followService.UpdateFollowRequest(followRequest); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update follow request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Follow request " + req.Action + "ed",
		"status":  followRequest.Status,
	})
}

func (h *FollowHandler) Unfollow(c *gin.Context) {
	currentUserID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	targetUserIDParam := c.Param("id")
	targetUserID, err := strconv.ParseUint(targetUserIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get the follow relation
	followRequest, err := h.followService.GetFollowRelation(currentUserID.(uint), uint(targetUserID))
	if err != nil || followRequest == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not following this user"})
		return
	}

	// Delete the follow relation
	if err := h.followService.DeleteFollowRequest(followRequest.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unfollow user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully unfollowed user"})
}

func (h *FollowHandler) GetFollowers(c *gin.Context) {
	userIDParam := c.Param("id")
	userID, err := strconv.ParseUint(userIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	currentUserID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Check if current user can view this profile
	canView, err := h.userService.CanViewProfile(currentUserID.(uint), uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permissions"})
		return
	}

	if !canView {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot view this user's followers"})
		return
	}

	followers, err := h.followService.GetFollowers(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get followers"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"followers": followers,
		"count":     len(followers),
	})
}

func (h *FollowHandler) GetFollowing(c *gin.Context) {
	userIDParam := c.Param("id")
	userID, err := strconv.ParseUint(userIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	currentUserID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Check if current user can view this profile
	canView, err := h.userService.CanViewProfile(currentUserID.(uint), uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permissions"})
		return
	}

	if !canView {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot view this user's following list"})
		return
	}

	following, err := h.followService.GetFollowing(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get following list"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"following": following,
		"count":     len(following),
	})
}

func (h *FollowHandler) GetFollowRequests(c *gin.Context) {
	currentUserID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	requests, err := h.followService.GetPendingFollowRequests(currentUserID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get follow requests"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"requests": requests,
		"count":    len(requests),
	})
}