package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"backend/internal/auth"
	"backend/internal/db"
	"github.com/google/uuid"
)

var database *db.Database

func main() {
	database = db.NewDatabase()

	http.HandleFunc("/create-session", handleCreateSession)
	http.HandleFunc("/get-session", handleGetSession)
	http.HandleFunc("/delete-session", handleDeleteSession)

	fmt.Println("Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handleCreateSession(w http.ResponseWriter, r *http.Request) {
	session := &auth.Session{
		ID:         uuid.NewString(),
		UserID:     "user123",
		Access:     "access-token",
		AccessExp:  time.Now().Add(15 * time.Minute),
		Refresh:    "refresh-token",
		RefreshExp: time.Now().Add(24 * time.Hour),
		CreatedAt:  time.Now(),
	}

	if err := auth.SaveSession(database, session); err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	json.NewEncoder(w).Encode(session)
}

func handleGetSession(w http.ResponseWriter, r *http.Request) {
	refresh := r.URL.Query().Get("refresh")
	session, err := auth.FindSessionByRefresh(database, refresh)
	if err != nil {
		http.Error(w, err.Error(), 404)
		return
	}
	json.NewEncoder(w).Encode(session)
}

func handleDeleteSession(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if err := auth.DeleteSession(database, id); err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Write([]byte("deleted"))
}
