package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"social/middleware"
	"social/models"
	"social/services"
	"sort"
	"strings"
)

type SearchHandler struct {
	db            *sql.DB
	searchService *services.SearchService
}

func NewSearchHandler(db *sql.DB) *SearchHandler {
	return &SearchHandler{
		db:            db,
		searchService: services.NewSearchService(db),
	}
}

// SearchSuggestion represents a generic search result - alias to the service type
type SearchSuggestion = services.SearchSuggestion

// UnifiedSearch searches across all resource types (for suggestions)
func (h *SearchHandler) UnifiedSearch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	query := r.URL.Query().Get("q")
	if query == "" || len(query) < 2 {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"suggestions": []SearchSuggestion{},
			"count":       0,
		})
		return
	}

	userID, exists := middleware.GetUserID(r)
	if !exists {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	suggestions, err := h.searchService.SearchSuggestions(userID, query)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Search failed")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"suggestions": suggestions,
		"count":       len(suggestions),
		"query":       query,
	})
}

// SearchAll handles comprehensive search with filtering by category for the search results page
func (h *SearchHandler) SearchAll(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	query := r.URL.Query().Get("q")
	filter := r.URL.Query().Get("filter") // users, groups, events, posts, messages, tags, all
	page := r.URL.Query().Get("page")
	limit := r.URL.Query().Get("limit")

	if query == "" || len(query) < 2 {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"results": []SearchSuggestion{},
			"count":   0,
			"query":   query,
			"filter":  filter,
		})
		return
	}

	userID, exists := middleware.GetUserID(r)
	if !exists {
		writeError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Parse pagination parameters
	pageNum := 1
	if page != "" {
		if p, err := fmt.Sscanf(page, "%d", &pageNum); err != nil || p != 1 || pageNum < 1 {
			pageNum = 1
		}
	}

	limitNum := 20
	if limit != "" {
		if l, err := fmt.Sscanf(limit, "%d", &limitNum); err != nil || l != 1 || limitNum < 1 || limitNum > 100 {
			limitNum = 20
		}
	}

	offset := (pageNum - 1) * limitNum
	searchPattern := "%" + strings.ToLower(query) + "%"
	var results []SearchSuggestion
	var totalCount int

	switch filter {
	case "users":
		results = h.searchUsers(userID, searchPattern, limitNum, offset)
		totalCount = h.countUsers(userID, searchPattern)
	case "groups":
		results = h.searchGroups(userID, searchPattern, limitNum, offset)
		totalCount = h.countGroups(userID, searchPattern)
	case "events":
		results = h.searchEvents(userID, searchPattern, limitNum, offset)
		totalCount = h.countEvents(userID, searchPattern)
	case "posts":
		results = h.searchPosts(userID, searchPattern, limitNum, offset)
		totalCount = h.countPosts(userID, searchPattern)
	case "messages":
		results = h.searchMessages(userID, searchPattern, limitNum, offset)
		totalCount = h.countMessages(userID, searchPattern)
	case "tags":
		results = h.searchTags(searchPattern, limitNum, offset)
		totalCount = h.countTags(searchPattern)
	case "chats":
		results = h.searchChats(userID, searchPattern, limitNum, offset)
		totalCount = h.countChats(userID, searchPattern)
	default: // "all" or any other value
		// Search across all categories with higher limits for comprehensive results
		userResults := h.searchUsers(userID, searchPattern, 10, 0)
		results = append(results, userResults...)

		groupResults := h.searchGroups(userID, searchPattern, 10, 0)
		results = append(results, groupResults...)

		eventResults := h.searchEvents(userID, searchPattern, 10, 0)
		results = append(results, eventResults...)

		postResults := h.searchPosts(userID, searchPattern, 10, 0)
		results = append(results, postResults...)

		tagResults := h.searchTags(searchPattern, 5, 0)
		results = append(results, tagResults...)

		chatResults := h.searchChats(userID, searchPattern, 10, 0)
		results = append(results, chatResults...)

		messageResults := h.searchMessages(userID, searchPattern, 10, 0)
		results = append(results, messageResults...)

		// Sort by relevance
		sort.Slice(results, func(i, j int) bool {
			order := map[string]int{
				"user": 1, "private": 2, "group": 3, "event": 4, "post": 5, "tag": 6, "message": 7,
			}
			return order[results[i].Type] < order[results[j].Type]
		})

		totalCount = len(results) // For "all" filter, total count is the combined results

		// Apply pagination to combined results
		start := (pageNum - 1) * limitNum
		end := start + limitNum
		if start >= len(results) {
			results = []SearchSuggestion{}
		} else if end > len(results) {
			results = results[start:]
		} else {
			results = results[start:end]
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"results": results,
		"count":   totalCount,
		"query":   query,
		"filter":  filter,
		"page":    pageNum,
		"limit":   limitNum,
	})
}

