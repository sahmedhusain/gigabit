package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"social/handlers"
	"social/middleware"
	customsqlite "social/pkg/db/sqlite"
	"social/websocket"
	"strings"
	"time"
)

type Server struct {
	router *http.ServeMux
	DB     *customsqlite.DB
	Hub    *websocket.Hub
	server *http.Server
}

// Response represents a standard API response
type Response struct {
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// CORS middleware
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, Upgrade, Connection, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Protocol")
		w.Header().Set("Access-Control-Expose-Headers", "Content-Length")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Max-Age", "43200")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Logging middleware
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
	})
}

// JSON helper functions
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Error encoding JSON: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, Response{Error: message})
}

func writeSuccess(w http.ResponseWriter, data interface{}, message string) {
	writeJSON(w, http.StatusOK, Response{Data: data, Message: message})
}

// Database middleware
func (s *Server) dbMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), "db", s.DB.GetDB())
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func NewServer(hub *websocket.Hub) *Server {
	s := &Server{
		router: http.NewServeMux(),
		DB:     DB,
		Hub:    hub,
	}

	s.setupRoutes()
	return s
}

func (s *Server) setupRoutes() {
	// Initialize handlers
	authHandler := handlers.NewAuthHandler(s.DB.GetDB())
	uploadHandler := handlers.NewUploadHandler()
	profileHandler := handlers.NewProfileHandler(s.DB.GetDB())
	userHandler := handlers.NewUserHandler(s.DB.GetDB())
	followHandler := handlers.NewFollowHandler(s.DB.GetDB())
	postHandler := handlers.NewPostHandler(s.DB.GetDB(), s.Hub)
	categoryHandler := handlers.NewCategoryHandler(s.DB.GetDB(), s.Hub)
	groupHandler := handlers.NewGroupHandler(s.DB.GetDB())
	eventHandler := handlers.NewEventHandler(s.DB.GetDB())
	messageHandler := handlers.NewMessageHandler(s.DB.GetDB(), s.Hub)
	notificationHandler := handlers.NewNotificationHandler(s.DB.GetDB(), s.Hub)
	wsHandler := handlers.NewWebSocketHandler(s.Hub)

	// Health check
	s.router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	// Static file serving for images
	// s.router.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	// Public routes
	s.router.HandleFunc("/api/register", s.handleRoute(authHandler.Register, false))
	s.router.HandleFunc("/api/login", s.handleRoute(authHandler.Login, false))
	s.router.HandleFunc("/api/images/", s.handleRoute(uploadHandler.ServeImage, false))

	// Protected routes
	s.router.HandleFunc("/api/me", s.handleRoute(authHandler.GetMe, true))
	s.router.HandleFunc("/api/logout", s.handleRoute(authHandler.Logout, true))

	// Profile routes
	s.router.HandleFunc("/api/profile/", s.handleProfileRoute(profileHandler))
	s.router.HandleFunc("/api/profile", s.handleRoute(profileHandler.UpdateProfile, true))
	s.router.HandleFunc("/api/profile/image", s.handleRoute(profileHandler.UpdateProfileImage, true))
	s.router.HandleFunc("/api/profile/privacy", s.handleRoute(profileHandler.TogglePrivacy, true))
	s.router.HandleFunc("/api/users/search", s.handleRoute(profileHandler.SearchUsers, true))

	// User routes
	s.router.HandleFunc("/api/users", s.handleRoute(userHandler.GetAllUsers, true))
	s.router.HandleFunc("/api/users/", s.handleUserRoute(followHandler, wsHandler))

	// Post routes
	s.router.HandleFunc("/api/posts", s.handlePostsRoute(postHandler))
	s.router.HandleFunc("/api/posts/", s.handlePostRoute(postHandler))
	s.router.HandleFunc("/api/feed", s.handleRoute(postHandler.GetFeedPosts, true))

	// Category routes
	s.router.HandleFunc("/api/categories", s.handleCategoriesRoute(categoryHandler))
	s.router.HandleFunc("/api/categories/", s.handleCategoryRoute(categoryHandler))
	s.router.HandleFunc("/api/categories/stats", s.handleRoute(categoryHandler.GetCategoryStats, true))

	// Group routes
	s.router.HandleFunc("/api/groups", s.handleGroupsRoute(groupHandler))
	s.router.HandleFunc("/api/groups/", s.handleGroupRoute(groupHandler, eventHandler))

	// Event routes
	s.router.HandleFunc("/api/events/", s.handleEventRoute(eventHandler))

	// Message routes
	s.router.HandleFunc("/api/messages", s.handleMessagesRoute(messageHandler))
	s.router.HandleFunc("/api/messages/", s.handleMessageRoute(messageHandler))
	s.router.HandleFunc("/api/conversations", s.handleRoute(messageHandler.GetConversations, true))

	// Notification routes
	s.router.HandleFunc("/api/notifications", s.handleNotificationsRoute(notificationHandler))
	s.router.HandleFunc("/api/notifications/", s.handleNotificationRoute(notificationHandler))

	// WebSocket routes
	s.router.HandleFunc("/api/ws", s.handleRoute(wsHandler.HandleWebSocket, true))
	s.router.HandleFunc("/api/users/online", s.handleRoute(wsHandler.GetOnlineUsers, true))

	// Upload routes
	s.router.HandleFunc("/api/uploads", s.handleRoute(uploadHandler.UploadImage, true))

	// Dev-only debug routes (enable by setting ENABLE_DEBUG=1 in environment)
	if os.Getenv("ENABLE_DEBUG") == "1" {
		s.router.HandleFunc("/api/debug/sessions", func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}

			db := s.DB.GetDB()
			rows, err := db.Query(`SELECT id, user_id, token, expires_at, created_at, updated_at FROM sessions`)
			if err != nil {
				writeError(w, http.StatusInternalServerError, "Failed to query sessions")
				return
			}
			defer rows.Close()

			sessions := []map[string]interface{}{}
			for rows.Next() {
				var id int
				var userID int
				var token string
				var expiresAt string
				var createdAt string
				var updatedAt string
				if err := rows.Scan(&id, &userID, &token, &expiresAt, &createdAt, &updatedAt); err != nil {
					continue
				}
				sessions = append(sessions, map[string]interface{}{
					"id":         id,
					"user_id":    userID,
					"token":      token,
					"expires_at": expiresAt,
					"created_at": createdAt,
					"updated_at": updatedAt,
				})
			}

			writeJSON(w, http.StatusOK, map[string]interface{}{"sessions": sessions})
		})
	}
}

