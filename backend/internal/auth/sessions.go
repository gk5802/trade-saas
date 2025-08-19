package auth

import (
	"errors"
	"time"

	"backend/internal/db"
)

type Session struct {
	ID         string
	UserID     string
	Access     string
	AccessExp  time.Time
	Refresh    string
	RefreshExp time.Time
	CreatedAt  time.Time
}

func SaveSession(database *db.Database, s *Session) error {
	coll := database.CreateCollection("sessions")
	return coll.Insert(db.Document{
		"id":          s.ID,
		"user_id":     s.UserID,
		"access":      s.Access,
		"access_exp":  s.AccessExp.Unix(),
		"refresh":     s.Refresh,
		"refresh_exp": s.RefreshExp.Unix(),
		"created_at":  s.CreatedAt.Unix(),
	})
}

func FindSessionByRefresh(database *db.Database, refresh string) (*Session, error) {
	coll, err := database.GetCollection("sessions")
	if err != nil {
		return nil, err
	}
	results := coll.Find(func(d db.Document) bool {
		val, ok := d["refresh"].(string)
		return ok && val == refresh
	})
	if len(results) == 0 {
		return nil, errors.New("not found")
	}
	doc := results[0]
	return &Session{
		ID:         doc["id"].(string),
		UserID:     doc["user_id"].(string),
		Access:     doc["access"].(string),
		AccessExp:  time.Unix(doc["access_exp"].(int64), 0),
		Refresh:    doc["refresh"].(string),
		RefreshExp: time.Unix(doc["refresh_exp"].(int64), 0),
		CreatedAt:  time.Unix(doc["created_at"].(int64), 0),
	}, nil
}

func DeleteSession(database *db.Database, sessionID string) error {
	coll, err := database.GetCollection("sessions")
	if err != nil {
		return err
	}
	return coll.Delete(func(d db.Document) bool {
		val, ok := d["id"].(string)
		return ok && val == sessionID
	})
}