func (h *SearchHandler) searchUsers(currentUserID uint, pattern string, limit int, offset int) []SearchSuggestion {
	query := `
SELECT id, first_name, last_name, email, avatar, nickname
FROM users
WHERE id != ? AND is_deleted = false AND (
LOWER(first_name) LIKE ? OR
LOWER(last_name) LIKE ? OR
LOWER(email) LIKE ? OR
LOWER(nickname) LIKE ?
)
ORDER BY first_name, last_name
LIMIT ? OFFSET ?
`

	rows, err := h.db.Query(query, currentUserID, pattern, pattern, pattern, pattern, limit, offset)
	if err != nil {
		return []SearchSuggestion{}
	}
	defer rows.Close()

	var results []SearchSuggestion
	for rows.Next() {
		var user models.User
		err := rows.Scan(&user.ID, &user.FirstName, &user.LastName, &user.Email, &user.Avatar, &user.Nickname)
		if err != nil {
			continue
		}

		displayName := user.FirstName + " " + user.LastName
		if user.Nickname != nil && *user.Nickname != "" {
			displayName = *user.Nickname
		}

		subtitle := user.Email

		avatar := ""
		if user.Avatar != nil {
			avatar = *user.Avatar
		}

		results = append(results, SearchSuggestion{
			Type:     "user",
			ID:       user.ID,
			Title:    displayName,
			Subtitle: subtitle,
			Image:    avatar,
			URL:      fmt.Sprintf("/profile/%d", user.ID),
			Metadata: map[string]interface{}{
				"email":     user.Email,
				"firstName": user.FirstName,
				"lastName":  user.LastName,
			},
		})
	}

	return results
}