// Route handler wrapper
func (s *Server) handleRoute(handler func(http.ResponseWriter, *http.Request), requireAuth bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if requireAuth {
			// Apply auth middleware
			authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())
			authMiddleware(http.HandlerFunc(handler)).ServeHTTP(w, r)
		} else {
			handler(w, r)
		}
	}
}

// Specific route handlers for complex routing
func (s *Server) handleProfileRoute(handler *handlers.ProfileHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/profile/")
		if path == "" {
			writeError(w, http.StatusNotFound, "Profile ID required")
			return
		}

		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}

		// Extract ID and call handler
		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())
		authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			handler.GetProfile(w, r, path)
		})).ServeHTTP(w, r)
	}
}

func (s *Server) handleUserRoute(followHandler *handlers.FollowHandler, wsHandler *handlers.WebSocketHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/users/")
		parts := strings.Split(path, "/")

		if len(parts) < 2 {
			writeError(w, http.StatusNotFound, "Invalid route")
			return
		}

		userID := parts[0]
		action := parts[1]

		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())

		switch action {
		case "follow":
			authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				switch r.Method {
				case http.MethodPost:
					followHandler.SendFollowRequest(w, r)
				case http.MethodPut:
					followHandler.RespondToFollowRequest(w, r)
				case http.MethodDelete:
					followHandler.Unfollow(w, r)
				default:
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				}
			})).ServeHTTP(w, r)
		case "followers":
			if r.Method != http.MethodGet {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				followHandler.GetFollowers(w, r)
			})).ServeHTTP(w, r)
		case "following":
			if r.Method != http.MethodGet {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				followHandler.GetFollowing(w, r)
			})).ServeHTTP(w, r)
		case "status":
			if r.Method != http.MethodGet {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				wsHandler.CheckUserStatus(w, r, userID)
			})).ServeHTTP(w, r)
		default:
			writeError(w, http.StatusNotFound, "Route not found")
		}
	}
}

