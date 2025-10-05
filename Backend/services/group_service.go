package services

import (
	"database/sql"
	"social/models"
	"time"
)

type GroupService struct {
	db *sql.DB
}

func NewGroupService(db *sql.DB) *GroupService {
	return &GroupService{db: db}
}

func (s *GroupService) CreateGroup(group *models.Group) error {
	query := `
INSERT INTO groups (creator_id, name, description, created_at, updated_at)
VALUES (?, ?, ?, ?, ?)
`

	now := time.Now()
	result, err := s.db.Exec(query, group.CreatorID, group.Title, group.Description, now, now)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	group.ID = uint(id)
	group.CreatedAt = now
	group.UpdatedAt = now

	// Add creator as member automatically with creator role
	memberQuery := `
INSERT INTO group_members (group_id, user_id, status, role, created_at, updated_at)
VALUES (?, ?, 'member', 'creator', ?, ?)
`
	_, err = s.db.Exec(memberQuery, group.ID, group.CreatorID, now, now)

	return err
}

func (s *GroupService) GetGroupByID(groupID, currentUserID uint) (*models.GroupResponse, error) {
	query := `
SELECT g.id, g.creator_id, g.name as title, g.description, g.created_at, g.updated_at,
	u.first_name, u.last_name, u.avatar, u.nickname,
	COUNT(DISTINCT gm.id) as member_count
FROM groups g
JOIN users u ON g.creator_id = u.id
LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.status IN ('member','accepted')
WHERE g.id = ?
GROUP BY g.id, u.id
	`

	var group models.GroupResponse
	var creator models.UserResponse

	err := s.db.QueryRow(query, groupID).Scan(
		&group.ID, &group.CreatorID, &group.Title, &group.Description,
		&group.CreatedAt, &group.UpdatedAt,
		&creator.FirstName, &creator.LastName, &creator.Avatar, &creator.Nickname,
		&group.MemberCount,
	)
	if err != nil {
		return nil, err
	}

	creator.ID = group.CreatorID
	group.Creator = creator

	// Check current user's membership status
	memberStatus, err := s.GetUserMembershipStatus(groupID, currentUserID)
	if err != nil {
		return nil, err
	}

	group.MemberStatus = memberStatus
	group.IsMember = memberStatus == "member" || memberStatus == "accepted"

	return &group, nil
}

func (s *GroupService) GetAllGroups(currentUserID uint, limit, offset int) ([]models.GroupResponse, error) {
	query := `
SELECT g.id, g.creator_id, g.name as title, g.description, g.created_at, g.updated_at,
	u.first_name, u.last_name, u.avatar, u.nickname,
	COUNT(DISTINCT gm.id) as member_count
FROM groups g
JOIN users u ON g.creator_id = u.id
LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.status IN ('member','accepted')
GROUP BY g.id, u.id
ORDER BY g.created_at DESC
LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []models.GroupResponse
	for rows.Next() {
		var group models.GroupResponse
		var creator models.UserResponse

		err := rows.Scan(
			&group.ID, &group.CreatorID, &group.Title, &group.Description,
			&group.CreatedAt, &group.UpdatedAt,
			&creator.FirstName, &creator.LastName, &creator.Avatar, &creator.Nickname,
			&group.MemberCount,
		)
		if err != nil {
			return nil, err
		}

		creator.ID = group.CreatorID
		group.Creator = creator

		// Check current user's membership status
		memberStatus, err := s.GetUserMembershipStatus(group.ID, currentUserID)
		if err != nil {
			return nil, err
		}

		group.MemberStatus = memberStatus
		group.IsMember = memberStatus == "member" || memberStatus == "accepted"

		groups = append(groups, group)
	}

	return groups, nil
}

func (s *GroupService) GetUserGroups(userID uint, limit, offset int) ([]models.GroupResponse, error) {
	query := `
SELECT g.id, g.creator_id, g.name as title, g.description, g.created_at, g.updated_at,
	u.first_name, u.last_name, u.avatar, u.nickname,
	COUNT(DISTINCT gm2.id) as member_count
FROM groups g
JOIN users u ON g.creator_id = u.id
JOIN group_members gm ON g.id = gm.group_id AND gm.user_id = ? AND gm.status IN ('member','accepted')
LEFT JOIN group_members gm2 ON g.id = gm2.group_id AND gm2.status IN ('member','accepted')
GROUP BY g.id, u.id
ORDER BY gm.created_at DESC
LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []models.GroupResponse
	for rows.Next() {
		var group models.GroupResponse
		var creator models.UserResponse

		err := rows.Scan(
			&group.ID, &group.CreatorID, &group.Title, &group.Description,
			&group.CreatedAt, &group.UpdatedAt,
			&creator.FirstName, &creator.LastName, &creator.Avatar, &creator.Nickname,
			&group.MemberCount,
		)
		if err != nil {
			return nil, err
		}

		creator.ID = group.CreatorID
		group.Creator = creator
		group.MemberStatus = "accepted"
		group.IsMember = true

		groups = append(groups, group)
	}

	return groups, nil
}

