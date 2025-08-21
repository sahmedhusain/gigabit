package middleware

import (
	"database/sql"
	"net/http"
	"social/services"
	"social/utils"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware(db *sql.DB) gin.HandlerFunc {
	sessionService := services.NewSessionService(db)

	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		var tokenString string
		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		} else {
			// Try to get token from query param (for WebSocket)
			tokenString = c.Query("token")
			if tokenString == "" {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
				c.Abort()
				return
			}
		}

		// Validate the token
		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			if err.Error() == "token expired" {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Token expired", "code": "TOKEN_EXPIRED"})
			} else {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token", "code": "INVALID_TOKEN"})
			}
			c.Abort()
			return
		}

		// Verify session exists and is valid
		session, err := sessionService.GetSessionByIDAndToken(claims.SessionID, tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid session"})
			c.Abort()
			return
		}

		// Check if session is expired
		if session.ExpiresAt.Before(time.Now()) {
			// Delete expired session
			sessionService.DeleteSession(session.ID)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Session expired", "code": "SESSION_EXPIRED"})
			c.Abort()
			return
		}

		// Set user information in context
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("session_id", claims.SessionID)

		c.Next()
	}
}

func GetUserID(c *gin.Context) (uint, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}

	id, ok := userID.(uint)
	return id, ok
}
