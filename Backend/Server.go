package main

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

"gigabit/handlers"
"gigabit/middleware"
customsqlite "gigabit/pkg/db/sqlite"
"gigabit/services"
"gigabit/websocket"
)

type contextKey string

const dbContextKey contextKey = "db"

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

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, Upgrade, Connection, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Protocol")
		w.Header().Set("Access-Control-Expose-Headers", "Content-Length")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Max-Age", "43200")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, Response{Error: message})
}

func (s *Server) dbMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), dbContextKey, s.DB.GetDB())
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
	authHandler := handlers.NewAuthHandler(s.DB.GetDB())
	uploadHandler := handlers.NewUploadHandler()
	profileHandler := handlers.NewProfileHandler(s.DB.GetDB())
	userHandler := handlers.NewUserHandler(s.DB.GetDB(), s.Hub)
	followHandler := handlers.NewFollowHandler(s.DB.GetDB(), s.Hub)
	postHandler := handlers.NewPostHandler(s.DB.GetDB(), s.Hub)
	groupHandler := handlers.NewGroupHandler(s.DB.GetDB(), s.Hub)
	eventHandler := handlers.NewEventHandler(s.DB.GetDB(), s.Hub)
	messageHandler := handlers.NewMessageHandler(s.DB.GetDB(), s.Hub)
	notificationHandler := handlers.NewNotificationHandler(s.DB.GetDB(), s.Hub)
	bookmarkHandler := handlers.NewBookmarkHandler(s.DB.GetDB(), s.Hub)
	pollHandler := handlers.NewPollHandler(s.DB.GetDB(), s.Hub)
	wsHandler := handlers.NewWebSocketHandler(s.Hub)
	chatHandler := handlers.NewChatHandler(s.DB.GetDB())
	conversationHandler := handlers.NewConversationHandler(s.DB.GetDB())
	statusHandler := handlers.NewStatusHandler(s.DB.GetDB())
	searchHandler := handlers.NewSearchHandler(s.DB.GetDB())
	shareHandler := handlers.NewShareHandler(s.DB.GetDB(), s.Hub)
	s.router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	s.router.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	s.router.HandleFunc("/api/register", s.handleRoute(authHandler.Register, false))
	s.router.HandleFunc("/api/login", s.handleRoute(authHandler.Login, false))
	s.router.HandleFunc("/api/images/", s.handleRoute(uploadHandler.ServeImage, false))

	s.router.HandleFunc("/api/me", s.handleRoute(userHandler.GetMe, true))
	s.router.HandleFunc("/api/logout", s.handleRoute(authHandler.Logout, true))
	s.router.HandleFunc("/api/change-password", s.handleRoute(authHandler.ChangePassword, true))
	s.router.HandleFunc("/api/profile/", s.handleProfileRoute(profileHandler))
	s.router.HandleFunc("/api/profile", s.handleRoute(userHandler.UpdateProfile, true))
	s.router.HandleFunc("/api/profile/image", s.handleRoute(profileHandler.UpdateProfileImage, true))
	s.router.HandleFunc("/api/profile/privacy", s.handleRoute(profileHandler.TogglePrivacy, true))
	s.router.HandleFunc("/api/users/search", s.handleRoute(profileHandler.SearchUsers, true))
	s.router.HandleFunc("/api/stats/", s.handlePublicStatsRoute(profileHandler))

	s.router.HandleFunc("/api/validation/email", s.handleRoute(profileHandler.CheckEmailUniqueness, false))
	s.router.HandleFunc("/api/validation/nickname", s.handleRoute(profileHandler.CheckNicknameUniqueness, false))

	s.router.HandleFunc("/api/search/suggestions", s.handleRoute(searchHandler.UnifiedSearch, true))
	s.router.HandleFunc("/api/search", s.handleRoute(searchHandler.SearchAll, true))

	s.router.HandleFunc("/api/share", s.handleRoute(shareHandler.SharePost, true))
	s.router.HandleFunc("/api/share/recent", s.handleRoute(shareHandler.GetRecentChatsAndGroups, true))
	s.router.HandleFunc("/api/share/search", s.handleRoute(shareHandler.SearchShareableEntities, true))

	s.router.HandleFunc("/api/users", s.handleRoute(userHandler.GetAllUsers, true))
	s.router.HandleFunc("/api/users/status", s.handleRoute(userHandler.UpdateStatus, true))
	s.router.HandleFunc("/api/users/", s.handleUserRoute(followHandler, wsHandler))
	s.router.HandleFunc("/api/users/invitable/", s.handleInvitableUsersRoute(groupHandler))
	s.router.HandleFunc("/api/account", s.handleRoute(userHandler.DeleteAccount, true))
	s.router.HandleFunc("/api/privacy/birthday", s.handleRoute(userHandler.UpdateBirthdayPrivacy, true))
	s.router.HandleFunc("/api/privacy/gender", s.handleRoute(userHandler.UpdateGenderPrivacy, true))

	s.router.HandleFunc("/api/status/me", s.handleRoute(statusHandler.GetMyStatus, true))
	s.router.HandleFunc("/api/status/update", s.handleRoute(statusHandler.UpdateMyStatus, true))
	s.router.HandleFunc("/api/status/online", s.handleRoute(statusHandler.GetOnlineUsers, true))

	s.router.HandleFunc("/api/posts", s.handlePostsRoute(postHandler))
	s.router.HandleFunc("/api/posts/", s.handlePostRoute(postHandler))
	s.router.HandleFunc("/api/feed", s.handleRoute(postHandler.GetFeedPosts, true))

	s.router.HandleFunc("/api/posts/liked", s.handleRoute(postHandler.GetUserLikedPosts, true))
	s.router.HandleFunc("/api/posts/commented", s.handleRoute(postHandler.GetUserCommentedPosts, true))

	s.router.HandleFunc("/api/bookmarks", s.handleRoute(bookmarkHandler.GetUserBookmarks, true))
	s.router.HandleFunc("/api/bookmarks/", s.handleBookmarkRoute(bookmarkHandler))

	// Group routes
	s.router.HandleFunc("/api/groups", s.handleGroupsRoute(groupHandler))
	s.router.HandleFunc("/api/groups/", s.handleGroupRoute(groupHandler, eventHandler, pollHandler))
	s.router.HandleFunc("/api/groups/invitations", s.handleRoute(groupHandler.GetUserInvitations, true))
	s.router.HandleFunc("/api/follow/requests", s.handleRoute(followHandler.GetFollowRequests, true))
	s.router.HandleFunc("/api/follow/requests/outgoing", s.handleRoute(followHandler.GetOutgoingFollowRequests, true))
	s.router.HandleFunc("/api/groups/join-requests/outgoing", s.handleRoute(groupHandler.GetOutgoingGroupJoinRequests, true))

	s.router.HandleFunc("/api/events", s.handleUserEventsRoute(eventHandler))
	s.router.HandleFunc("/api/events/", s.handleEventRoute(eventHandler))

	s.router.HandleFunc("/api/messages", s.handleMessagesRoute(messageHandler))
	s.router.HandleFunc("/api/messages/", s.handleMessageRoute(messageHandler))
	s.router.HandleFunc("/api/conversations", s.handleRoute(messageHandler.GetConversations, true))
	s.router.HandleFunc("/api/conversations/", s.handleConversationRoute(conversationHandler))
	s.router.HandleFunc("/api/chats", s.handleChatsRoute(chatHandler, messageHandler, groupHandler))

	s.router.HandleFunc("/api/notifications", s.handleNotificationsRoute(notificationHandler))
	s.router.HandleFunc("/api/notifications/", s.handleNotificationRoute(notificationHandler))

	s.router.HandleFunc("/api/ws", s.handleRoute(wsHandler.HandleWebSocket, true))
	s.router.HandleFunc("/api/users/online", s.handleRoute(wsHandler.GetOnlineUsers, true))

	s.router.HandleFunc("/api/uploads", s.handleRoute(uploadHandler.UploadImage, true))
	s.router.HandleFunc("/api/upload/avatar", s.handleRoute(uploadHandler.UploadAvatar, true))

	s.router.HandleFunc("/api/polls", s.handlePollsRoute(pollHandler))
	s.router.HandleFunc("/api/polls/", s.handlePollRoute(pollHandler))
}

