package handlers

import (
	"net/http"
	"social/middleware"
	"social/models"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type FriendshipHandler struct {
	DB *gorm.DB
}

func NewFriendshipHandler(db *gorm.DB) *FriendshipHandler {
	return &FriendshipHandler{DB: db}
}

func (h *FriendshipHandler) SendFriendRequest(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.FriendRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if trying to send request to self
	if userID == req.AddresseeID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot send friend request to yourself"})
		return
	}

	// Check if addressee exists
	var addressee models.User
	if err := h.DB.First(&addressee, req.AddresseeID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if friendship already exists
	var existingFriendship models.Friendship
	if err := h.DB.Where("(requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)",
		userID, req.AddresseeID, req.AddresseeID, userID).First(&existingFriendship).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Friendship already exists"})
		return
	}

	// Create friendship request
	friendship := models.Friendship{
		RequesterID: userID,
		AddresseeID: req.AddresseeID,
		Status:      models.FriendshipPending,
	}

	if err := h.DB.Create(&friendship).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send friend request"})
		return
	}

	// Load relationships for response
	h.DB.Preload("Requester").Preload("Addressee").First(&friendship, friendship.ID)

	response := models.FriendshipResponse{
		ID:          friendship.ID,
		RequesterID: friendship.RequesterID,
		AddresseeID: friendship.AddresseeID,
		Status:      friendship.Status,
		CreatedAt:   friendship.CreatedAt,
		UpdatedAt:   friendship.UpdatedAt,
		Requester:   friendship.Requester.ToResponse(),
		Addressee:   friendship.Addressee.ToResponse(),
	}

	c.JSON(http.StatusCreated, response)
}

func (h *FriendshipHandler) AcceptFriendRequest(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	friendshipIDParam := c.Param("id")
	friendshipID, err := strconv.ParseUint(friendshipIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid friendship ID"})
		return
	}

	var friendship models.Friendship
	if err := h.DB.Where("id = ? AND addressee_id = ? AND status = ?",
		uint(friendshipID), userID, models.FriendshipPending).First(&friendship).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Friend request not found"})
		return
	}

	friendship.Status = models.FriendshipAccepted
	if err := h.DB.Save(&friendship).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to accept friend request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Friend request accepted"})
}

func (h *FriendshipHandler) RejectFriendRequest(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	friendshipIDParam := c.Param("id")
	friendshipID, err := strconv.ParseUint(friendshipIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid friendship ID"})
		return
	}

	var friendship models.Friendship
	if err := h.DB.Where("id = ? AND addressee_id = ? AND status = ?",
		uint(friendshipID), userID, models.FriendshipPending).First(&friendship).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Friend request not found"})
		return
	}

	if err := h.DB.Delete(&friendship).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject friend request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Friend request rejected"})
}

func (h *FriendshipHandler) GetFriends(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var friendships []models.Friendship
	if err := h.DB.Preload("Requester").Preload("Addressee").
		Where("(requester_id = ? OR addressee_id = ?) AND status = ?",
			userID, userID, models.FriendshipAccepted).Find(&friendships).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get friends"})
		return
	}

	var friends []models.UserResponse
	for _, friendship := range friendships {
		if friendship.RequesterID == userID {
			friends = append(friends, friendship.Addressee.ToResponse())
		} else {
			friends = append(friends, friendship.Requester.ToResponse())
		}
	}

	c.JSON(http.StatusOK, gin.H{"friends": friends})
}

func (h *FriendshipHandler) GetPendingRequests(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var friendships []models.Friendship
	if err := h.DB.Preload("Requester").Preload("Addressee").
		Where("addressee_id = ? AND status = ?", userID, models.FriendshipPending).
		Find(&friendships).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get pending requests"})
		return
	}

	var responses []models.FriendshipResponse
	for _, friendship := range friendships {
		responses = append(responses, models.FriendshipResponse{
			ID:          friendship.ID,
			RequesterID: friendship.RequesterID,
			AddresseeID: friendship.AddresseeID,
			Status:      friendship.Status,
			CreatedAt:   friendship.CreatedAt,
			UpdatedAt:   friendship.UpdatedAt,
			Requester:   friendship.Requester.ToResponse(),
			Addressee:   friendship.Addressee.ToResponse(),
		})
	}

	c.JSON(http.StatusOK, gin.H{"requests": responses})
}
