// ======================================================
// File: backend/internal/auth/middleware.go
// Package: auth
// Purpose: Auth middleware with one-time-use tokens
// ======================================================

package auth

import (
	"context"
	"encoding/json"
	"net/http"

	"backend/internal/db"
)

// --------------------
// Token Record
// --------------------
type TokenRecord struct {
	Serial string `json:"serial"`
	Token  string `json:"token"`
	UserID string `json:"user_id"`
}

// --------------------
// Context keys
// --------------------
type contextKey string

const userIDKey contextKey = "userID"

// SetUserID stores userID in request context
func SetUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

// GetUserID retrieves userID from request context
func GetUserID(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(userIDKey).(string)
	return val, ok
}

// --------------------
// Auth Middleware
// --------------------
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		serial := r.Header.Get("X-Serial")
		token := r.Header.Get("X-Auth-Token")

		if serial == "" || token == "" {
			http.Error(w, "missing auth headers", http.StatusUnauthorized)
			return
		}

		// 🔥 One-time validation (auto delete after use)
		doc, err := db.DB.ConsumeOnce("tokens", db.Document{
			"serial": serial,
			"token":  token,
		})
		if err != nil {
			http.Error(w, "invalid or already used token", http.StatusUnauthorized)
			return
		}

		// Extract userID if present
		userID := ""
		if v, ok := doc["user_id"].(string); ok {
			userID = v
		}

		// Attach userID to request context
		ctx := SetUserID(r.Context(), userID)

		// Pass to next handler
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// --------------------
// JSON Helper
// --------------------
func WriteJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}
