// =======================================================
// File 6.1: cmd/server/main.go
// Purpose: Entry point for Go backend server
// =======================================================

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"backend/internal/auth"
	"backend/internal/db"
)

func main() {
	// ---------------------------
	// 1. Init DB + tokens storage
	// ---------------------------
	appDB := db.NewDatabase("appdb")
	tokensColl, err := appDB.CreateCollection("tokens")
	if err != nil {
		log.Fatalf("failed to create tokens collection: %v", err)
	}

	// ---------------------------
	// 2. Middleware
	// ---------------------------
	authMiddleware := auth.NewAuthMiddleware(tokensColl)

	// ---------------------------
	// 3. Public route: login
	// ---------------------------
	http.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		// for demo: always issue a token+serial
		token := "demo-token-ABC123"
		serial := uint64(1)

		// store in DB
		err := tokensColl.Insert(strconv.FormatUint(serial, 10), db.Document{
			"token": token,
		})
		if err != nil {
			http.Error(w, "could not store token", http.StatusInternalServerError)
			return
		}

		// return to client
		json.NewEncoder(w).Encode(map[string]interface{}{
			"token":  token,
			"serial": serial,
		})
	})

	// ---------------------------
	// 4. Protected route
	// ---------------------------
	http.Handle("/secure", authMiddleware.Protect(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "🎉 Secure data: you are authenticated!")
	})))

	// ---------------------------
	// 5. Start server
	// ---------------------------
	fmt.Println("🚀 Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))

	http.HandleFunc("/testdb", func(w http.ResponseWriter, r *http.Request) {
		// Insert
		id, _ := db.DB.Insert("tokens", db.Document{"token": "abc", "serial": 1})
		fmt.Fprintf(w, "Inserted ID: %s\n", id)

		// Find
		docs, _ := db.DB.Find("tokens", db.Document{"serial": 1})
		fmt.Fprintf(w, "Found docs: %+v\n", docs)

		// Delete
		_ = db.DB.Delete("tokens", id)
		fmt.Fprintf(w, "Deleted ID: %s\n", id)
	})
}