func (s *GroupService) UpdateGroup(groupID, userID uint, updateReq *models.UpdateGroupRequest) error {
	// Check if user is the creator
	var creatorID uint
	err := s.db.QueryRow("SELECT creator_id FROM groups WHERE id = ?", groupID).Scan(&creatorID)
	if err != nil {
		return err
	}

	if creatorID != userID {
		return sql.ErrNoRows // Unauthorized
	}

	query := `
UPDATE groups SET name = ?, description = ?, updated_at = ?
WHERE id = ? AND creator_id = ?
`

	now := time.Now()
	_, err = s.db.Exec(query, updateReq.Title, updateReq.Description, now, groupID, userID)
	return err
}

func (s *GroupService) DeleteGroup(groupID, userID uint) error {
	// Check if user is the creator
	var creatorID uint
	err := s.db.QueryRow("SELECT creator_id FROM groups WHERE id = ?", groupID).Scan(&creatorID)
	if err != nil {
		return err
	}

	if creatorID != userID {
		return sql.ErrNoRows // Unauthorized
	}

	// Delete related data first
	s.db.Exec("DELETE FROM group_members WHERE group_id = ?", groupID)
	s.db.Exec("DELETE FROM group_posts WHERE group_id = ?", groupID)
	s.db.Exec("DELETE FROM events WHERE group_id = ?", groupID)

	// Delete the group
	_, err = s.db.Exec("DELETE FROM groups WHERE id = ? AND creator_id = ?", groupID, userID)
	return err
}

func (s *GroupService) InviteUsers(groupID, inviterID uint, userIDs []uint) error {
	// Check if inviter is a member or creator
	isMember, err := s.IsUserMember(groupID, inviterID)
	if err != nil || !isMember {
		return sql.ErrNoRows // Unauthorized or not a member
	}

	now := time.Now()
	query := `
		INSERT INTO group_members (group_id, user_id, status, created_at, updated_at)
		VALUES (?, ?, 'invited', ?, ?)
	`

	for _, userID := range userIDs {
		// Check if user is already a member or has pending invitation
		status, err := s.GetUserMembershipStatus(groupID, userID)
		if err == nil && (status == "member" || status == "invited" || status == "pending") {
			continue // Skip if already exists
		}

		_, err = s.db.Exec(query, groupID, userID, now, now)
		if err != nil {
			// Continue with other invitations even if one fails
			continue
		}
	}

	return nil
}

func (s *GroupService) RequestToJoin(groupID, userID uint) error {
	// Check if user already has a relationship with the group
	status, err := s.GetUserMembershipStatus(groupID, userID)
	if err == nil && (status == "member" || status == "invited" || status == "pending") {
		return sql.ErrNoRows // Already exists
	}

	query := `
		INSERT INTO group_members (group_id, user_id, status, created_at, updated_at)
		VALUES (?, ?, 'pending', ?, ?)
	`

	now := time.Now()
	_, err = s.db.Exec(query, groupID, userID, now, now)
	return err
}

func (s *GroupService) RespondToInvitation(groupID, userID uint, accept bool) error {
	// Check if user has an invitation
	status, err := s.GetUserMembershipStatus(groupID, userID)
	if err != nil || status != "invited" {
		return sql.ErrNoRows // No invitation found
	}

	if accept {
		// Accept invitation - become member
		query := `
UPDATE group_members SET status = 'accepted', created_at = ?, updated_at = ?
WHERE group_id = ? AND user_id = ? AND status = 'invited'
`
		now := time.Now()
		_, err = s.db.Exec(query, now, now, groupID, userID)
	} else {
		// Decline invitation - remove record
		query := `DELETE FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'invited'`
		_, err = s.db.Exec(query, groupID, userID)
	}

	return err
}

