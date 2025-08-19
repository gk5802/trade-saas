package db

import "sync"

type Collection struct {
	Name string
	data []Document
	mu   sync.RWMutex
}

func NewCollection(name string) *Collection {
	return &Collection{Name: name, data: []Document{}}
}

// Insert adds a new document
func (c *Collection) Insert(doc Document) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.data = append(c.data, doc)
	return nil
}

// Find returns all documents matching filter
func (c *Collection) Find(filter func(Document) bool) []Document {
	c.mu.RLock()
	defer c.mu.RUnlock()
	results := []Document{}
	for _, d := range c.data {
		if filter(d) {
			results = append(results, d)
		}
	}
	return results
}

// Delete removes matching documents
func (c *Collection) Delete(filter func(Document) bool) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	newData := []Document{}
	for _, d := range c.data {
		if !filter(d) {
			newData = append(newData, d)
		}
	}
	c.data = newData
	return nil
}