func (s *Server) handlePostsRoute(handler *handlers.PostHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())

		switch r.Method {
		case http.MethodGet:
			authMiddleware(http.HandlerFunc(handler.GetPosts)).ServeHTTP(w, r)
		case http.MethodPost:
			authMiddleware(http.HandlerFunc(handler.CreatePost)).ServeHTTP(w, r)
		default:
			writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
	}
}

func (s *Server) handlePostRoute(handler *handlers.PostHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/posts/")
		parts := strings.Split(path, "/")

		if len(parts) == 0 || parts[0] == "" {
			writeError(w, http.StatusNotFound, "Post ID required")
			return
		}

		postID := parts[0]
		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())

		if len(parts) == 1 {
			// Single post operations
			switch r.Method {
			case http.MethodGet:
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					handler.GetPost(w, r, postID)
				})).ServeHTTP(w, r)
			case http.MethodPut:
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					handler.UpdatePost(w, r, postID)
				})).ServeHTTP(w, r)
			case http.MethodDelete:
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					handler.DeletePost(w, r, postID)
				})).ServeHTTP(w, r)
			default:
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
			}
		} else if len(parts) == 2 {
			action := parts[1]
			switch action {
			case "like":
				switch r.Method {
				case http.MethodPost:
					authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
						handler.LikePost(w, r, postID)
					})).ServeHTTP(w, r)
				case http.MethodDelete:
					authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
						handler.UnlikePost(w, r, postID)
					})).ServeHTTP(w, r)
				default:
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				}
			case "comments":
				switch r.Method {
				case http.MethodGet:
					authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
						handler.GetPostComments(w, r, postID)
					})).ServeHTTP(w, r)
				case http.MethodPost:
					authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
						handler.CreateComment(w, r, postID)
					})).ServeHTTP(w, r)
				default:
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				}
			default:
				writeError(w, http.StatusNotFound, "Route not found")
			}
		} else if len(parts) >= 3 && parts[1] == "user" {
			userID := parts[2]
			if r.Method != http.MethodGet {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				handler.GetUserPosts(w, r, userID)
			})).ServeHTTP(w, r)
		} else if len(parts) >= 3 && parts[1] == "category" {
			categoryID := parts[2]
			if r.Method != http.MethodGet {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				handler.GetPostsByCategory(w, r, categoryID)
			})).ServeHTTP(w, r)
		} else {
			writeError(w, http.StatusNotFound, "Route not found")
		}
	}
}

func (s *Server) handleCategoriesRoute(handler *handlers.CategoryHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())

		switch r.Method {
		case http.MethodGet:
			authMiddleware(http.HandlerFunc(handler.GetAllCategories)).ServeHTTP(w, r)
		case http.MethodPost:
			authMiddleware(http.HandlerFunc(handler.CreateCategory)).ServeHTTP(w, r)
		default:
			writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
	}
}

func (s *Server) handleCategoryRoute(handler *handlers.CategoryHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/categories/")
		parts := strings.Split(path, "/")

		if len(parts) == 0 || parts[0] == "" {
			writeError(w, http.StatusNotFound, "Category ID required")
			return
		}

		// Handle special endpoints first
		if parts[0] == "stats" {
			if r.Method != http.MethodGet {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())
			authMiddleware(http.HandlerFunc(handler.GetCategoryStats)).ServeHTTP(w, r)
			return
		}

		if parts[0] == "search" {
			if r.Method != http.MethodGet {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())
			authMiddleware(http.HandlerFunc(handler.SearchCategories)).ServeHTTP(w, r)
			return
		}

		// Handle category ID routes
		categoryID := parts[0]
		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())

		if len(parts) == 1 {
			switch r.Method {
			case http.MethodGet:
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					handler.GetCategory(w, r, categoryID)
				})).ServeHTTP(w, r)
			case http.MethodPut:
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					handler.UpdateCategory(w, r, categoryID)
				})).ServeHTTP(w, r)
			case http.MethodDelete:
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					handler.DeleteCategory(w, r, categoryID)
				})).ServeHTTP(w, r)
			default:
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
			}
		} else if len(parts) == 2 {
			// No additional actions needed for individual categories currently
			writeError(w, http.StatusNotFound, "Route not found")
		}
	}
}