func (s *GroupService) RespondToJoinRequest(groupID, requestUserID, responderID uint, accept bool) error {
	// Check if responder is creator
	var creatorID uint
	err := s.db.QueryRow("SELECT creator_id FROM groups WHERE id = ?", groupID).Scan(&creatorID)
	if err != nil {
		return err
	}

	if creatorID != responderID {
		return sql.ErrNoRows // Unauthorized
	}

	// Check if there's a pending request
	status, err := s.GetUserMembershipStatus(groupID, requestUserID)
	if err != nil || status != "pending" {
		return sql.ErrNoRows // No pending request found
	}

	if accept {
		// Accept request - make user member
		query := `
UPDATE group_members SET status = 'accepted', created_at = ?, updated_at = ?
WHERE group_id = ? AND user_id = ? AND status = 'pending'
`
		now := time.Now()
		_, err = s.db.Exec(query, now, now, groupID, requestUserID)
	} else {
		// Decline request - remove record
		query := `DELETE FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'pending'`
		_, err = s.db.Exec(query, groupID, requestUserID)
	}

	return err
}

func (s *GroupService) LeaveGroup(groupID, userID uint) error {
	// Check if user is the creator
	var creatorID uint
	err := s.db.QueryRow("SELECT creator_id FROM groups WHERE id = ?", groupID).Scan(&creatorID)
	if err != nil {
		return err
	}

	if creatorID == userID {
		return sql.ErrNoRows // Creator cannot leave, must delete group instead
	}

	query := `DELETE FROM group_members WHERE group_id = ? AND user_id = ?`
	_, err = s.db.Exec(query, groupID, userID)
	return err
}

