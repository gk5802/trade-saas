package auth

import (
	"context"
	"net/http"
	"strings"
	"time"

	"backend/internal/db"
)

type ctxKey string

const userKey ctxKey = "userID"

// Middleware checks Authorization: Bearer <access> and attaches userID to ctx
func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authz := r.Header.Get("Authorization")
		if authz == "" {
			http.Error(w, "missing authorization", http.StatusUnauthorized)
			return
		}
		parts := strings.SplitN(authz, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			http.Error(w, "invalid authorization", http.StatusUnauthorized)
			return
		}
		access := parts[1]

		// find session
		c := db.DefaultDB.CreateCollection("sessions")
		res := c.Find(func(d db.Document) bool {
			if a, ok := d["access"].(string); ok {
				return a == access
			}
			return false
		})
		if len(res) == 0 {
			http.Error(w, "invalid or expired token", http.StatusUnauthorized)
			return
		}
		// check expiry
		exp, ok := res[0]["access_exp"]
		if !ok {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}
		if expI, ok := toInt64(exp); ok {
			if time.Now().Unix() > expI {
				// delete expired
				_ = c.Delete(func(d db.Document) bool {
					if a, ok := d["access"].(string); ok {
						return a == access
					}
					return false
				})
				http.Error(w, "expired token", http.StatusUnauthorized)
				return
			}
		}

		uid, _ := res[0]["user_id"].(string)
		ctx := context.WithValue(r.Context(), userKey, uid)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// UserIDFromRequest returns userID injected by middleware
func UserIDFromRequest(r *http.Request) (string, bool) {
	uid, ok := r.Context().Value(userKey).(string)
	return uid, ok
}
