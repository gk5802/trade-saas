package db

import (
	"errors"
	"sync"
)

type Database struct {
	mu          sync.RWMutex
	collections map[string]*Collection
}

// DefaultDB is a convenient global for quick usage.
// In a production refactor you can create instances and pass them.
var DefaultDB *Database

func init() {
	DefaultDB = NewDatabase()
}

func NewDatabase() *Database {
	return &Database{
		collections: make(map[string]*Collection),
	}
}

// CreateCollection creates (or returns existing) collection
func (d *Database) CreateCollection(name string) *Collection {
	d.mu.Lock()
	defer d.mu.Unlock()
	if c, ok := d.collections[name]; ok {
		return c
	}
	c := NewCollection(name)
	d.collections[name] = c
	return c
}

// GetCollection returns collection (error if not exists)
func (d *Database) GetCollection(name string) (*Collection, error) {
	d.mu.RLock()
	c, ok := d.collections[name]
	d.mu.RUnlock()
	if !ok {
		return nil, errors.New("collection not found")
	}
	return c, nil
}