func (h *SearchHandler) searchGroups(userID uint, pattern string, limit int, offset int) []SearchSuggestion {
	query := `
		SELECT g.id,
			   g.name,
			   g.description,
			   g.created_at,
			   g.privacy,
			   g.avatar,
			   (SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id AND gm2.status = 'member') as member_count,
			   CASE WHEN mygm.user_id IS NULL THEN 0 ELSE 1 END as is_member,
			   gc.id as conversation_id
		FROM groups g
		LEFT JOIN group_members mygm ON mygm.group_id = g.id AND mygm.user_id = ? AND mygm.status = 'member'
		LEFT JOIN group_conversations gc ON gc.group_id = g.id
		WHERE (LOWER(g.name) LIKE ? OR LOWER(g.description) LIKE ?)
		  AND (mygm.user_id IS NOT NULL OR g.privacy = 'public')
		ORDER BY member_count DESC, g.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := h.db.Query(query, userID, pattern, pattern, limit, offset)
	if err != nil {
		return []SearchSuggestion{}
	}
	defer rows.Close()

	var results []SearchSuggestion
	for rows.Next() {
		var id uint
		var name, description, createdAt, privacy string
		var avatar sql.NullString
		var memberCount int
		var isMemberInt int
		var conversationID sql.NullInt64

		err := rows.Scan(&id, &name, &description, &createdAt, &privacy, &avatar, &memberCount, &isMemberInt, &conversationID)
		if err != nil {
			continue
		}

		subtitle := description
		if len(subtitle) > 60 {
			subtitle = subtitle[:60] + "..."
		}

		isMember := isMemberInt == 1
		joinable := !isMember && strings.ToLower(privacy) == "public"
		// If member and conversation exists, deep link to chats/all
		url := fmt.Sprintf("/group/%d", id)
		if isMember {
			if conversationID.Valid {
				url = fmt.Sprintf("/chats/all?group=%d", id)
			} else {
				// Fallback: use group id; frontend can resolve
				url = fmt.Sprintf("/chats/all?group=%d", id)
			}
		}

		// Process avatar URL
		var avatarURL string
		if avatar.Valid && avatar.String != "" {
			// If it's already a full URL, use as is
			if !strings.HasPrefix(avatar.String, "http") && !strings.HasPrefix(avatar.String, "/avatars/") && !strings.HasPrefix(avatar.String, "image:") {
				// For uploaded files, prepend the uploads path
				avatarURL = fmt.Sprintf("http://localhost:8080/api/uploads/%s", avatar.String)
			} else {
				avatarURL = avatar.String
			}
		}

		results = append(results, SearchSuggestion{
			Type:        "group",
			ID:          id,
			Title:       name,
			Subtitle:    subtitle,
			Description: description,
			Image:       avatarURL,
			URL:         url,
			Metadata: map[string]interface{}{
				"memberCount": memberCount,
				"createdAt":   createdAt,
				"privacy":     privacy,
				"isMember":    isMember,
				"joinable":    joinable,
				"conversationId": func() *int64 {
					if conversationID.Valid {
						v := conversationID.Int64
						return &v
					}
					return nil
				}(),
			},
		})
	}

	return results
}

func (h *SearchHandler) searchEvents(userID uint, pattern string, limit int, offset int) []SearchSuggestion {
	query := `
		SELECT e.id, e.title, e.description, e.event_date, e.location, g.name as group_name, g.id as group_id,
			   (SELECT COUNT(*) FROM event_responses WHERE event_id = e.id AND response = 'going') as going_count
		FROM events e
		JOIN groups g ON e.group_id = g.id
		JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = ? AND gm.status = 'member'
		WHERE LOWER(e.title) LIKE ? OR LOWER(e.description) LIKE ? OR LOWER(e.location) LIKE ?
		ORDER BY e.event_date ASC
		LIMIT ? OFFSET ?
	`

	rows, err := h.db.Query(query, userID, pattern, pattern, pattern, limit, offset)
	if err != nil {
		return []SearchSuggestion{}
	}
	defer rows.Close()

	var results []SearchSuggestion
	for rows.Next() {
		var id uint
		var title, description, eventDate, location, groupName string
		var groupID uint
		var goingCount int

		err := rows.Scan(&id, &title, &description, &eventDate, &location, &groupName, &groupID, &goingCount)
		if err != nil {
			continue
		}

		subtitle := location + " • " + groupName

		results = append(results, SearchSuggestion{
			Type:        "event",
			ID:          id,
			Title:       title,
			Subtitle:    subtitle,
			Description: description,
			URL:         fmt.Sprintf("/events/all#event-%d", id),
			Metadata: map[string]interface{}{
				"eventDate":  eventDate,
				"location":   location,
				"groupName":  groupName,
				"group_id":   groupID,
				"goingCount": goingCount,
			},
		})
	}

	return results
}

func (h *SearchHandler) searchPosts(userID uint, pattern string, limit int, offset int) []SearchSuggestion {
	query := `
SELECT p.id, p.content, p.image_url, p.created_at, u.first_name, u.last_name, u.avatar,
	(SELECT COUNT(*) FROM likes WHERE post_id = p.id AND reaction_type = 'like') as like_count,
   (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE LOWER(p.content) LIKE ?
  AND (
    p.user_id = ?
    OR p.privacy = 'public'
	OR (p.privacy = 'followers' AND EXISTS (
		SELECT 1 FROM follows f 
		WHERE f.follower_id = ? AND f.following_id = p.user_id AND f.status = 'accepted'
	))
	OR (p.privacy = 'friends' AND EXISTS (
		SELECT 1 FROM follows f1 
		WHERE f1.follower_id = ? AND f1.following_id = p.user_id AND f1.status = 'accepted'
	) AND EXISTS (
		SELECT 1 FROM follows f2 
		WHERE f2.follower_id = p.user_id AND f2.following_id = ? AND f2.status = 'accepted'
	))
    OR (p.privacy = 'listed' AND EXISTS (
        SELECT 1 FROM post_privacy pp 
        WHERE pp.post_id = p.id AND pp.user_id = ?
    ))
  )
ORDER BY p.created_at DESC
LIMIT ? OFFSET ?
`

	rows, err := h.db.Query(query, pattern, userID, userID, userID, userID, userID, limit, offset)
	if err != nil {
		return []SearchSuggestion{}
	}
	defer rows.Close()

	var results []SearchSuggestion
	for rows.Next() {
		var id uint
		var content, imageUrl, createdAt, firstName, lastName, avatar string
		var likeCount, commentCount int

		err := rows.Scan(&id, &content, &imageUrl, &createdAt, &firstName, &lastName, &avatar, &likeCount, &commentCount)
		if err != nil {
			continue
		}

		// Truncate content for display
		displayContent := content
		if len(displayContent) > 100 {
			displayContent = displayContent[:100] + "..."
		}

		authorName := firstName + " " + lastName

		results = append(results, SearchSuggestion{
			Type:     "post",
			ID:       id,
			Title:    displayContent,
			Subtitle: "by " + authorName,
			Image:    avatar, // User avatar for search results
			URL:      fmt.Sprintf("/post/%d", id),
			Metadata: map[string]interface{}{
				"authorName":   authorName,
				"createdAt":    createdAt,
				"likeCount":    likeCount,
				"commentCount": commentCount,
				"postImage":    imageUrl, // Post image if exists
			},
		})
	}

	return results
}

func (h *SearchHandler) searchTags(pattern string, limit int, offset int) []SearchSuggestion {
	// Extract potential hashtags from posts
	query := `
		SELECT DISTINCT SUBSTR(word, 2) as tag, COUNT(*) as usage_count
		FROM (
			SELECT TRIM(value) as word
			FROM posts,
			json_each('["' || REPLACE(REPLACE(content, ' ', '","'), char(10), '","') || '"]')
			WHERE word LIKE '#%'
		)
		WHERE LOWER(word) LIKE ?
		GROUP BY tag
		ORDER BY usage_count DESC
		LIMIT ? OFFSET ?
	`

	rows, err := h.db.Query(query, pattern, limit, offset)
	if err != nil {
		return []SearchSuggestion{}
	}
	defer rows.Close()

	var results []SearchSuggestion
	for rows.Next() {
		var tag string
		var usageCount int

		err := rows.Scan(&tag, &usageCount)
		if err != nil {
			continue
		}

		results = append(results, SearchSuggestion{
			Type:     "tag",
			ID:       tag,
			Title:    "#" + tag,
			Subtitle: fmt.Sprintf("%d posts", usageCount),
			URL:      "/search?tag=" + tag,
			Metadata: map[string]interface{}{
				"usageCount": usageCount,
			},
		})
	}

	return results
}

func (h *SearchHandler) searchMessages(userID uint, pattern string, limit int, offset int) []SearchSuggestion {
	// Search across private and group messages the user has access to
	// Private
	privateQuery := `
		SELECT 
			pm.id as message_id,
			pm.content,
			pm.created_at,
			pm.sender_id,
			pc.id as conversation_id,
			u.first_name,
			u.last_name,
			u.avatar
		FROM private_messages pm
		JOIN private_conversations pc ON pm.conversation_id = pc.id
		JOIN users u ON pm.sender_id = u.id
		WHERE (pc.participant1_id = ? OR pc.participant2_id = ?)
		  AND LOWER(pm.content) LIKE ?
		ORDER BY pm.created_at DESC
		LIMIT ? OFFSET ?
	`
	// Group
	groupQuery := `
		SELECT 
			gm.id as message_id,
			gm.content,
			gm.created_at,
			gm.sender_id,
			gc.id as conversation_id,
			g.id as group_id,
			g.name as group_name,
			u.avatar
		FROM group_messages gm
		JOIN group_conversations gc ON gm.conversation_id = gc.id
		JOIN groups g ON gc.group_id = g.id
		JOIN group_members m ON m.group_id = g.id AND m.user_id = ? AND m.status = 'member'
		JOIN users u ON gm.sender_id = u.id
		WHERE LOWER(gm.content) LIKE ?
		ORDER BY gm.created_at DESC
		LIMIT ? OFFSET ?
	`

	var results []SearchSuggestion

	// Private messages
	prow, err := h.db.Query(privateQuery, userID, userID, pattern, limit, offset)
	if err == nil {
		defer prow.Close()
		for prow.Next() {
			var messageID uint
			var content, createdAt, firstName, lastName, avatar string
			var senderID uint
			var conversationID uint
			if err := prow.Scan(&messageID, &content, &createdAt, &senderID, &conversationID, &firstName, &lastName, &avatar); err != nil {
				continue
			}
			displayContent := content
			if len(displayContent) > 80 {
				displayContent = displayContent[:80] + "..."
			}
			results = append(results, SearchSuggestion{
				Type:     "message",
				ID:       messageID,
				Title:    displayContent,
				Subtitle: fmt.Sprintf("with %s %s", firstName, lastName),
				Image:    avatar,
				URL:      fmt.Sprintf("/chats/all?chat=%d&message=%d", conversationID, messageID),
				Metadata: map[string]interface{}{
					"conversationId": conversationID,
					"senderId":       senderID,
					"createdAt":      createdAt,
					"type":           "private",
				},
			})
		}
	}

	// Group messages
	grows, err2 := h.db.Query(groupQuery, userID, pattern, limit, offset)
	if err2 == nil {
		defer grows.Close()
		for grows.Next() {
			var messageID uint
			var content, createdAt, groupName, avatar string
			var senderID uint
			var conversationID uint
			var groupID uint
			if err := grows.Scan(&messageID, &content, &createdAt, &senderID, &conversationID, &groupID, &groupName, &avatar); err != nil {
				continue
			}
			displayContent := content
			if len(displayContent) > 80 {
				displayContent = displayContent[:80] + "..."
			}
			results = append(results, SearchSuggestion{
				Type:     "message",
				ID:       messageID,
				Title:    displayContent,
				Subtitle: "in " + groupName,
				Image:    avatar,
				URL:      fmt.Sprintf("/chats/all?group=%d&message=%d", groupID, messageID),
				Metadata: map[string]interface{}{
					"conversationId": conversationID,
					"senderId":       senderID,
					"createdAt":      createdAt,
					"type":           "group",
				},
			})
		}
	}

	return results
}

// searchChats suggests existing conversations (private and group) the user participates in
func (h *SearchHandler) searchChats(userID uint, pattern string, limit int, offset int) []SearchSuggestion {
	chatService := services.NewChatService(h.db)
	chats, err := chatService.GetUnifiedChats(userID)
	if err != nil {
		return []SearchSuggestion{}
	}

	// Filter by name match and cap to limit
	filtered := make([]models.UnifiedChatItem, 0, limit)
	lower := strings.ToLower(pattern)
	// pattern already includes % from caller; strip % for contains match
	lower = strings.Trim(lower, "%")
	for _, c := range chats {
		name := strings.ToLower(c.Name)
		if lower == "" || strings.Contains(name, lower) {
			filtered = append(filtered, c)
		}
	}

	// Apply pagination to filtered results
	start := offset
	end := start + limit
	if start >= len(filtered) {
		filtered = []models.UnifiedChatItem{}
	} else if end > len(filtered) {
		filtered = filtered[start:]
	} else {
		filtered = filtered[start:end]
	}

	results := make([]SearchSuggestion, 0, len(filtered))
	for _, c := range filtered {
		subtitle := ""
		if c.LastMessage != nil {
			subtitle = *c.LastMessage
		}
		url := fmt.Sprintf("/chats/all?chat=%d", c.ConversationID)
		if c.Type == "group" {
			if c.GroupID != nil {
				url = fmt.Sprintf("/chats/all?group=%d", *c.GroupID)
			}
		}
		results = append(results, SearchSuggestion{
			Type:     c.Type,
			ID:       c.ConversationID,
			Title:    c.Name,
			Subtitle: subtitle,
			URL:      url,
			Metadata: map[string]interface{}{
				"chatType": c.Type,
				"participantId": func() *uint {
					if c.Participant != nil {
						id := c.Participant.ID
						return &id
					}
					return nil
				}(),
			},
		})
	}

	return results
}

func (h *SearchHandler) countUsers(currentUserID uint, pattern string) int {
	query := `
SELECT COUNT(*)
FROM users
WHERE id != ? AND is_deleted = false AND (
LOWER(first_name) LIKE ? OR
LOWER(last_name) LIKE ? OR
LOWER(email) LIKE ? OR
LOWER(nickname) LIKE ?
)
`

	var count int
	err := h.db.QueryRow(query, currentUserID, pattern, pattern, pattern, pattern).Scan(&count)
	if err != nil {
		return 0
	}
	return count
}

func (h *SearchHandler) countGroups(userID uint, pattern string) int {
	query := `
SELECT COUNT(*)
FROM groups g
LEFT JOIN group_members mygm ON mygm.group_id = g.id AND mygm.user_id = ? AND mygm.status = 'member'
WHERE (LOWER(g.name) LIKE ? OR LOWER(g.description) LIKE ?)
  AND (mygm.user_id IS NOT NULL OR g.privacy = 'public')
`

	var count int
	err := h.db.QueryRow(query, userID, pattern, pattern).Scan(&count)
	if err != nil {
		return 0
	}
	return count
}

func (h *SearchHandler) countEvents(userID uint, pattern string) int {
	query := `
SELECT COUNT(*)
FROM events e
JOIN groups g ON e.group_id = g.id
JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = ? AND gm.status = 'member'
WHERE LOWER(e.title) LIKE ? OR LOWER(e.description) LIKE ? OR LOWER(e.location) LIKE ?
`

	var count int
	err := h.db.QueryRow(query, userID, pattern, pattern, pattern).Scan(&count)
	if err != nil {
		return 0
	}
	return count
}

func (h *SearchHandler) countPosts(userID uint, pattern string) int {
	query := `
SELECT COUNT(*)
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE LOWER(p.content) LIKE ?
  AND (
    p.user_id = ?
    OR p.privacy = 'public'
    OR (p.privacy = 'followers' AND EXISTS (
        SELECT 1 FROM follows f 
        WHERE f.follower_id = ? AND f.followed_id = p.user_id AND f.status = 'accepted'
    ))
    OR (p.privacy = 'friends' AND EXISTS (
        SELECT 1 FROM follows f1 
        WHERE f1.follower_id = ? AND f1.followed_id = p.user_id AND f1.status = 'accepted'
    ) AND EXISTS (
        SELECT 1 FROM follows f2 
        WHERE f2.follower_id = p.user_id AND f2.followed_id = ? AND f2.status = 'accepted'
    ))
    OR (p.privacy = 'listed' AND EXISTS (
        SELECT 1 FROM post_privacy pp 
        WHERE pp.post_id = p.id AND pp.user_id = ?
    ))
  )
`

	var count int
	err := h.db.QueryRow(query, pattern, userID, userID, userID, userID, userID).Scan(&count)
	if err != nil {
		return 0
	}
	return count
}

func (h *SearchHandler) countTags(pattern string) int {
	query := `
SELECT COUNT(DISTINCT SUBSTR(word, 2))
FROM (
    SELECT TRIM(value) as word
    FROM posts,
    json_each('["' || REPLACE(REPLACE(content, ' ', '","'), char(10), '","') || '"]')
    WHERE word LIKE '#%'
)
WHERE LOWER(word) LIKE ?
`

	var count int
	err := h.db.QueryRow(query, pattern).Scan(&count)
	if err != nil {
		return 0
	}
	return count
}

func (h *SearchHandler) countMessages(userID uint, pattern string) int {
	// Count private messages
	privateQuery := `
SELECT COUNT(*)
FROM private_messages pm
JOIN private_conversations pc ON pm.conversation_id = pc.id
WHERE (pc.participant1_id = ? OR pc.participant2_id = ?)
  AND LOWER(pm.content) LIKE ?
`

	var privateCount int
	h.db.QueryRow(privateQuery, userID, userID, pattern).Scan(&privateCount)

	// Count group messages
	groupQuery := `
SELECT COUNT(*)
FROM group_messages gm
JOIN group_conversations gc ON gm.conversation_id = gc.id
JOIN groups g ON gc.group_id = g.id
JOIN group_members m ON m.group_id = g.id AND m.user_id = ? AND m.status = 'member'
WHERE LOWER(gm.content) LIKE ?
`

	var groupCount int
	h.db.QueryRow(groupQuery, userID, pattern).Scan(&groupCount)

	return privateCount + groupCount
}

func (h *SearchHandler) countChats(userID uint, pattern string) int {
	chatService := services.NewChatService(h.db)
	chats, err := chatService.GetUnifiedChats(userID)
	if err != nil {
		return 0
	}

	// Filter by name match
	lower := strings.ToLower(pattern)
	// pattern already includes % from caller; strip % for contains match
	lower = strings.Trim(lower, "%")

	count := 0
	for _, c := range chats {
		name := strings.ToLower(c.Name)
		if lower == "" || strings.Contains(name, lower) {
			count++
		}
	}

	return count
}
