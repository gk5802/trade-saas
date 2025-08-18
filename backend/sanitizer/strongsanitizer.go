// =======================================================
// File: backend/sanitizer/strongsanitizer.go
// Purpose: Strong sanitizers & validators in Go (S-7.x)
// Mirrors frontend/src/lib/sanitizer/strongSanitizer.ts
// =======================================================

package sanitizer

import (
	"net"
	"net/mail"
	"net/url"
	"regexp"
	"strings"
	"unicode"
)

// ============================
// S-7.1: BaseSanitize
// - normalize (simple), trim, remove control chars
// ============================
func BaseSanitize(input string) string {
	// strip control chars
	out := strings.Map(func(r rune) rune {
		if unicode.IsControl(r) && r != '\n' && r != '\t' {
			return -1
		}
		return r
	}, input)
	return strings.TrimSpace(out)
}

// ============================
// S-7.2: Email
// ============================
func SanitizeEmail(input string) string {
	s := BaseSanitize(input)
	s = strings.ToLower(strings.ReplaceAll(s, " ", ""))
	return s
}

func ValidateEmail(input string) (string, []string) {
	s := SanitizeEmail(input)
	errors := []string{}
	_, err := mail.ParseAddress(s)
	if err != nil {
		errors = append(errors, "Invalid email address")
	}
	return s, errors
}

// ============================
// S-7.3: Username
// ============================
var usernameRegex = regexp.MustCompile(`^[A-Za-z0-9_.-]+$`)

func SanitizeUsername(input string) string {
	s := BaseSanitize(input)
	s = strings.ReplaceAll(s, " ", "_")
	// strip disallowed chars
	safe := strings.Map(func(r rune) rune {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || strings.ContainsRune("_.-", r) {
			return r
		}
		return -1
	}, s)
	return safe
}

func ValidateUsername(input string, minLen, maxLen int) (string, []string) {
	s := SanitizeUsername(input)
	errors := []string{}
	if len(s) < minLen {
		errors = append(errors, "Username too short")
	}
	if len(s) > maxLen {
		errors = append(errors, "Username too long")
	}
	if !usernameRegex.MatchString(s) {
		errors = append(errors, "Invalid characters in username")
	}
	return s, errors
}

// ============================
// S-7.4: Password (light sanitize only)
// ============================
func SanitizePassword(input string) string {
	return BaseSanitize(input) // do not lower-case/trim aggressively
}

func ValidatePassword(input string, minLen int, requireStrong bool) (string, []string) {
	s := SanitizePassword(input)
	errors := []string{}
	if len(s) < minLen {
		errors = append(errors, "Password too short")
	}
	if requireStrong {
		if !regexp.MustCompile(`[a-z]`).MatchString(s) {
			errors = append(errors, "Missing lowercase")
		}
		if !regexp.MustCompile(`[A-Z]`).MatchString(s) {
			errors = append(errors, "Missing uppercase")
		}
		if !regexp.MustCompile(`[0-9]`).MatchString(s) {
			errors = append(errors, "Missing digit")
		}
		if !regexp.MustCompile(`[!@#\$%\^\&*\)\(+=._-]`).MatchString(s) {
			errors = append(errors, "Missing special char")
		}
	}
	return s, errors
}

// ============================
// S-7.5: IP
// ============================
func ValidateIP(input string) (string, []string) {
	s := BaseSanitize(input)
	errors := []string{}
	if net.ParseIP(s) == nil {
		errors = append(errors, "Invalid IP")
	}
	return s, errors
}

// ============================
// S-7.6: URL
// ============================
func SanitizeURL(input string) string {
	return BaseSanitize(input)
}

func ValidateURL(input string, allowedSchemes []string) (string, []string) {
	s := SanitizeURL(input)
	errors := []string{}
	u, err := url.Parse(s)
	if err != nil {
		errors = append(errors, "Invalid URL")
		return s, errors
	}
	allowed := false
	for _, scheme := range allowedSchemes {
		if u.Scheme == scheme {
			allowed = true
			break
		}
	}
	if !allowed {
		errors = append(errors, "URL scheme not allowed")
	}
	return s, errors
}
