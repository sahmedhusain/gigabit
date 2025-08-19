package main

import (
	"social/handlers"
	"social/middleware"
	customsqlite "social/pkg/db/sqlite"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Server struct {
	Router *gin.Engine
	DB     *customsqlite.DB
}

func NewServer() *Server {
	r := gin.New()

	// Add middleware
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.ErrorHandler()) // Add error handling middleware

	server := &Server{
		Router: r,
		DB:     DB,
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

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Public routes
	public := r.Group("/api")
	{
		public.POST("/register", authHandler.Register)
		public.POST("/login", authHandler.Login)
	}

	// Protected routes
	protected := r.Group("/api")
	protected.Use(middleware.AuthMiddleware(s.DB.GetDB()))
	{
		protected.GET("/me", authHandler.GetMe)
		protected.POST("/logout", authHandler.Logout)
	}
}
