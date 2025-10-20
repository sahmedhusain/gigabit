package services

import (
	"database/sql"
	"fmt"
	"sort"
	"strings"

	"social/models"
)

type SearchService struct {
	db *sql.DB
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

func NewSearchService(db *sql.DB) *SearchService {
	return &SearchService{db: db}
}

// SearchSuggestions performs a quick search across all categories for real-time suggestions
func (s *SearchService) SearchSuggestions(userID uint, query string) ([]SearchSuggestion, error) {
	if len(query) < 2 {
		return []SearchSuggestion{}, nil
	}

	searchPattern := "%" + strings.ToLower(query) + "%"
	var suggestions []SearchSuggestion

	// Search Users (limit 3)
	userResults := s.searchUsers(userID, searchPattern, 3)
	suggestions = append(suggestions, userResults...)

	// Search Groups (limit 3)
	groupResults := s.searchGroups(userID, searchPattern, 3)
	suggestions = append(suggestions, groupResults...)

	// Search Events (limit 3)
	eventResults := s.searchEvents(userID, searchPattern, 3)
	suggestions = append(suggestions, eventResults...)

	// Search Posts (limit 3)
	postResults := s.searchPosts(userID, searchPattern, 3)
	suggestions = append(suggestions, postResults...)

	// Search Chats (limit 3)
	chatResults := s.searchChats(userID, searchPattern, 3)
	suggestions = append(suggestions, chatResults...)

	// Sort by relevance
	sort.Slice(suggestions, func(i, j int) bool {
		order := map[string]int{
			"user": 1, "chat": 2, "group": 3, "event": 4, "post": 5, "tag": 6, "message": 7,
		}
		return order[suggestions[i].Type] < order[suggestions[j].Type]
	})

	return suggestions, nil
}

func (s *SearchService) searchUsers(currentUserID uint, pattern string, limit int) []SearchSuggestion {
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

	rows, err := s.db.Query(query, currentUserID, pattern, pattern, pattern, pattern, limit)
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

func (s *SearchService) searchGroups(userID uint, pattern string, limit int) []SearchSuggestion {
	query := `
		SELECT g.id,
			   g.name,
			   g.description,
			   g.created_at,
			   g.privacy,
			   g.avatar,
			   (SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id AND gm2.status = 'member') as member_count,
			   CASE WHEN mygm.user_id IS NULL THEN NULL ELSE mygm.status END as member_status,
			   gc.id as conversation_id
		FROM groups g
		LEFT JOIN group_members mygm ON mygm.group_id = g.id AND mygm.user_id = ?
		LEFT JOIN group_conversations gc ON gc.group_id = g.id
		WHERE (LOWER(g.name) LIKE ? OR LOWER(g.description) LIKE ?)
		  AND (mygm.user_id IS NOT NULL OR g.privacy = 'public')
		ORDER BY member_count DESC, g.created_at DESC
		LIMIT ?
	`

	rows, err := s.db.Query(query, userID, pattern, pattern, limit)
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
		var memberStatus sql.NullString
		var conversationID sql.NullInt64

		err := rows.Scan(&id, &name, &description, &createdAt, &privacy, &avatar, &memberCount, &memberStatus, &conversationID)
		if err != nil {
			continue
		}

		subtitle := description
		if len(subtitle) > 60 {
			subtitle = subtitle[:60] + "..."
		}

		isMember := memberStatus.Valid && memberStatus.String == "member"
		hasPendingRequest := memberStatus.Valid && (memberStatus.String == "requested" || memberStatus.String == "sent")
		joinable := !isMember && !hasPendingRequest && strings.ToLower(privacy) == "public"
		url := fmt.Sprintf("/group/%d", id)
		if isMember {
			if conversationID.Valid {
				url = fmt.Sprintf("/chats/all?chat=%d", conversationID.Int64)
			} else {
				url = fmt.Sprintf("/chats/all?chat=%d", id)
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
				"memberStatus": func() *string {
					if memberStatus.Valid {
						return &memberStatus.String
					}
					return nil
				}(),
				"joinable": joinable,
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

func (s *SearchService) searchEvents(userID uint, pattern string, limit int) []SearchSuggestion {
	query := `
		SELECT e.id, e.title, e.description, e.event_time, e.location, g.name as group_name,
			   (SELECT COUNT(*) FROM event_responses WHERE event_id = e.id AND response = 'going') as going_count
		FROM events e
		JOIN groups g ON e.group_id = g.id
		WHERE LOWER(e.title) LIKE ? OR LOWER(e.description) LIKE ? OR LOWER(e.location) LIKE ?
		ORDER BY e.event_time ASC
		LIMIT ?
	`

	rows, err := s.db.Query(query, pattern, pattern, pattern, limit)
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

func (s *SearchService) searchPosts(userID uint, pattern string, limit int) []SearchSuggestion {
	query := `
SELECT p.id, p.content, p.created_at, u.first_name, u.last_name, u.avatar,
   (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND is_like = 1) as like_count
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE LOWER(p.content) LIKE ?
ORDER BY p.created_at DESC
LIMIT ?
`

	rows, err := s.db.Query(query, pattern, limit)
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

func (s *SearchService) searchChats(userID uint, pattern string, limit int) []SearchSuggestion {
	chatService := NewChatService(s.db)
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
