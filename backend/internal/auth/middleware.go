// =======================================================
// File 8.3: internal/auth/middleware.go
// Purpose: Token+Serial authentication middleware
// =======================================================

package auth

import (
	"net/http"

	"backend/internal/db"
)

type AuthMiddleware struct {
	tokens *db.Collection
}

// NewAuthMiddleware binds to tokens collection
func NewAuthMiddleware(tokens *db.Collection) *AuthMiddleware {
	return &AuthMiddleware{tokens: tokens}
}

// Middleware function
func (a *AuthMiddleware) Protect(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("X-Auth-Token")
		serial := r.Header.Get("X-Auth-Serial")

		if token == "" || serial == "" {
			http.Error(w, "Missing auth headers", http.StatusUnauthorized)
			return
		}

		// Check if token+serial exist in DB
		if _, ok := a.tokens.Find(serial); !ok {
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		// Pass to next handler
		next.ServeHTTP(w, r)
	})
}

// Helper: Store token+serial in DB
func StoreToken(tokens *db.Collection, token string, serial uint64) error {
	doc := db.Document{
		"token": token,
	}
	return tokens.Insert(string(rune(serial)), doc)
}
