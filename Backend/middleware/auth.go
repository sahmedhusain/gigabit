package middleware

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"social/services"
	"social/utils"
	"strings"
	"time"
)

func AuthMiddleware(db *sql.DB) func(http.Handler) http.Handler {
	sessionService := services.NewSessionService(db)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			var tokenString string
			if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
				tokenString = strings.TrimPrefix(authHeader, "Bearer ")
			} else {
				// Try to get token from query param (for WebSocket)
				tokenString = r.URL.Query().Get("token")
				if tokenString == "" {
					writeError(w, http.StatusUnauthorized, "Authorization token required")
					return
				}
			}

			// Validate token format
			if err := utils.ValidateTokenFormat(tokenString); err != nil {
				writeErrorWithCode(w, http.StatusUnauthorized, "Invalid token format", "INVALID_TOKEN")
				return
			}

			// Look up session by token
			session, err := sessionService.GetSessionByToken(tokenString)
			if err != nil {
				writeErrorWithCode(w, http.StatusUnauthorized, "Invalid session", "INVALID_SESSION")
				return
			}

			// Check if session is expired
			if session.ExpiresAt.Before(time.Now()) {
				// Delete expired session
				sessionService.DeleteSession(session.ID)
				writeErrorWithCode(w, http.StatusUnauthorized, "Session expired", "SESSION_EXPIRED")
				return
			}

			ctx := context.WithValue(r.Context(), "user_id", session.UserID)
			ctx = context.WithValue(ctx, "session_id", session.ID)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetUserID(r *http.Request) (uint, bool) {
	userID := r.Context().Value("user_id")
	if userID == nil {
		return 0, false
	}

	id, ok := userID.(uint)
	return id, ok
}

// Helper functions for JSON responses
func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

func writeErrorWithCode(w http.ResponseWriter, status int, message, code string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{
		"error": message,
		"code":  code,
	})
}
