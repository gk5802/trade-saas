// =======================================================
// File 8.1: internal/auth/token.go
// Purpose: Token generator
// =======================================================

package auth

import (
	"crypto/rand"
	"encoding/base64"
)

// GenerateToken generates a secure random token
func GenerateToken(length int) (string, error) {
	bytes := make([]byte, length)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(bytes), nil
}
