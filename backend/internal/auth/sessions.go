package auth

import (
	"errors"
	"time"

	"backend/internal/db"
)

// Session structure returned to clients
type Session struct {
	ID         string `json:"id"`
	UserID     string `json:"user_id"`
	Access     string `json:"access"`
	AccessExp  int64  `json:"access_exp"`
	Refresh    string `json:"refresh"`
	RefreshExp int64  `json:"refresh_exp"`
	Family     string `json:"family"`
	Created    int64  `json:"created"`
}

// CreateUser: simple user creation (demo). Replace password with hashed password in prod.
func CreateUser(email, password string) (string, error) {
	c := db.DefaultDB.CreateCollection("users")
	id := "u-" + UintToString(NextSerial())
	doc := db.Document{
		"id":       id,
		"email":    email,
		"password": password,
		"verified": false,
		"created":  time.Now().Unix(),
	}
	if err := c.Insert(doc); err != nil {
		return "", err
	}
	return id, nil
}

// GetUserByEmail returns first matching user document
func GetUserByEmail(email string) (db.Document, bool) {
	c := db.DefaultDB.CreateCollection("users")
	found := c.Find(func(d db.Document) bool {
		if v, ok := d["email"].(string); ok {
			return v == email
		}
		return false
	})
	if len(found) == 0 {
		return nil, false
	}
	return found[0], true
}

// MarkUserVerified marks a user as verified (naive: delete+insert)
func MarkUserVerified(userID string) error {
	c := db.DefaultDB.CreateCollection("users")
	results := c.Find(func(d db.Document) bool {
		if v, ok := d["id"].(string); ok {
			return v == userID
		}
		return false
	})
	if len(results) == 0 {
		return errors.New("user not found")
	}
	// delete old and insert updated
	_ = c.Delete(func(d db.Document) bool {
		if v, ok := d["id"].(string); ok {
			return v == userID
		}
		return false
	})
	doc := results[0]
	doc["verified"] = true
	return c.Insert(doc)
}

// CreateVerification inserts a one-time verify token into tokens collection
func CreateVerification(userID string) (string, string, error) {
	serial := "v-" + UintToString(NextSerial())
	token, err := RandomTokenURL(32)
	if err != nil {
		return "", "", err
	}
	c := db.DefaultDB.CreateCollection("tokens")
	doc := db.Document{
		"type":    "verify",
		"serial":  serial,
		"token":   token,
		"user_id": userID,
		"created": time.Now().Unix(),
		"ttl":     int64(3600),
	}
	if err := c.Insert(doc); err != nil {
		return "", "", err
	}
	return serial, token, nil
}

// ConsumeVerification consumes (deletes) a verify token and returns user_id
func ConsumeVerification(serial, token string) (string, error) {
	c := db.DefaultDB.CreateCollection("tokens")
	found := c.Find(func(d db.Document) bool {
		if d["type"] != "verify" {
			return false
		}
		if s, ok := d["serial"].(string); !ok || s != serial {
			return false
		}
		if t, ok := d["token"].(string); !ok || t != token {
			return false
		}
		return true
	})
	if len(found) == 0 {
		return "", errors.New("invalid or already used verification token")
	}
	// delete it (one-time)
	_ = c.Delete(func(d db.Document) bool {
		if d["type"] != "verify" {
			return false
		}
		s, ok1 := d["serial"].(string)
		t, ok2 := d["token"].(string)
		return ok1 && ok2 && s == serial && t == token
	})
	uid, _ := found[0]["user_id"].(string)
	return uid, nil
}