func (s *Server) handleRoute(handler func(http.ResponseWriter, *http.Request), requireAuth bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if requireAuth {
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

		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())
		authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			handler.GetProfile(w, r, path)
		})).ServeHTTP(w, r)
	}
}

// handlePublicStatsRoute handles public stats requests (no auth required)
func (s *Server) handlePublicStatsRoute(handler *handlers.ProfileHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/stats/")
		if path == "" {
			writeError(w, http.StatusNotFound, "User ID required")
			return
		}

		handler.GetPublicStats(w, r, path)
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
		case "follow-status":
			if r.Method != http.MethodGet {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				followHandler.GetFollowStatus(w, r)
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

func (s *Server) handleInvitableUsersRoute(groupHandler *handlers.GroupHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/users/invitable/")
		if path == "" {
			writeError(w, http.StatusNotFound, "Group ID required")
			return
		}

		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
			return
		}

		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())
		authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			groupHandler.GetInvitableUsers(w, r, path)
		})).ServeHTTP(w, r)
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
		} else if len(parts) >= 2 && parts[0] == "user" {
			userID := parts[1]
			if r.Method != http.MethodGet {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				handler.GetUserPosts(w, r, userID)
			})).ServeHTTP(w, r)
		} else if len(parts) >= 2 {
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
			case "dislike":
				switch r.Method {
				case http.MethodPost:
					authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
						handler.DislikePost(w, r, postID)
					})).ServeHTTP(w, r)
				case http.MethodDelete:
					authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
						handler.UndislikePost(w, r, postID)
					})).ServeHTTP(w, r)
				default:
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				}
			case "comments":
				if len(parts) == 2 {
					// /api/posts/{postID}/comments - collection operations
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
				} else if len(parts) == 3 {
					// /api/posts/{postID}/comments/{commentID} - individual comment operations
					commentID := parts[2]
					switch r.Method {
					case http.MethodDelete:
						authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
							handler.DeleteComment(w, r, postID, commentID)
						})).ServeHTTP(w, r)
					default:
						writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
					}
				} else {
					writeError(w, http.StatusNotFound, "Invalid comments route")
				}
			default:
				writeError(w, http.StatusNotFound, "Route not found")
			}
		} else {
			writeError(w, http.StatusNotFound, "Route not found")
		}
	}
}

