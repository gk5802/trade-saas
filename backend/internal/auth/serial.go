// ======================================================
// File 8.2: backend/internal/auth/serial.go
// Purpose: atomic serial generator for verification flows
// ======================================================
package auth

import (
	"sync/atomic"
)

var serialCounter uint64

// NextSerial returns monotonically increasing uint64
func NextSerial() uint64 {
	return atomic.AddUint64(&serialCounter, 1)
}

// UintToString with minimal allocation
func UintToString(u uint64) string {
	if u == 0 {
		return "0"
	}
	var buf [20]byte
	i := len(buf)
	for u > 0 {
		i--
		buf[i] = byte('0' + u%10)
		u /= 10
	}
	return string(buf[i:])
}
