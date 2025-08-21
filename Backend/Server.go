package main

import (
	"social/handlers"
	"social/middleware"
	customsqlite "social/pkg/db/sqlite"
	"social/websocket"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Server struct {
	Router *gin.Engine
	DB     *customsqlite.DB
	Hub    *websocket.Hub
}

func NewServer(hub *websocket.Hub) *Server {
	r := gin.New()

	// Add middleware
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.ErrorHandler()) // Add error handling middleware

	server := &Server{
		Router: r,
		DB:     DB,
		Hub:    hub,
	}

	server.Routes()
	return server
}

func (s *Server) Routes() {
	r := s.Router

	// Setup CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:3001"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Database middleware
	r.Use(func(c *gin.Context) {
		c.Set("db", s.DB.GetDB())
		c.Next()
	})

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(s.DB.GetDB())
	uploadHandler := handlers.NewUploadHandler()
	profileHandler := handlers.NewProfileHandler(s.DB.GetDB())
	followHandler := handlers.NewFollowHandler(s.DB.GetDB())
	postHandler := handlers.NewPostHandler(s.DB.GetDB(), s.Hub)
	categoryHandler := handlers.NewCategoryHandler(s.DB.GetDB(), s.Hub)
	groupHandler := handlers.NewGroupHandler(s.DB.GetDB())
	eventHandler := handlers.NewEventHandler(s.DB.GetDB())
	messageHandler := handlers.NewMessageHandler(s.DB.GetDB(), s.Hub)
	notificationHandler := handlers.NewNotificationHandler(s.DB.GetDB(), s.Hub)
	wsHandler := handlers.NewWebSocketHandler(s.Hub)

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Static file serving for images
	r.Static("/uploads", "./uploads")

	// Public routes
	public := r.Group("/api")
	{
		public.POST("/register", authHandler.Register)
		public.POST("/login", authHandler.Login)
		public.GET("/images/:filename", uploadHandler.ServeImage)
	}

	// Protected routes
	protected := r.Group("/api")
	protected.Use(middleware.AuthMiddleware(s.DB.GetDB()))
	{
		// Authentication routes
		protected.GET("/me", authHandler.GetMe)
		protected.POST("/logout", authHandler.Logout)

		// Profile routes
		protected.GET("/profile/:id", profileHandler.GetProfile)
		protected.PUT("/profile", profileHandler.UpdateProfile)
		protected.PUT("/profile/image", profileHandler.UpdateProfileImage)
		protected.PUT("/profile/privacy", profileHandler.TogglePrivacy)
		protected.GET("/users/search", profileHandler.SearchUsers)

		// Follow routes
		protected.POST("/users/:id/follow", followHandler.SendFollowRequest)
		protected.PUT("/users/:id/follow", followHandler.RespondToFollowRequest)
		protected.DELETE("/users/:id/follow", followHandler.Unfollow)
		protected.GET("/users/:id/followers", followHandler.GetFollowers)
		protected.GET("/users/:id/following", followHandler.GetFollowing)
		protected.GET("/follow-requests", followHandler.GetFollowRequests)

		// Post routes
		protected.POST("/posts", postHandler.CreatePost)
		protected.GET("/posts/:id", postHandler.GetPost)
		protected.PUT("/posts/:id", postHandler.UpdatePost)
		protected.DELETE("/posts/:id", postHandler.DeletePost)
		protected.GET("/posts/user/:user_id", postHandler.GetUserPosts)
		protected.GET("/posts/category/:category_id", postHandler.GetPostsByCategory)
		protected.GET("/feed", postHandler.GetFeedPosts)
		protected.POST("/posts/:id/like", postHandler.LikePost)
		protected.DELETE("/posts/:id/like", postHandler.UnlikePost)

		// Category routes
		protected.GET("/categories", categoryHandler.GetAllCategories)
		protected.GET("/categories/:id", categoryHandler.GetCategory)
		protected.POST("/categories", categoryHandler.CreateCategory)
		protected.PUT("/categories/:id", categoryHandler.UpdateCategory)
		protected.DELETE("/categories/:id", categoryHandler.DeleteCategory)
		protected.GET("/categories/stats", categoryHandler.GetCategoryStats)
		protected.GET("/categories/search", categoryHandler.SearchCategories)

		// Group routes
		protected.POST("/groups", groupHandler.CreateGroup)
		protected.GET("/groups", groupHandler.GetAllGroups)
		protected.GET("/groups/:id", groupHandler.GetGroup)
		protected.PUT("/groups/:id", groupHandler.UpdateGroup)
		protected.DELETE("/groups/:id", groupHandler.DeleteGroup)
		protected.GET("/groups/user/:user_id", groupHandler.GetUserGroups)
		protected.POST("/groups/:id/invite", groupHandler.InviteUsers)
		protected.POST("/groups/:id/join", groupHandler.RequestToJoin)
		protected.PUT("/groups/:id/invitation", groupHandler.RespondToInvitation)
		protected.PUT("/groups/:id/request/:user_id", groupHandler.RespondToJoinRequest)
		protected.DELETE("/groups/:id/leave", groupHandler.LeaveGroup)
		protected.GET("/groups/:id/members", groupHandler.GetGroupMembers)
		protected.GET("/groups/:id/requests", groupHandler.GetPendingRequests)

		// Event routes
		protected.POST("/groups/:id/events", eventHandler.CreateEvent)
		protected.GET("/events/:id", eventHandler.GetEvent)
		protected.PUT("/events/:id", eventHandler.UpdateEvent)
		protected.DELETE("/events/:id", eventHandler.DeleteEvent)
		protected.GET("/groups/:id/events", eventHandler.GetGroupEvents)
		protected.GET("/events/user/upcoming", eventHandler.GetUserEvents)
		protected.POST("/events/:id/respond", eventHandler.RespondToEvent)
		protected.GET("/events/:id/responses", eventHandler.GetEventResponses)

		// Message routes
		protected.POST("/messages", messageHandler.SendMessage)
		protected.GET("/messages/private/:user_id", messageHandler.GetPrivateMessages)
		protected.GET("/messages/group/:group_id", messageHandler.GetGroupMessages)
		protected.GET("/conversations", messageHandler.GetConversations)
		protected.PUT("/messages/read", messageHandler.MarkAsRead)
		protected.POST("/messages/typing", messageHandler.SendTypingIndicator)

		// Notification routes
		protected.GET("/notifications", notificationHandler.GetNotifications)
		protected.GET("/notifications/unread-count", notificationHandler.GetUnreadCount)
		protected.PUT("/notifications/read", notificationHandler.MarkAsRead)
		protected.DELETE("/notifications/:id", notificationHandler.DeleteNotification)
		protected.DELETE("/notifications/read-all", notificationHandler.DeleteAllRead)
		protected.POST("/notifications", notificationHandler.CreateNotification)

		// WebSocket routes
		protected.GET("/ws", wsHandler.HandleWebSocket)
		protected.GET("/users/online", wsHandler.GetOnlineUsers)
		protected.GET("/users/:id/status", wsHandler.CheckUserStatus)

		// Upload routes
		protected.POST("/upload", uploadHandler.UploadImage)
		protected.DELETE("/images/:filename", uploadHandler.DeleteImage)
	}
}
