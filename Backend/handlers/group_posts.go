package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"gigabit/models"
	"gigabit/services"
	"gigabit/websocket"
)

// CreateGroupPost creates a new post in a group
func (h *GroupHandler) CreateGroupPost(w http.ResponseWriter, r *http.Request, groupIDStr string) {
	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.CreateGroupPostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Check if user is a member of the group
	role, err := h.groupService.GetUserRole(uint(groupID), userID)
	if err != nil {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
		return
	}

	// Only members can post (not pending or invited users)
	if role == "" {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
		return
	}

	// Check group permissions for creating posts
	group, err := h.groupService.GetGroupByID(uint(groupID), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get group information")
		return
	}

	// Check if user has permission to create posts
	isAdminOrCreator, err := h.groupService.IsUserAdminOrCreator(uint(groupID), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to check user permissions")
		return
	}
	canCreatePosts := group.CreatePosts == "all_members" || isAdminOrCreator
	if !canCreatePosts {
		writeError(w, http.StatusForbidden, "You don't have permission to create posts in this group")
		return
	}

	// Create the group post
	groupPost := &models.GroupPost{
		GroupID:   uint(groupID),
		UserID:    userID,
		Content:   req.Content,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if req.ImageURL != "" {
		groupPost.ImageURL = &req.ImageURL
	}

	if err := h.groupService.CreateGroupPost(groupPost); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create group post")
		return
	}

	// Get the full post response with user details
	postResponse, err := h.groupService.GetGroupPostByID(groupPost.ID, userID)
	if err != nil {
		// Post was created but we couldn't fetch the response, still return success
		writeJSON(w, http.StatusCreated, map[string]interface{}{
			"message": "Group post created successfully",
			"post_id": groupPost.ID,
		})
		return
	}

	// Send notification to all group members
	go h.notificationService.NotifyGroupPostCreated(userID, uint(groupID), groupPost.ID)

	// Send real-time update to all group members via WebSocket
	if h.hub != nil {
		message := websocket.Message{
			Type:      "group_post_update",
			From:      userID,
			GroupID:   uint(groupID),
			PostID:    groupPost.ID,
			Action:    "create",
			Data:      postResponse,
			Timestamp: time.Now().Unix(),
		}
		h.hub.SendToGroup(uint(groupID), message, userID)
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "Group post created successfully",
		"post":    postResponse,
	})
}

// GetGroupPosts retrieves all posts in a group
func (h *GroupHandler) GetGroupPosts(w http.ResponseWriter, r *http.Request, groupIDStr string) {
	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Check if user is a member of the group
	role, err := h.groupService.GetUserRole(uint(groupID), userID)
	if err != nil {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
		return
	}

	if role == "" {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
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

	posts, err := h.groupService.GetGroupPosts(uint(groupID), userID, limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get group posts")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"posts":  posts,
		"count":  len(posts),
		"limit":  limit,
		"offset": offset,
	})
}

// DeleteGroupPost deletes a group post
func (h *GroupHandler) DeleteGroupPost(w http.ResponseWriter, r *http.Request, groupIDStr, postIDStr string) {
	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	if err := h.groupService.DeleteGroupPost(uint(postID), uint(groupID), userID); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot delete this post")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to delete post")
		}
		return
	}

	// Send real-time update to all group members via WebSocket
	if h.hub != nil {
		message := websocket.Message{
			Type:      "group_post_update",
			From:      userID,
			GroupID:   uint(groupID),
			PostID:    uint(postID),
			Action:    "delete",
			Data:      map[string]interface{}{"post_id": postID},
			Timestamp: time.Now().Unix(),
		}
		h.hub.SendToGroup(uint(groupID), message, userID)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Group post deleted successfully"})
}

// GetGroupPost retrieves a single group post by ID
func (h *GroupHandler) GetGroupPost(w http.ResponseWriter, r *http.Request, groupIDStr, postIDStr string) {
	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Check if user is a member of the group
	role, err := h.groupService.GetUserRole(uint(groupID), userID)
	if err != nil {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
		return
	}

	if role == "" {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
		return
	}

	post, err := h.groupService.GetGroupPostByID(uint(postID), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get group post")
		return
	}

	writeJSON(w, http.StatusOK, post)
}

