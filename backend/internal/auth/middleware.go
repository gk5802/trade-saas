package auth

import (
	"context"
	"net/http"
	"strings"
	"time"

	"backend/internal/db"
)

type contextKey string

const userIDKey contextKey = "userID"

// Middleware protects routes by validating the access token
func Middleware(database *db.Database, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "missing authorization header", http.StatusUnauthorized)
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			http.Error(w, "invalid authorization format", http.StatusUnauthorized)
			return
		}

		accessToken := parts[1]

		// Look up the session by access token
		coll, err := database.GetCollection("sessions")
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}

		results := coll.Find(func(d db.Document) bool {
			val, ok := d["access"].(string)
			return ok && val == accessToken
		})

		if len(results) == 0 {
			http.Error(w, "invalid or expired token", http.StatusUnauthorized)
			return
		}

		sessionDoc := results[0]

		// check expiration
		exp, ok := sessionDoc["access_exp"].(int64)
		if !ok || time.Now().Unix() > exp {
			_ = coll.Delete(func(d db.Document) bool {
				val, _ := d["access"].(string)
				return val == accessToken
			})
			http.Error(w, "token expired", http.StatusUnauthorized)
			return
		}

		// token is valid → attach userID to context
		userID, _ := sessionDoc["user_id"].(string)
		ctx := context.WithValue(r.Context(), userIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetUserID retrieves the authenticated userID from context
func GetUserID(r *http.Request) (string, bool) {
	userID, ok := r.Context().Value(userIDKey).(string)
	return userID, ok
}
