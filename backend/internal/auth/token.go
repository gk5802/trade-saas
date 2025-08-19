// ======================================================
// File 8.1: backend/internal/auth/token.go
// Purpose: secure random token helpers (URL-safe)
// ======================================================
package auth

import (
	"crypto/rand"
	"encoding/base64"
)

func RandomBytes(n int) ([]byte, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)
	return b, err
}

func RandomTokenURL(n int) (string, error) {
	b, err := RandomBytes(n)
	if err != nil {
		return "", err
	}
	// URL-safe, no padding
	return base64.RawURLEncoding.EncodeToString(b), nil
}
