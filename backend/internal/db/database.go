// =======================================================
// File 7.3: internal/db/database.go
// Purpose: Database with multiple collections
// =======================================================

package db

import (
	"errors"
	"sync"
)

type Database struct {
	name        string
	collections map[string]*Collection
	mu          sync.RWMutex
}

// NewDatabase creates a new DB instance
func NewDatabase(name string) *Database {
	return &Database{
		name:        name,
		collections: make(map[string]*Collection),
	}
}


// CreateCollection registers a new collection
func (db *Database) CreateCollection(name string) (*Collection, error) {
	db.mu.Lock()
	defer db.mu.Unlock()

	if _, exists := db.collections[name]; exists {
		return nil, errors.New("collection already exists")
	}

	coll := NewCollection(name)
	db.collections[name] = coll
	return coll, nil
}


// GetCollection retrieves a collection by name
func (db *Database) GetCollection(name string) (*Collection, bool) {
	db.mu.RLock()
	defer db.mu.RUnlock()

	coll, ok := db.collections[name]
	return coll, ok
}
