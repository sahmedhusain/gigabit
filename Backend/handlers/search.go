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
	db *sql.DB
}

func NewSearchHandler(db *sql.DB) *SearchHandler {
	return &SearchHandler{db: db}
}

// SearchSuggestion represents a generic search result
type SearchSuggestion struct {
	Type        string      `json:"type"`        // "user", "event", "group", "post", "tag", "message"
	ID          interface{} `json:"id"`          // Can be string or int
	Title       string      `json:"title"`       // Main display text
	Subtitle    string      `json:"subtitle"`    // Secondary info
	Image       string      `json:"image"`       // Avatar/image URL
	Description string      `json:"description"` // Additional context
	URL         string      `json:"url"`         // Frontend route
	Metadata    interface{} `json:"metadata"`    // Type-specific data
}

// UnifiedSearch searches across all resource types
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

	searchPattern := "%" + strings.ToLower(query) + "%"
	suggestions := []SearchSuggestion{}

	// Search Users (limit 5)
	userResults := h.searchUsers(userID, searchPattern, 5)
	suggestions = append(suggestions, userResults...)

	// Search Groups (limit 5)
	groupResults := h.searchGroups(userID, searchPattern, 5)
	suggestions = append(suggestions, groupResults...)

	// Search Events (limit 5)
	eventResults := h.searchEvents(userID, searchPattern, 5)
	suggestions = append(suggestions, eventResults...)

	// Search Posts (limit 5)
	postResults := h.searchPosts(userID, searchPattern, 5)
	suggestions = append(suggestions, postResults...)

	// Search Tags (limit 3)
	tagResults := h.searchTags(searchPattern, 3)
	suggestions = append(suggestions, tagResults...)

	// Search Chats (limit 5)
	chatResults := h.searchChats(userID, searchPattern, 5)
	suggestions = append(suggestions, chatResults...)

	// Search Messages (limit 5)
	messageResults := h.searchMessages(userID, searchPattern, 5)
	suggestions = append(suggestions, messageResults...)

	// Sort suggestions by relevance (users, chats, groups, events, posts, tags, messages)
	sort.Slice(suggestions, func(i, j int) bool {
		order := map[string]int{
			"user": 1, "chat": 2, "group": 3, "event": 4, "post": 5, "tag": 6, "message": 7,
		}
		return order[suggestions[i].Type] < order[suggestions[j].Type]
	})

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"suggestions": suggestions,
		"count":       len(suggestions),
		"query":       query,
	})
}

func (h *SearchHandler) searchUsers(currentUserID uint, pattern string, limit int) []SearchSuggestion {
	query := `
SELECT id, first_name, last_name, email, avatar, nickname
FROM users
WHERE id != ? AND (
LOWER(first_name) LIKE ? OR
LOWER(last_name) LIKE ? OR
LOWER(email) LIKE ? OR
LOWER(nickname) LIKE ?
)
ORDER BY first_name, last_name
LIMIT ?
`

	rows, err := h.db.Query(query, currentUserID, pattern, pattern, pattern, pattern, limit)
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

func (h *SearchHandler) searchGroups(userID uint, pattern string, limit int) []SearchSuggestion {
	query := `
		SELECT g.id,
			   g.name,
			   g.description,
			   g.created_at,
			   g.privacy,
			   (SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id AND gm2.status = 'member') as member_count,
			   CASE WHEN mygm.user_id IS NULL THEN 0 ELSE 1 END as is_member,
			   gc.id as conversation_id
		FROM groups g
		LEFT JOIN group_members mygm ON mygm.group_id = g.id AND mygm.user_id = ? AND mygm.status = 'member'
		LEFT JOIN group_conversations gc ON gc.group_id = g.id
		WHERE (LOWER(g.name) LIKE ? OR LOWER(g.description) LIKE ?)
		  AND (mygm.user_id IS NOT NULL OR g.privacy = 'public')
		ORDER BY member_count DESC, g.created_at DESC
		LIMIT ?
	`

	rows, err := h.db.Query(query, userID, pattern, pattern, limit)
	if err != nil {
		return []SearchSuggestion{}
	}
	defer rows.Close()

	var results []SearchSuggestion
	for rows.Next() {
		var id uint
		var name, description, createdAt, privacy string
		var memberCount int
		var isMemberInt int
		var conversationID sql.NullInt64

		err := rows.Scan(&id, &name, &description, &createdAt, &privacy, &memberCount, &isMemberInt, &conversationID)
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
				url = fmt.Sprintf("/chats/all?chat=%d", conversationID.Int64)
			} else {
				// Fallback: use group id; frontend can resolve
				url = fmt.Sprintf("/chats/all?chat=%d", id)
			}
		}

		results = append(results, SearchSuggestion{
			Type:        "group",
			ID:          id,
			Title:       name,
			Subtitle:    subtitle,
			Description: description,
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

func (h *SearchHandler) searchEvents(userID uint, pattern string, limit int) []SearchSuggestion {
	query := `
		SELECT e.id, e.title, e.description, e.event_time, e.location, g.name as group_name,
			   (SELECT COUNT(*) FROM event_responses WHERE event_id = e.id AND response = 'going') as going_count
		FROM events e
		JOIN groups g ON e.group_id = g.id
		WHERE LOWER(e.title) LIKE ? OR LOWER(e.description) LIKE ? OR LOWER(e.location) LIKE ?
		ORDER BY e.event_time ASC
		LIMIT ?
	`

	rows, err := h.db.Query(query, pattern, pattern, pattern, limit)
	if err != nil {
		return []SearchSuggestion{}
	}
	defer rows.Close()

	var results []SearchSuggestion
	for rows.Next() {
		var id uint
		var title, description, eventTime, location, groupName string
		var goingCount int

		err := rows.Scan(&id, &title, &description, &eventTime, &location, &groupName, &goingCount)
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
				"eventTime":  eventTime,
				"location":   location,
				"groupName":  groupName,
				"goingCount": goingCount,
			},
		})
	}

	return results
}

