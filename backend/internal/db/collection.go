package db

import "sync"

// Collection is a tiny in-memory collection
type Collection struct {
	Name string
	data []Document
	mu   sync.RWMutex
}

func NewCollection(name string) *Collection {
	return &Collection{
		Name: name,
		data: []Document{},
	}
}

// Insert appends a document to the collection
func (c *Collection) Insert(doc Document) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.data = append(c.data, doc)
	return nil
}

// Find returns all docs where filter(doc) == true
func (c *Collection) Find(filter func(Document) bool) []Document {
	c.mu.RLock()
	defer c.mu.RUnlock()
	res := []Document{}
	for _, d := range c.data {
		if filter(d) {
			res = append(res, d)
		}
	}
	return res
}

// Delete removes documents where filter(doc) == true
func (c *Collection) Delete(filter func(Document) bool) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	newData := make([]Document, 0, len(c.data))
	for _, d := range c.data {
		if !filter(d) {
			newData = append(newData, d)
		}
	}
	c.data = newData
	return nil
}
