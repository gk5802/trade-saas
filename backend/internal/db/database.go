package db

import (
	"errors"
	"sync"
)

type Database struct {
	collections map[string]*Collection
	mu          sync.RWMutex
}

func NewDatabase() *Database {
	return &Database{collections: make(map[string]*Collection)}
}

func (db *Database) CreateCollection(name string) *Collection {
	db.mu.Lock()
	defer db.mu.Unlock()
	if coll, ok := db.collections[name]; ok {
		return coll
	}
	coll := NewCollection(name)
	db.collections[name] = coll
	return coll
}

func (db *Database) GetCollection(name string) (*Collection, error) {
	db.mu.RLock()
	defer db.mu.RUnlock()
	coll, ok := db.collections[name]
	if !ok {
		return nil, errors.New("collection not found")
	}
	return coll, nil
}
