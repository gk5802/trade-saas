package auth

import "sync/atomic"

var serialCounter uint64

// NextSerial returns monotonic increasing uint64
func NextSerial() uint64 {
	return atomic.AddUint64(&serialCounter, 1)
}

// UintToString converts uint64 to string without fmt for speed
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