func (s *Server) handleBookmarkRoute(handler *handlers.BookmarkHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/bookmarks/")
		parts := strings.Split(path, "/")

		if len(parts) == 0 || parts[0] == "" {
			writeError(w, http.StatusNotFound, "Post ID required")
			return
		}

		postID := parts[0]
		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())

		if len(parts) == 1 {
			switch r.Method {
			case http.MethodPost:
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					handler.BookmarkPost(w, r, postID)
				})).ServeHTTP(w, r)
			case http.MethodDelete:
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					handler.UnbookmarkPost(w, r, postID)
				})).ServeHTTP(w, r)
			case http.MethodGet:
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					handler.CheckBookmarkStatus(w, r, postID)
				})).ServeHTTP(w, r)
			default:
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
			}
		} else {
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

func (s *Server) handleGroupRoute(groupHandler *handlers.GroupHandler, eventHandler *handlers.EventHandler, pollHandler *handlers.PollHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/groups/")
		parts := strings.Split(path, "/")

		if len(parts) == 0 || parts[0] == "" {
			writeError(w, http.StatusNotFound, "Group ID required")
			return
		}

		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())

		// Special case for /api/groups/user/{userID}
		if parts[0] == "user" {
			if len(parts) >= 2 {
				userID := parts[1]
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
			return
		}

		// Regular group routes: /api/groups/{groupID} and /api/groups/{groupID}/{action}
		groupID := parts[0]

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
				if len(parts) == 2 {
					// GET /api/groups/{groupID}/members
					if r.Method != http.MethodGet {
						writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
						return
					}
					authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
						groupHandler.GetGroupMembers(w, r, groupID)
					})).ServeHTTP(w, r)
				} else if len(parts) >= 3 {
					// Handle /api/groups/{groupID}/members/{userID}/role or /api/groups/{groupID}/members/{userID}
					userID := parts[2]
					if len(parts) == 4 && parts[3] == "role" {
						// PUT /api/groups/{groupID}/members/{userID}/role
						if r.Method != http.MethodPut {
							writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
							return
						}
						authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
							groupHandler.UpdateMemberRole(w, r, groupID, userID)
						})).ServeHTTP(w, r)
					} else if len(parts) == 3 {
						// DELETE /api/groups/{groupID}/members/{userID}
						if r.Method != http.MethodDelete {
							writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
							return
						}
						authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
							groupHandler.KickMember(w, r, groupID, userID)
						})).ServeHTTP(w, r)
					} else {
						writeError(w, http.StatusNotFound, "Not found")
					}
				} else {
					writeError(w, http.StatusNotFound, "Invalid members route")
				}
			case "requests":
				if r.Method != http.MethodGet {
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
					return
				}
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					groupHandler.GetPendingRequests(w, r, groupID)
				})).ServeHTTP(w, r)
			case "role":
				if r.Method != http.MethodGet {
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
					return
				}
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					groupHandler.GetUserRole(w, r, groupID)
				})).ServeHTTP(w, r)
			case "next-admin":
				if r.Method != http.MethodGet {
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
					return
				}
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					groupHandler.GetNextAdmin(w, r, groupID)
				})).ServeHTTP(w, r)
			case "promote":
				if r.Method != http.MethodPost {
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
					return
				}
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					groupHandler.PromoteToAdmin(w, r, groupID)
				})).ServeHTTP(w, r)
			case "demote":
				if r.Method != http.MethodPost {
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
					return
				}
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					groupHandler.DemoteAdmin(w, r, groupID)
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
			case "polls":
				if r.Method != http.MethodGet {
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
					return
				}
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					userID, ok := middleware.GetUserID(r)
					if !ok {
						writeError(w, http.StatusUnauthorized, "Unauthorized")
						return
					}
					pollHandler.GetGroupPolls(w, r, userID)
				})).ServeHTTP(w, r)
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
			case "posts":
				if len(parts) >= 5 {
					// Handle post comments: /api/groups/{groupID}/posts/{postID}/comments/{commentID}
					postID := parts[2]
					if parts[3] == "comments" {
						commentID := parts[4]
						switch r.Method {
						case http.MethodDelete:
							authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
								commentService := services.NewGroupCommentService(s.DB.GetDB(), s.Hub)
								groupHandler.DeleteGroupPostComment(w, r, groupID, postID, commentID, commentService)
							})).ServeHTTP(w, r)
						default:
							writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
						}
					} else {
						writeError(w, http.StatusNotFound, "Invalid route")
					}
				} else if len(parts) >= 4 {
					// Handle individual post actions: /api/groups/{groupID}/posts/{postID}/{action}
					postID := parts[2]
					action := parts[3]
					switch action {
					case "like":
						switch r.Method {
						case http.MethodPost:
							authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
								groupHandler.LikeGroupPost(w, r, groupID, postID)
							})).ServeHTTP(w, r)
						case http.MethodDelete:
							authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
								groupHandler.UnlikeGroupPost(w, r, groupID, postID)
							})).ServeHTTP(w, r)
						default:
							writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
						}
					case "dislike":
						switch r.Method {
						case http.MethodPost:
							authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
								groupHandler.DislikeGroupPost(w, r, groupID, postID)
							})).ServeHTTP(w, r)
						case http.MethodDelete:
							authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
								groupHandler.UndislikeGroupPost(w, r, groupID, postID)
							})).ServeHTTP(w, r)
						default:
							writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
						}
					case "comments":
						// Handle post comments collection: /api/groups/{groupID}/posts/{postID}/comments
						switch r.Method {
						case http.MethodGet:
							authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
								commentService := services.NewGroupCommentService(s.DB.GetDB(), s.Hub)
								groupHandler.GetGroupPostComments(w, r, groupID, postID, commentService)
							})).ServeHTTP(w, r)
						case http.MethodPost:
							authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
								commentService := services.NewGroupCommentService(s.DB.GetDB(), s.Hub)
								groupHandler.CreateGroupPostComment(w, r, groupID, postID, commentService)
							})).ServeHTTP(w, r)
						default:
							writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
						}
					default:
						writeError(w, http.StatusNotFound, "Invalid post action")
					}
				} else if len(parts) >= 3 {
					// Handle individual post operations: /api/groups/{groupID}/posts/{postID}
					postID := parts[2]
					switch r.Method {
					case http.MethodGet:
						authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
							groupHandler.GetGroupPost(w, r, groupID, postID)
						})).ServeHTTP(w, r)
					case http.MethodDelete:
						authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
							groupHandler.DeleteGroupPost(w, r, groupID, postID)
						})).ServeHTTP(w, r)
					default:
						writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
					}
				} else {
					// Handle group posts collection: /api/groups/{groupID}/posts
					switch r.Method {
					case http.MethodGet:
						authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
							groupHandler.GetGroupPosts(w, r, groupID)
						})).ServeHTTP(w, r)
					case http.MethodPost:
						authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
							groupHandler.CreateGroupPost(w, r, groupID)
						})).ServeHTTP(w, r)
					default:
						writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
					}
				}
			case "privacy":
				if r.Method != http.MethodPut {
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
					return
				}
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					groupHandler.UpdateGroupPrivacy(w, r, groupID)
				})).ServeHTTP(w, r)
			case "permissions":
				if r.Method != http.MethodPut {
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
					return
				}
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					groupHandler.UpdateGroupPermissions(w, r, groupID)
				})).ServeHTTP(w, r)
			case "join-requests":
				if len(parts) >= 3 {
					requestType := parts[2]
					if r.Method != http.MethodGet {
						writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
						return
					}
					if requestType == "sent" {
						authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
							groupHandler.GetSentJoinRequests(w, r, groupID)
						})).ServeHTTP(w, r)
					} else if requestType == "received" {
						authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
							groupHandler.GetReceivedJoinRequests(w, r, groupID)
						})).ServeHTTP(w, r)
					} else {
						writeError(w, http.StatusNotFound, "Invalid request type")
					}
				} else {
					writeError(w, http.StatusNotFound, "Request type required")
				}
			case "messages":
				if len(parts) >= 3 {
					messageID := parts[2]
					if r.Method != http.MethodDelete {
						writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
						return
					}
					authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
						groupHandler.DeleteGroupMessage(w, r, groupID, messageID)
					})).ServeHTTP(w, r)
				} else {
					writeError(w, http.StatusNotFound, "Message ID required")
				}
			case "cancel-invitation":
				if len(parts) >= 3 {
					invitationID := parts[2]
					if r.Method != http.MethodDelete {
						writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
						return
					}
					authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
						groupHandler.CancelInvitation(w, r, groupID, invitationID)
					})).ServeHTTP(w, r)
				} else {
					writeError(w, http.StatusNotFound, "Invitation ID required")
				}
			default:
				writeError(w, http.StatusNotFound, "Invalid endpoint")
			}
		}
	}
}