// LikeGroupPost handles liking a group post
func (h *GroupHandler) LikeGroupPost(w http.ResponseWriter, r *http.Request, groupIDStr, postIDStr string) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Check if user is a member of the group
	role, err := h.groupService.GetUserRole(uint(groupID), userID)
	if err != nil {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
		return
	}

	if role == "" {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
		return
	}

	if err := h.likeService.LikeGroupPost(uint(postID), userID); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to like post")
		return
	}

	// Send notification to post owner
	postOwnerID, err := h.groupService.GetGroupPostOwner(uint(postID))
	if err == nil {
		h.notificationService.NotifyGroupPostLiked(userID, postOwnerID, uint(postID), uint(groupID))
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Post liked successfully"})
}

// UnlikeGroupPost handles unliking a group post
func (h *GroupHandler) UnlikeGroupPost(w http.ResponseWriter, r *http.Request, groupIDStr, postIDStr string) {
	if r.Method != http.MethodDelete {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Check if user is a member of the group
	role, err := h.groupService.GetUserRole(uint(groupID), userID)
	if err != nil {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
		return
	}

	if role == "" {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
		return
	}

	if err := h.likeService.UnlikeGroupPost(uint(postID), userID); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to unlike post")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Post unliked successfully"})
}

// DislikeGroupPost handles disliking a group post
func (h *GroupHandler) DislikeGroupPost(w http.ResponseWriter, r *http.Request, groupIDStr, postIDStr string) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Check if user is a member of the group
	role, err := h.groupService.GetUserRole(uint(groupID), userID)
	if err != nil {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
		return
	}

	if role == "" {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
		return
	}

	if err := h.likeService.DislikeGroupPost(uint(postID), userID); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to dislike post")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Post disliked successfully"})
}

// UndislikeGroupPost handles undisliking a group post
func (h *GroupHandler) UndislikeGroupPost(w http.ResponseWriter, r *http.Request, groupIDStr, postIDStr string) {
	if r.Method != http.MethodDelete {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Check if user is a member of the group
	role, err := h.groupService.GetUserRole(uint(groupID), userID)
	if err != nil {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
		return
	}

	if role == "" {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
		return
	}

	if err := h.likeService.UndislikeGroupPost(uint(postID), userID); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to undislike post")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Post undisliked successfully"})
}

// CreateGroupPostComment creates a new comment on a group post
func (h *GroupHandler) CreateGroupPostComment(w http.ResponseWriter, r *http.Request, groupIDStr, postIDStr string, commentService *services.GroupCommentService) {
	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Check if user is a member of the group
	role, err := h.groupService.GetUserRole(uint(groupID), userID)
	if err != nil {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
		return
	}

	if role == "" {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
		return
	}

	var req models.CreateGroupPostCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	comment := &models.GroupPostComment{
		GroupPostID: uint(postID),
		UserID:      userID,
		Content:     req.Content,
	}

	if err := commentService.CreateGroupPostComment(comment, uint(groupID)); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create comment")
		return
	}

	// Get the full comment response with user details
	commentResponse, err := commentService.GetCommentByID(comment.ID)
	if err != nil {
		writeJSON(w, http.StatusCreated, map[string]interface{}{
			"message":    "Comment created successfully",
			"comment_id": comment.ID,
		})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "Comment created successfully",
		"comment": commentResponse,
	})
}

// GetGroupPostComments retrieves all comments for a group post
func (h *GroupHandler) GetGroupPostComments(w http.ResponseWriter, r *http.Request, groupIDStr, postIDStr string, commentService *services.GroupCommentService) {
	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Check if user is a member of the group
	role, err := h.groupService.GetUserRole(uint(groupID), userID)
	if err != nil {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
		return
	}

	if role == "" {
		writeError(w, http.StatusForbidden, "User is not a member of this group")
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
	if err != nil || limit > 100 {
		limit = 50
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	comments, err := commentService.GetGroupPostComments(uint(postID), limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get comments")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"comments": comments,
		"count":    len(comments),
		"limit":    limit,
		"offset":   offset,
	})
}

// DeleteGroupPostComment deletes a comment from a group post
func (h *GroupHandler) DeleteGroupPostComment(w http.ResponseWriter, r *http.Request, groupIDStr, postIDStr, commentIDStr string, commentService *services.GroupCommentService) {
	groupID, err := strconv.ParseUint(groupIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	_, err = strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	commentID, err := strconv.ParseUint(commentIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid comment ID")
		return
	}

	userID, ok := r.Context().Value("user_id").(uint)
	if !ok {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	if err := commentService.DeleteGroupPostComment(uint(commentID), userID, uint(groupID), h.groupService); err != nil {
		if err == sql.ErrNoRows {
			writeError(w, http.StatusForbidden, "Cannot delete this comment")
		} else {
			writeError(w, http.StatusInternalServerError, "Failed to delete comment")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Comment deleted successfully"})
}
