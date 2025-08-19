// =======================================================
// File 7.2: internal/db/collection.go
// Purpose: Collection logic (insert, find, delete)
// =======================================================

package db

import (
	"errors"
	"sync"
)

type Collection struct {
	name string
	data map[string]Document
	mu   sync.RWMutex
}

// NewCollection creates an empty collection
func NewCollection(name string) *Collection {
	return &Collection{
		name: name,
		data: make(map[string]Document),
	}
}

// Insert document with an ID
func (c *Collection) Insert(id string, doc Document) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if _, exists := c.data[id]; exists {
		return errors.New("document already exists")
	}
	c.data[id] = doc
	return nil
}

// Find a document by ID
func (c *Collection) Find(id string) (Document, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	doc, ok := c.data[id]
	return doc, ok
}

// Delete a document by ID
func (c *Collection) Delete(id string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.data, id)
}