func (s *Server) handleUserEventsRoute(handler *handlers.EventHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())
		authMiddleware(http.HandlerFunc(handler.GetUserEvents)).ServeHTTP(w, r)
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
			case "cancel":
				if r.Method != http.MethodPut {
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
					return
				}
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					handler.CancelEvent(w, r, eventID)
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

		if len(parts) == 0 || parts[0] == "" {
			writeError(w, http.StatusNotFound, "Invalid route")
			return
		}

		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())

		// Handle DELETE /api/messages/{id}
		if len(parts) == 1 && r.Method == http.MethodDelete {
			authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				handler.DeleteMessage(w, r)
			})).ServeHTTP(w, r)
			return
		}

		messageType := parts[0]

		// Handle routes that don't need targetID
		if messageType == "read" || messageType == "unread" || messageType == "search" {
			if r.Method != http.MethodPut && messageType != "search" {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			if r.Method != http.MethodGet && messageType == "search" {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			if messageType == "read" {
				authMiddleware(http.HandlerFunc(s.handleReadRequest(handler))).ServeHTTP(w, r)
			} else if messageType == "unread" {
				authMiddleware(http.HandlerFunc(s.handleUnreadRequest(handler))).ServeHTTP(w, r)
			} else if messageType == "search" {
				authMiddleware(http.HandlerFunc(handler.SearchMessages)).ServeHTTP(w, r)
			}
			return
		}

		// For routes that need targetID
		if len(parts) < 2 {
			writeError(w, http.StatusNotFound, "Invalid route")
			return
		}

		targetID := parts[1]

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
		case "conversation":
			if r.Method != http.MethodGet {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				return
			}
			authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				handler.GetConversationMessages(w, r, targetID)
			})).ServeHTTP(w, r)
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
		case "settings":
			switch r.Method {
			case http.MethodGet:
				authMiddleware(http.HandlerFunc(handler.GetNotificationSettings)).ServeHTTP(w, r)
			case http.MethodPut:
				authMiddleware(http.HandlerFunc(handler.UpdateNotificationSettings)).ServeHTTP(w, r)
			default:
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
			}
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