func (s *Server) handleGroupsRoute(handler *handlers.GroupHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())

		switch r.Method {
		case http.MethodGet:
			authMiddleware(http.HandlerFunc(handler.GetAllGroups)).ServeHTTP(w, r)
		case http.MethodPost:
			authMiddleware(http.HandlerFunc(handler.CreateGroup)).ServeHTTP(w, r)
		default:
			writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
	}
}

func (s *Server) handleGroupRoute(groupHandler *handlers.GroupHandler, eventHandler *handlers.EventHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/groups/")
		parts := strings.Split(path, "/")

		if len(parts) == 0 || parts[0] == "" {
			writeError(w, http.StatusNotFound, "Group ID required")
			return
		}

		groupID := parts[0]
		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())

		if len(parts) == 1 {
			switch r.Method {
			case http.MethodGet:
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					groupHandler.GetGroup(w, r, groupID)
				})).ServeHTTP(w, r)
			case http.MethodPut:
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					groupHandler.UpdateGroup(w, r, groupID)
				})).ServeHTTP(w, r)
			case http.MethodDelete:
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					groupHandler.DeleteGroup(w, r, groupID)
				})).ServeHTTP(w, r)
			default:
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
			}
		} else if len(parts) >= 2 {
			action := parts[1]
			switch action {
			case "invite":
				if r.Method != http.MethodPost {
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
					return
				}
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					groupHandler.InviteUsers(w, r, groupID)
				})).ServeHTTP(w, r)
			case "join":
				if r.Method != http.MethodPost {
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
					return
				}
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					groupHandler.RequestToJoin(w, r, groupID)
				})).ServeHTTP(w, r)
			case "invitation":
				if r.Method != http.MethodPut {
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
					return
				}
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					groupHandler.RespondToInvitation(w, r, groupID)
				})).ServeHTTP(w, r)
			case "leave":
				if r.Method != http.MethodDelete {
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
					return
				}
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					groupHandler.LeaveGroup(w, r, groupID)
				})).ServeHTTP(w, r)
			case "members":
				if r.Method != http.MethodGet {
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
					return
				}
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					groupHandler.GetGroupMembers(w, r, groupID)
				})).ServeHTTP(w, r)
			case "requests":
				if r.Method != http.MethodGet {
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
					return
				}
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					groupHandler.GetPendingRequests(w, r, groupID)
				})).ServeHTTP(w, r)
			case "events":
				switch r.Method {
				case http.MethodGet:
					authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
						eventHandler.GetGroupEvents(w, r, groupID)
					})).ServeHTTP(w, r)
				case http.MethodPost:
					authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
						eventHandler.CreateEvent(w, r, groupID)
					})).ServeHTTP(w, r)
				default:
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				}
			case "request":
				if len(parts) >= 3 {
					userID := parts[2]
					if r.Method != http.MethodPut {
						writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
						return
					}
					authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
						groupHandler.RespondToJoinRequest(w, r, groupID, userID)
					})).ServeHTTP(w, r)
				} else {
					writeError(w, http.StatusNotFound, "User ID required")
				}
			case "user":
				if len(parts) >= 3 {
					userID := parts[2]
					if r.Method != http.MethodGet {
						writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
						return
					}
					authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
						groupHandler.GetUserGroups(w, r, userID)
					})).ServeHTTP(w, r)
				} else {
					writeError(w, http.StatusNotFound, "User ID required")
				}
			default:
				writeError(w, http.StatusNotFound, "Route not found")
			}
		}
	}
}

