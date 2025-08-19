package auth

import (
	"crypto/rand"
	"encoding/base64"
)

// RandomBytes returns secure random bytes
func RandomBytes(n int) ([]byte, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)
	return b, err
}

// RandomTokenURL returns URL-safe token (no padding)
func RandomTokenURL(n int) (string, error) {
	b, err := RandomBytes(n)
	if err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}
