package utils

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
)

// GenerateSecureToken generates a cryptographically secure random token
func GenerateSecureToken() (string, error) {
	// Generate 32 bytes (256 bits) of random data
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	// Convert to hex string (64 characters)
	return hex.EncodeToString(bytes), nil
}

// ValidateTokenFormat checks if the token has the correct format
func ValidateTokenFormat(token string) error {
	if len(token) != 64 {
		return errors.New("invalid token format")
	}

	// Verify it's valid hex
	_, err := hex.DecodeString(token)
	if err != nil {
		return errors.New("invalid token format")
	}

	return nil
}