func (h *SearchHandler) searchPosts(userID uint, pattern string, limit int) []SearchSuggestion {
	query := `
SELECT p.id, p.content, p.created_at, u.first_name, u.last_name, u.avatar,
   (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND is_like = 1) as like_count
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE LOWER(p.content) LIKE ?
ORDER BY p.created_at DESC
LIMIT ?
`

	rows, err := h.db.Query(query, pattern, limit)
	if err != nil {
		return []SearchSuggestion{}
	}
	defer rows.Close()

	var results []SearchSuggestion
	for rows.Next() {
		var id uint
		var content, createdAt, firstName, lastName, avatar string
		var likeCount int

		err := rows.Scan(&id, &content, &createdAt, &firstName, &lastName, &avatar, &likeCount)
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
			Image:    avatar,
			URL:      fmt.Sprintf("/post/%d", id),
			Metadata: map[string]interface{}{
				"authorName": authorName,
				"createdAt":  createdAt,
				"likeCount":  likeCount,
			},
		})
	}

	return results
}

func (h *SearchHandler) searchTags(pattern string, limit int) []SearchSuggestion {
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
		LIMIT ?
	`

	rows, err := h.db.Query(query, pattern, limit)
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

func (h *SearchHandler) searchMessages(userID uint, pattern string, limit int) []SearchSuggestion {
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
		LIMIT ?
	`
	// Group
	groupQuery := `
		SELECT 
			gm.id as message_id,
			gm.content,
			gm.created_at,
			gm.sender_id,
			gc.id as conversation_id,
			g.name as group_name,
			u.avatar
		FROM group_messages gm
		JOIN group_conversations gc ON gm.conversation_id = gc.id
		JOIN groups g ON gc.group_id = g.id
		JOIN group_members m ON m.group_id = g.id AND m.user_id = ? AND m.status = 'member'
		JOIN users u ON gm.sender_id = u.id
		WHERE LOWER(gm.content) LIKE ?
		ORDER BY gm.created_at DESC
		LIMIT ?
	`

	var results []SearchSuggestion

	// Private messages
	prow, err := h.db.Query(privateQuery, userID, userID, pattern, limit)
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
	grows, err2 := h.db.Query(groupQuery, userID, pattern, limit)
	if err2 == nil {
		defer grows.Close()
		for grows.Next() {
			var messageID uint
			var content, createdAt, groupName, avatar string
			var senderID uint
			var conversationID uint
			if err := grows.Scan(&messageID, &content, &createdAt, &senderID, &conversationID, &groupName, &avatar); err != nil {
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
				URL:      fmt.Sprintf("/chats/all?chat=%d&message=%d", conversationID, messageID),
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
func (h *SearchHandler) searchChats(userID uint, pattern string, limit int) []SearchSuggestion {
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
			if len(filtered) >= limit {
				break
			}
		}
	}

	results := make([]SearchSuggestion, 0, len(filtered))
	for _, c := range filtered {
		subtitle := ""
		if c.LastMessage != nil {
			subtitle = *c.LastMessage
		}
		results = append(results, SearchSuggestion{
			Type:     "chat",
			ID:       c.ConversationID,
			Title:    c.Name,
			Subtitle: subtitle,
			URL:      fmt.Sprintf("/chats/all?chat=%d", c.ConversationID),
			Metadata: map[string]interface{}{
				"chatType": c.Type,
				"participantId": func() *uint {
					if c.Participant != nil {
						id := c.Participant.ID
						return &id
					}
					return nil
				}(),
				"groupId": func() *uint {
					if c.Group != nil {
						id := c.Group.ID
						return &id
					}
					return nil
				}(),
			},
		})
	}

	return results
}
