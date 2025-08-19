// ======================================================
// File: backend/internal/db/db.go
// Package: db
// Purpose: Minimal in-memory document DB
// ======================================================

package db

import (
	"errors"
	"sync"
	"time"
)

// DocumentDB holds multiple collections
type DocumentDB struct {
	collections map[string]*Collection
	mu          sync.RWMutex
}

// --------------------
// Global DB instance
// --------------------
var DB *DocumentDB

func init() {
	DB = NewDocumentDB()
}

// --------------------
// Constructors
// --------------------
func NewDocumentDB() *DocumentDB {
	return &DocumentDB{
		collections: make(map[string]*Collection),
	}
}

func (db *DocumentDB) getOrCreateCollection(name string) *Collection {
	db.mu.Lock()
	defer db.mu.Unlock()

	if col, ok := db.collections[name]; ok {
		return col
	}
	col := &Collection{data: make(map[string]Document)}
	db.collections[name] = col
	return col
}

// --------------------
// CRUD
// --------------------
func (db *DocumentDB) Insert(collection string, doc Document) (string, error) {
	col := db.getOrCreateCollection(collection)
	col.mu.Lock()
	defer col.mu.Unlock()

	// Auto-generate ID
	id := time.Now().Format("20060102150405.000000000")
	doc["id"] = id
	col.data[id] = doc
	return id, nil
}

func (db *DocumentDB) Find(collection string, filter Document) ([]Document, error) {
	col := db.getOrCreateCollection(collection)
	col.mu.RLock()
	defer col.mu.RUnlock()

	var results []Document
	for _, d := range col.data {
		match := true
		for k, v := range filter {
			if d[k] != v {
				match = false
				break
			}
		}
		if match {
			results = append(results, d)
		}
	}
	return results, nil
}

func (db *DocumentDB) Delete(collection, id string) error {
	col := db.getOrCreateCollection(collection)
	col.mu.Lock()
	defer col.mu.Unlock()

	if _, ok := col.data[id]; !ok {
		return errors.New("document not found")
	}
	delete(col.data, id)
	return nil
}

// --------------------
// Auto-Delete After First Use
// --------------------
func (db *DocumentDB) ConsumeOnce(collection string, filter Document) (Document, error) {
	col := db.getOrCreateCollection(collection)
	col.mu.Lock()
	defer col.mu.Unlock()

	for id, d := range col.data {
		match := true
		for k, v := range filter {
			if d[k] != v {
				match = false
				break
			}
		}
		if match {
			delete(col.data, id) // 🔥 auto-delete after use
			return d, nil
		}
	}
	return nil, errors.New("no matching document found")
}