func (s *Server) handleConversationRoute(handler *handlers.ConversationHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/conversations/")
		parts := strings.Split(path, "/")

		if len(parts) == 0 || parts[0] == "" {
			writeError(w, http.StatusNotFound, "Conversation ID required")
			return
		}

		conversationID := parts[0]
		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())

		if len(parts) == 1 {
			switch r.Method {
			case http.MethodDelete:
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					handler.DeleteConversation(w, r, conversationID)
				})).ServeHTTP(w, r)
			default:
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
			}
		} else {
			writeError(w, http.StatusNotFound, "Route not found")
		}
	}
}

func (s *Server) handleChatsRoute(chatHandler *handlers.ChatHandler, messageHandler *handlers.MessageHandler, groupHandler *handlers.GroupHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Apply auth middleware
		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())

		authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			query := r.URL.Query()

			// Check for ?chats=id (private chat)
			if chatID := query.Get("chats"); chatID != "" {
				switch r.Method {
				case http.MethodGet:
					// Get private conversation messages
					messageHandler.GetConversationMessages(w, r, chatID)
				default:
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				}
				return
			}

			// Check for ?group=id (group chat)
			if groupID := query.Get("group"); groupID != "" {
				switch r.Method {
				case http.MethodGet:
					// Get group details
					groupHandler.GetGroup(w, r, groupID)
				default:
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				}
				return
			}

			// No query parameters - return unified chats list
			if r.Method == http.MethodGet {
				chatHandler.GetUnifiedChats(w, r)
			} else {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
			}
		})).ServeHTTP(w, r)
	}
}