func (s *Server) handleEventRoute(handler *handlers.EventHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/events/")
		parts := strings.Split(path, "/")

		if len(parts) == 0 || parts[0] == "" {
			writeError(w, http.StatusNotFound, "Event ID required")
			return
		}

		eventID := parts[0]
		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())

		if len(parts) == 1 {
			switch r.Method {
			case http.MethodGet:
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					handler.GetEvent(w, r, eventID)
				})).ServeHTTP(w, r)
			case http.MethodPut:
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					handler.UpdateEvent(w, r, eventID)
				})).ServeHTTP(w, r)
			case http.MethodDelete:
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					handler.DeleteEvent(w, r, eventID)
				})).ServeHTTP(w, r)
			default:
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
			}
		} else if len(parts) == 2 {
			action := parts[1]
			switch action {
			case "respond":
				if r.Method != http.MethodPost {
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
					return
				}
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					handler.RespondToEvent(w, r, eventID)
				})).ServeHTTP(w, r)
			case "responses":
				if r.Method != http.MethodGet {
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
					return
				}
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					handler.GetEventResponses(w, r, eventID)
				})).ServeHTTP(w, r)
			default:
				writeError(w, http.StatusNotFound, "Route not found")
			}
		}
	}
}

func (s *Server) handleMessagesRoute(handler *handlers.MessageHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())

		switch r.Method {
		case http.MethodPost:
			authMiddleware(http.HandlerFunc(handler.SendMessage)).ServeHTTP(w, r)
		default:
			writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
	}
}

func (s *Server) handleMessageRoute(handler *handlers.MessageHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/messages/")
		parts := strings.Split(path, "/")

		if len(parts) < 2 {
			writeError(w, http.StatusNotFound, "Invalid route")
			return
		}

		messageType := parts[0]
		targetID := parts[1]
		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())

		switch messageType {
		case "private":
			if r.Method != http.MethodGet {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				handler.GetPrivateMessages(w, r, targetID)
			})).ServeHTTP(w, r)
		case "group":
			if r.Method != http.MethodGet {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				handler.GetGroupMessages(w, r, targetID)
			})).ServeHTTP(w, r)
		case "read":
			if r.Method != http.MethodPut {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			authMiddleware(http.HandlerFunc(handler.MarkAsRead)).ServeHTTP(w, r)
		case "typing":
			if r.Method != http.MethodPost {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			authMiddleware(http.HandlerFunc(handler.SendTypingIndicator)).ServeHTTP(w, r)
		default:
			writeError(w, http.StatusNotFound, "Route not found")
		}
	}
}

func (s *Server) handleNotificationsRoute(handler *handlers.NotificationHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())

		switch r.Method {
		case http.MethodGet:
			authMiddleware(http.HandlerFunc(handler.GetNotifications)).ServeHTTP(w, r)
		case http.MethodPost:
			authMiddleware(http.HandlerFunc(handler.CreateNotification)).ServeHTTP(w, r)
		default:
			writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
	}
}

func (s *Server) handleNotificationRoute(handler *handlers.NotificationHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/notifications/")
		parts := strings.Split(path, "/")

		if len(parts) == 0 || parts[0] == "" {
			writeError(w, http.StatusNotFound, "Notification route required")
			return
		}

		action := parts[0]
		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())

		switch action {
		case "unread-count":
			if r.Method != http.MethodGet {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			authMiddleware(http.HandlerFunc(handler.GetUnreadCount)).ServeHTTP(w, r)
		case "read":
			if r.Method != http.MethodPut {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			authMiddleware(http.HandlerFunc(handler.MarkAsRead)).ServeHTTP(w, r)
		case "read-all":
			if r.Method != http.MethodDelete {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			authMiddleware(http.HandlerFunc(handler.DeleteAllRead)).ServeHTTP(w, r)
		default:
			// Assume it's a notification ID
			if r.Method != http.MethodDelete {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				handler.DeleteNotification(w, r, action)
			})).ServeHTTP(w, r)
		}
	}
}

func (s *Server) Run(addr string) error {
	// Create HTTP server with middleware chain
	handler := corsMiddleware(loggingMiddleware(s.dbMiddleware(s.router)))

	s.server = &http.Server{
		Addr:         addr,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("Server starting on %s", addr)
	return s.server.ListenAndServe()
}

func (s *Server) Shutdown(ctx context.Context) error {
	if s.server != nil {
		return s.server.Shutdown(ctx)
	}
	return nil
}
