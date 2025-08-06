package main

import (
	"social/handlers"
	"social/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes() *gin.Engine {
	r := gin.New()

	// Add middleware
	r.Use(middleware.Logger())
	r.Use(middleware.ErrorHandler())

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(DB)
	userHandler := handlers.NewUserHandler(DB)
	friendshipHandler := handlers.NewFriendshipHandler(DB)
	postHandler := handlers.NewPostHandler(DB)
	commentHandler := handlers.NewCommentHandler(DB)
	feedHandler := handlers.NewFeedHandler(DB)

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API v1 routes
	v1 := r.Group("/api/v1")

	// Authentication routes (public)
	auth := v1.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.GET("/me", middleware.AuthMiddleware(), authHandler.GetMe)
	}

	// User routes
	users := v1.Group("/users")
	{
		users.GET("/search", middleware.AuthMiddleware(), userHandler.SearchUsers)
		users.GET("/:id", userHandler.GetProfile)
		users.PUT("/profile", middleware.AuthMiddleware(), userHandler.UpdateProfile)
	}

	// Friendship routes (protected)
	friends := v1.Group("/friends")
	friends.Use(middleware.AuthMiddleware())
	{
		friends.POST("/request", friendshipHandler.SendFriendRequest)
		friends.PUT("/:id/accept", friendshipHandler.AcceptFriendRequest)
		friends.DELETE("/:id/reject", friendshipHandler.RejectFriendRequest)
		friends.GET("/", friendshipHandler.GetFriends)
		friends.GET("/requests", friendshipHandler.GetPendingRequests)
	}

	// Post routes
	posts := v1.Group("/posts")
	{
		posts.POST("/", middleware.AuthMiddleware(), postHandler.CreatePost)
		posts.GET("/:id", postHandler.GetPost)
		posts.PUT("/:id", middleware.AuthMiddleware(), postHandler.UpdatePost)
		posts.DELETE("/:id", middleware.AuthMiddleware(), postHandler.DeletePost)
		posts.POST("/:id/like", middleware.AuthMiddleware(), postHandler.LikePost)
		posts.GET("/:id/comments", commentHandler.GetPostComments)
		posts.POST("/:id/comments", middleware.AuthMiddleware(), commentHandler.CreateComment)
	}

	// Comment routes (protected)
	comments := v1.Group("/comments")
	comments.Use(middleware.AuthMiddleware())
	{
		comments.PUT("/:id", commentHandler.UpdateComment)
		comments.DELETE("/:id", commentHandler.DeleteComment)
	}

	// Feed routes (protected)
	feed := v1.Group("/feed")
	feed.Use(middleware.AuthMiddleware())
	{
		feed.GET("/", feedHandler.GetNewsFeed)
		feed.GET("/user/:userId", feedHandler.GetUserPosts)
	}

	return r
}