// handlePollsRoute handles /api/polls (POST - create poll)
func (s *Server) handlePollsRoute(handler *handlers.PollHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())

		if r.Method == http.MethodPost {
			authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				userID, ok := middleware.GetUserID(r)
				if !ok {
					writeError(w, http.StatusUnauthorized, "Unauthorized")
					return
				}
				handler.CreatePoll(w, r, userID)
			})).ServeHTTP(w, r)
		} else {
			writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
	}
}

// handlePollRoute handles /api/polls/{id} and /api/polls/{id}/vote and /api/polls/{id}/expire
func (s *Server) handlePollRoute(handler *handlers.PollHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/polls/")
		parts := strings.Split(path, "/")

		if len(parts) == 0 || parts[0] == "" {
			writeError(w, http.StatusNotFound, "Poll ID required")
			return
		}

		authMiddleware := middleware.AuthMiddleware(s.DB.GetDB())

		if len(parts) == 1 {
			// GET /api/polls/{id} - Get single poll
			// DELETE /api/polls/{id} - Delete poll
			if r.Method == http.MethodGet {
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					userID, ok := middleware.GetUserID(r)
					if !ok {
						writeError(w, http.StatusUnauthorized, "Unauthorized")
						return
					}
					handler.GetPoll(w, r, userID)
				})).ServeHTTP(w, r)
			} else if r.Method == http.MethodDelete {
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					userID, ok := middleware.GetUserID(r)
					if !ok {
						writeError(w, http.StatusUnauthorized, "Unauthorized")
						return
					}
					handler.DeletePoll(w, r, userID)
				})).ServeHTTP(w, r)
			} else {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
			}
		} else if len(parts) == 2 && parts[1] == "vote" {
			authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				userID, ok := middleware.GetUserID(r)
				if !ok {
					writeError(w, http.StatusUnauthorized, "Unauthorized")
					return
				}
				if r.Method == http.MethodPost {
					handler.VotePoll(w, r, userID)
				} else if r.Method == http.MethodDelete {
					handler.UnvotePoll(w, r, userID)
				} else {
					writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
				}
			})).ServeHTTP(w, r)
		} else if len(parts) == 2 && parts[1] == "expire" {
			// PUT /api/polls/{id}/expire - Expire poll
			if r.Method == http.MethodPut {
				authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					userID, ok := middleware.GetUserID(r)
					if !ok {
						writeError(w, http.StatusUnauthorized, "Unauthorized")
						return
					}
					handler.ExpirePoll(w, r, userID)
				})).ServeHTTP(w, r)
			} else {
				writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
			}
		} else {
			writeError(w, http.StatusNotFound, "Route not found")
		}
	}
}