// IssueSession issues access + refresh tokens (saved in sessions collection)
func IssueSession(userID string, remember bool) (Session, error) {
	access, err := RandomTokenURL(24)
	if err != nil {
		return Session{}, err
	}
	refresh, err := RandomTokenURL(32)
	if err != nil {
		return Session{}, err
	}
	family, err := RandomTokenURL(12)
	if err != nil {
		return Session{}, err
	}
	now := time.Now().Unix()
	accessTTL := int64(15 * 60)         // 15 minutes
	refreshTTL := int64(30 * 24 * 3600) // 30 days
	if !remember {
		refreshTTL = int64(7 * 24 * 3600) // 7 days for non-remember
	}
	doc := db.Document{
		"id":          "s-" + UintToString(NextSerial()),
		"user_id":     userID,
		"access":      access,
		"access_exp":  now + accessTTL,
		"refresh":     refresh,
		"refresh_exp": now + refreshTTL,
		"family":      family,
		"created":     now,
	}
	c := db.DefaultDB.CreateCollection("sessions")
	if err := c.Insert(doc); err != nil {
		return Session{}, err
	}
	return Session{
		ID:         doc["id"].(string),
		UserID:     userID,
		Access:     access,
		AccessExp:  now + accessTTL,
		Refresh:    refresh,
		RefreshExp: now + refreshTTL,
		Family:     family,
		Created:    now,
	}, nil
}

// ValidateAccess returns the userID for a valid access token
func ValidateAccess(access string) (string, error) {
	c := db.DefaultDB.CreateCollection("sessions")
	found := c.Find(func(d db.Document) bool {
		if a, ok := d["access"].(string); ok {
			return a == access
		}
		return false
	})
	if len(found) == 0 {
		return "", errors.New("invalid access token")
	}
	exp, ok := toInt64(found[0]["access_exp"])
	if !ok {
		return "", errors.New("invalid token expiry")
	}
	if time.Now().Unix() > exp {
		// delete expired
		_ = c.Delete(func(d db.Document) bool {
			if a, ok := d["access"].(string); ok {
				return a == access
			}
			return false
		})
		return "", errors.New("access token expired")
	}
	uid, _ := found[0]["user_id"].(string)
	return uid, nil
}

// RefreshSession consumes an existing refresh and issues new session (rotate)
func RefreshSession(oldRefresh string) (Session, error) {
	c := db.DefaultDB.CreateCollection("sessions")
	found := c.Find(func(d db.Document) bool {
		if r, ok := d["refresh"].(string); ok {
			return r == oldRefresh
		}
		return false
	})
	if len(found) == 0 {
		return Session{}, errors.New("invalid or used refresh token")
	}
	// check expiry
	exp, ok := toInt64(found[0]["refresh_exp"])
	if !ok || time.Now().Unix() > exp {
		// delete if expired
		_ = c.Delete(func(d db.Document) bool {
			if r, ok := d["refresh"].(string); ok {
				return r == oldRefresh
			}
			return false
		})
		return Session{}, errors.New("refresh token expired")
	}
	// consume (delete) old refresh/session
	_ = c.Delete(func(d db.Document) bool {
		if r, ok := d["refresh"].(string); ok {
			return r == oldRefresh
		}
		return false
	})

	uid, _ := found[0]["user_id"].(string)
	family, _ := found[0]["family"].(string)

	// issue new tokens (same family)
	access, _ := RandomTokenURL(24)
	refresh, _ := RandomTokenURL(32)
	now := time.Now().Unix()
	accessTTL := int64(15 * 60)
	refreshTTL := int64(30 * 24 * 3600)

	newDoc := db.Document{
		"id":          "s-" + UintToString(NextSerial()),
		"user_id":     uid,
		"access":      access,
		"access_exp":  now + accessTTL,
		"refresh":     refresh,
		"refresh_exp": now + refreshTTL,
		"family":      family,
		"created":     now,
	}
	if err := c.Insert(newDoc); err != nil {
		return Session{}, err
	}
	return Session{
		ID:         newDoc["id"].(string),
		UserID:     uid,
		Access:     access,
		AccessExp:  now + accessTTL,
		Refresh:    refresh,
		RefreshExp: now + refreshTTL,
		Family:     family,
		Created:    now,
	}, nil
}

// helpers
func toInt64(v interface{}) (int64, bool) {
	switch t := v.(type) {
	case int64:
		return t, true
	case int:
		return int64(t), true
	case float64:
		return int64(t), true
	case float32:
		return int64(t), true
	}
	return 0, false
}