func (s *GroupService) GetGroupMembers(groupID, currentUserID uint) ([]models.GroupMemberResponse, error) {
	// Check if current user is a member
	isMember, err := s.IsUserMember(groupID, currentUserID)
	if err != nil || !isMember {
		return nil, sql.ErrNoRows // Unauthorized
	}

	query := `
SELECT gm.id, gm.group_id, gm.user_id, gm.status, gm.role, gm.created_at,
   u.first_name, u.last_name, u.avatar, u.nickname
FROM group_members gm
JOIN users u ON gm.user_id = u.id
WHERE gm.group_id = ? AND gm.status IN ('member','accepted')
ORDER BY gm.created_at ASC
	`

	rows, err := s.db.Query(query, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var members []models.GroupMemberResponse
	for rows.Next() {
		var member models.GroupMemberResponse
		var user models.UserResponse

		err := rows.Scan(
			&member.ID, &member.GroupID, &user.ID, &member.Status, &member.Role, &member.JoinedAt,
			&user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
		)
		if err != nil {
			return nil, err
		}

		member.User = user
		members = append(members, member)
	}

	return members, nil
}

func (s *GroupService) GetPendingRequests(groupID, userID uint) ([]models.GroupMemberResponse, error) {
	// Check if user is the creator
	var creatorID uint
	err := s.db.QueryRow("SELECT creator_id FROM groups WHERE id = ?", groupID).Scan(&creatorID)
	if err != nil {
		return nil, err
	}

	if creatorID != userID {
		return nil, sql.ErrNoRows // Unauthorized
	}

	query := `
		SELECT gm.id, gm.group_id, gm.user_id, gm.status, gm.created_at,
			   u.first_name, u.last_name, u.avatar, u.nickname
		FROM group_members gm
		JOIN users u ON gm.user_id = u.id
		WHERE gm.group_id = ? AND gm.status = 'pending'
		ORDER BY gm.created_at DESC
	`

	rows, err := s.db.Query(query, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []models.GroupMemberResponse
	for rows.Next() {
		var request models.GroupMemberResponse
		var user models.UserResponse

		err := rows.Scan(
			&request.ID, &request.GroupID, &user.ID, &request.Status, &request.JoinedAt,
			&user.FirstName, &user.LastName, &user.Avatar, &user.Nickname,
		)
		if err != nil {
			return nil, err
		}

		request.User = user
		requests = append(requests, request)
	}

	return requests, nil
}

func (s *GroupService) GetUserMembershipStatus(groupID, userID uint) (string, error) {
	query := `SELECT status FROM group_members WHERE group_id = ? AND user_id = ?`

	var status string
	err := s.db.QueryRow(query, groupID, userID).Scan(&status)
	if err == sql.ErrNoRows {
		return "none", nil
	}
	if err != nil {
		return "", err
	}

	return status, nil
}

func (s *GroupService) IsUserMember(groupID, userID uint) (bool, error) {
	status, err := s.GetUserMembershipStatus(groupID, userID)
	if err != nil {
		return false, err
	}
	return status == "member" || status == "accepted", nil
}

func (s *GroupService) GetUserRole(groupID, userID uint) (string, error) {
	query := `SELECT role FROM group_members WHERE group_id = ? AND user_id = ? AND status IN ('member','accepted')`

	var role string
	err := s.db.QueryRow(query, groupID, userID).Scan(&role)
	if err == sql.ErrNoRows {
		// Check if user is the group creator
		var creatorID uint
		err := s.db.QueryRow("SELECT creator_id FROM groups WHERE id = ?", groupID).Scan(&creatorID)
		if err != nil {
			return "", err
		}
		if creatorID == userID {
			return "creator", nil
		}
		return "", sql.ErrNoRows
	}
	if err != nil {
		return "", err
	}

	return role, nil
}

func (s *GroupService) IsUserAdminOrCreator(groupID, userID uint) (bool, error) {
	role, err := s.GetUserRole(groupID, userID)
	if err != nil {
		return false, err
	}
	return role == "admin" || role == "creator", nil
}

// CreateGroupPost creates a new post in a group
func (s *GroupService) CreateGroupPost(groupPost *models.GroupPost) error {
	query := `
INSERT INTO group_posts (group_id, user_id, content, image_url, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?)
`

	now := time.Now()
	result, err := s.db.Exec(query, groupPost.GroupID, groupPost.UserID, groupPost.Content, groupPost.ImageURL, now, now)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	groupPost.ID = uint(id)
	groupPost.CreatedAt = now
	groupPost.UpdatedAt = now

	return nil
}

// GetGroupPostByID retrieves a group post by ID with user details
func (s *GroupService) GetGroupPostByID(postID, currentUserID uint) (*models.GroupPostResponse, error) {
	query := `
SELECT gp.id, gp.group_id, gp.user_id, gp.content, gp.image_url, gp.created_at, gp.updated_at,
       u.first_name, u.last_name, u.avatar, u.nickname,
       (SELECT COUNT(*) FROM likes WHERE entity_type = 'group_post' AND entity_id = gp.id) as like_count,
       (SELECT COUNT(*) FROM comments WHERE post_id = gp.id) as comment_count,
       (SELECT COUNT(*) > 0 FROM likes WHERE entity_type = 'group_post' AND entity_id = gp.id AND user_id = ?) as is_liked
FROM group_posts gp
JOIN users u ON gp.user_id = u.id
WHERE gp.id = ?
`

	var post models.GroupPostResponse
	var firstName, lastName string
	var avatar, nickname *string

	err := s.db.QueryRow(query, currentUserID, postID).Scan(
		&post.ID, &post.GroupID, &post.UserID, &post.Content, &post.ImageURL, &post.CreatedAt, &post.UpdatedAt,
		&firstName, &lastName, &avatar, &nickname,
		&post.LikeCount, &post.CommentCount, &post.IsLiked,
	)
	if err != nil {
		return nil, err
	}

	// Set user details
	post.User = models.UserResponse{
		ID:        post.UserID,
		FirstName: firstName,
		LastName:  lastName,
		Avatar:    avatar,
		Nickname:  nickname,
	}

	return &post, nil
}

// GetGroupPosts retrieves all posts in a group with pagination
func (s *GroupService) GetGroupPosts(groupID, currentUserID uint, limit, offset int) ([]models.GroupPostResponse, error) {
	query := `
SELECT gp.id, gp.group_id, gp.user_id, gp.content, gp.image_url, gp.created_at, gp.updated_at,
       u.first_name, u.last_name, u.avatar, u.nickname,
       (SELECT COUNT(*) FROM likes WHERE entity_type = 'group_post' AND entity_id = gp.id) as like_count,
       (SELECT COUNT(*) FROM comments WHERE post_id = gp.id) as comment_count,
       (SELECT COUNT(*) > 0 FROM likes WHERE entity_type = 'group_post' AND entity_id = gp.id AND user_id = ?) as is_liked
FROM group_posts gp
JOIN users u ON gp.user_id = u.id
WHERE gp.group_id = ?
ORDER BY gp.created_at DESC
LIMIT ? OFFSET ?
`

	rows, err := s.db.Query(query, currentUserID, groupID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []models.GroupPostResponse
	for rows.Next() {
		var post models.GroupPostResponse
		var firstName, lastName string
		var avatar, nickname *string

		err := rows.Scan(
			&post.ID, &post.GroupID, &post.UserID, &post.Content, &post.ImageURL, &post.CreatedAt, &post.UpdatedAt,
			&firstName, &lastName, &avatar, &nickname,
			&post.LikeCount, &post.CommentCount, &post.IsLiked,
		)
		if err != nil {
			continue
		}

		// Set user details
		post.User = models.UserResponse{
			ID:        post.UserID,
			FirstName: firstName,
			LastName:  lastName,
			Avatar:    avatar,
			Nickname:  nickname,
		}

		posts = append(posts, post)
	}

	return posts, nil
}

// DeleteGroupPost deletes a group post
func (s *GroupService) DeleteGroupPost(postID, groupID, userID uint) error {
	// Check if user owns the post or is admin/creator of the group
	checkQuery := `
SELECT gp.user_id, gm.role
FROM group_posts gp
JOIN group_members gm ON gp.group_id = gm.group_id
WHERE gp.id = ? AND gp.group_id = ? AND gm.user_id = ? AND gm.status = 'accepted'
`

	var postOwnerID uint
	var userRole string
	err := s.db.QueryRow(checkQuery, postID, groupID, userID).Scan(&postOwnerID, &userRole)
	if err != nil {
		return err
	}

	// User can delete if they own the post or are admin/creator
	if postOwnerID != userID && userRole != "admin" && userRole != "creator" {
		return sql.ErrNoRows
	}

	// Delete associated comments and likes first
	_, err = s.db.Exec("DELETE FROM comments WHERE post_id = ?", postID)
	if err != nil {
		return err
	}

	_, err = s.db.Exec("DELETE FROM likes WHERE entity_type = 'group_post' AND entity_id = ?", postID)
	if err != nil {
		return err
	}

	// Delete the post
	result, err := s.db.Exec("DELETE FROM group_posts WHERE id = ? AND group_id = ?", postID, groupID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func (s *GroupService) GetUserInvitations(userID uint) ([]models.GroupInvitationResponse, error) {
	query := `
SELECT gm.id, gm.group_id, gm.created_at,
       g.name as group_name, g.description as group_description,
       u.first_name, u.last_name, u.avatar, u.nickname
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
JOIN users u ON g.creator_id = u.id
WHERE gm.user_id = ? AND gm.status = 'invited'
ORDER BY gm.created_at DESC
	`

	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invitations []models.GroupInvitationResponse
	for rows.Next() {
		var invitation models.GroupInvitationResponse
		var group models.GroupResponse
		var creator models.UserResponse

		err := rows.Scan(
			&invitation.ID, &group.ID, &invitation.CreatedAt,
			&group.Title, &group.Description,
			&creator.FirstName, &creator.LastName, &creator.Avatar, &creator.Nickname,
		)
		if err != nil {
			return nil, err
		}

		creator.ID = group.CreatorID
		group.Creator = creator
		invitation.Group = group
		invitations = append(invitations, invitation)
	}

	return invitations, nil
}

func (s *GroupService) PromoteToAdmin(groupID, requesterID, targetUserID uint) error {
	// Check if requester is admin or creator
	isAdmin, err := s.IsUserAdminOrCreator(groupID, requesterID)
	if err != nil {
		return err
	}
	if !isAdmin {
		return sql.ErrNoRows // Forbidden
	}

	// Check if target user is a member
	isMember, err := s.IsUserMember(groupID, targetUserID)
	if err != nil {
		return err
	}
	if !isMember {
		return sql.ErrNoRows // Not a member
	}

	// Cannot promote creator (they're already creator)
	requesterRole, err := s.GetUserRole(groupID, requesterID)
	if err != nil {
		return err
	}
	if requesterRole == "creator" && targetUserID == requesterID {
		return sql.ErrNoRows // Cannot change own role if creator
	}

	// Update role to admin
	query := `
		UPDATE group_members
		SET role = 'admin', updated_at = ?
		WHERE group_id = ? AND user_id = ?
	`
	_, err = s.db.Exec(query, time.Now(), groupID, targetUserID)
	return err
}

func (s *GroupService) DemoteAdmin(groupID, requesterID, targetUserID uint) error {
	// Check if requester is creator (only creators can demote admins)
	requesterRole, err := s.GetUserRole(groupID, requesterID)
	if err != nil {
		return err
	}
	if requesterRole != "creator" {
		return sql.ErrNoRows // Forbidden
	}

	// Cannot demote yourself
	if requesterID == targetUserID {
		return sql.ErrNoRows // Cannot demote yourself
	}

	// Check if target user is an admin
	targetRole, err := s.GetUserRole(groupID, targetUserID)
	if err != nil {
		return err
	}
	if targetRole != "admin" {
		return sql.ErrNoRows // Not an admin
	}

	// Update role to member
	query := `
		UPDATE group_members
		SET role = 'member', updated_at = ?
		WHERE group_id = ? AND user_id = ?
	`
	_, err = s.db.Exec(query, time.Now(), groupID, targetUserID)
	return err
}