// handleReadRequest differentiates between marking individual messages as read vs marking a conversation as read
func (s *Server) handleReadRequest(handler *handlers.MessageHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Read the request body to determine the type
		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			writeError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		// Restore the body for the handler to read again
		r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		// Try to parse as MarkReadRequest (message_ids)
		var markReadReq struct {
			MessageIDs []uint `json:"message_ids"`
		}
		if json.Unmarshal(bodyBytes, &markReadReq) == nil && len(markReadReq.MessageIDs) > 0 {
			// This is a request to mark individual messages as read
			handler.MarkAsRead(w, r)
			return
		}

		// Try to parse as conversation read request
		var convReadReq struct {
			ConversationID   uint   `json:"conversation_id"`
			ConversationType string `json:"conversation_type"`
		}
		if json.Unmarshal(bodyBytes, &convReadReq) == nil && convReadReq.ConversationID > 0 {
			// This is a request to mark a conversation as read
			handler.MarkConversationAsRead(w, r)
			return
		}

		// If neither parsing worked, return an error
		writeError(w, http.StatusBadRequest, "Invalid request body: must contain either message_ids or conversation_id")
	}
}

// handleUnreadRequest differentiates between marking individual messages as unread vs marking a conversation as unread
func (s *Server) handleUnreadRequest(handler *handlers.MessageHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Read the request body to determine the type
		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			writeError(w, http.StatusBadRequest, "Invalid request body")
			return
		}

		// Restore the body for the handler to read again
		r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		// Try to parse as MarkReadRequest (message_ids)
		var markUnreadReq struct {
			MessageIDs []uint `json:"message_ids"`
		}
		if json.Unmarshal(bodyBytes, &markUnreadReq) == nil && len(markUnreadReq.MessageIDs) > 0 {
			// This is a request to mark individual messages as unread
			handler.MarkAsUnread(w, r)
			return
		}

		// Try to parse as conversation unread request
		var convUnreadReq struct {
			ConversationID   uint   `json:"conversation_id"`
			ConversationType string `json:"conversation_type"`
		}
		if json.Unmarshal(bodyBytes, &convUnreadReq) == nil && convUnreadReq.ConversationID > 0 {
			// This is a request to mark a conversation as unread
			handler.MarkConversationAsUnread(w, r)
			return
		}

		// If neither parsing worked, return an error
		writeError(w, http.StatusBadRequest, "Invalid request body: must contain either message_ids or conversation_id")
	}
}
