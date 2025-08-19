package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"backend/internal/auth"
	"backend/internal/db"
)

func main() {
	// Ensure default DB created (database.DefaultDB is inited by package)
	_ = db.DefaultDB

	// public health
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "OK")
	})

	// register: create user, return verification serial+token (dev-only)
	http.HandleFunc("/register", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "use POST", http.StatusMethodNotAllowed)
			return
		}
		var body struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "bad json", http.StatusBadRequest)
			return
		}
		// simple duplicate check
		if _, ok := auth.GetUserByEmail(body.Email); ok {
			http.Error(w, "email already registered", http.StatusConflict)
			return
		}
		uid, err := auth.CreateUser(body.Email, body.Password)
		if err != nil {
			http.Error(w, "create user failed", http.StatusInternalServerError)
			return
		}
		serial, token, err := auth.CreateVerification(uid)
		if err != nil {
			http.Error(w, "issue verification failed", http.StatusInternalServerError)
			return
		}
		// In development we return token+serial. In prod, send via email and do NOT echo token.
		json.NewEncoder(w).Encode(map[string]interface{}{
			"user_id": uid,
			"verify":  map[string]string{"serial": serial, "token": token},
			"note":    "In production: email the link (do not return token in body).",
			"link":    fmt.Sprintf("%s/verify?serial=%s&token=%s", env("APP_URL", "http://localhost:3000"), serial, token),
		})
	})

	// verify: consume token, mark verified, auto-issue session
	http.HandleFunc("/verify", func(w http.ResponseWriter, r *http.Request) {
		serial := r.URL.Query().Get("serial")
		token := r.URL.Query().Get("token")
		if serial == "" || token == "" {
			http.Error(w, "missing params", http.StatusBadRequest)
			return
		}
		uid, err := auth.ConsumeVerification(serial, token)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}
		if err := auth.MarkUserVerified(uid); err != nil {
			http.Error(w, "could not mark verified", http.StatusInternalServerError)
			return
		}
		// issue session (auto-login)
		sess, err := auth.IssueSession(uid, true)
		if err != nil {
			http.Error(w, "issue session failed", http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(sess)
	})

	// login: verified users only
	http.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "use POST", http.StatusMethodNotAllowed)
			return
		}
		var body struct {
			Email    string `json:"email"`
			Password string `json:"password"`
			Remember bool   `json:"remember"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "bad json", http.StatusBadRequest)
			return
		}
		u, ok := auth.GetUserByEmail(body.Email)
		if !ok || u["password"] != body.Password {
			http.Error(w, "invalid credentials", http.StatusUnauthorized)
			return
		}
		if v, _ := u["verified"].(bool); !v {
			http.Error(w, "account not verified", http.StatusForbidden)
			return
		}
		uid, _ := u["id"].(string)
		sess, err := auth.IssueSession(uid, body.Remember)
		if err != nil {
			http.Error(w, "issue session failed", http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(sess)
	})

	// refresh: rotate refresh token
	http.HandleFunc("/session/refresh", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "use POST", http.StatusMethodNotAllowed)
			return
		}
		var body struct {
			Refresh string `json:"refresh"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "bad json", http.StatusBadRequest)
			return
		}
		sess, err := auth.RefreshSession(body.Refresh)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}
		json.NewEncoder(w).Encode(sess)
	})

	// protected route: /me
	http.Handle("/me", auth.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if uid, ok := auth.UserIDFromRequest(r); ok {
			json.NewEncoder(w).Encode(map[string]string{"user_id": uid})
			return
		}
		http.Error(w, "no user", http.StatusUnauthorized)
	})))

	port := env("PORT", "8080")
	fmt.Printf("🚀 backend running at :%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
