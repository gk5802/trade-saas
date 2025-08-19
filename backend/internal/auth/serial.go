// =======================================================
// File 8.2: internal/auth/serial.go
// Purpose: Serial number generator (incremental counter)
// =======================================================

package auth

import (
	"sync/atomic"
)

var serialCounter uint64 = 0

// GenerateSerial returns a unique serial number
func GenerateSerial() uint64 {
	return atomic.AddUint64(&serialCounter, 1)
}

// GenerateTokenWithSerial combines token + serial
func GenerateTokenWithSerial() (string, uint64) {
	token, _ := GenerateToken(32) // 32 bytes = strong token
	serial := GenerateSerial()
	return token, serial
}
