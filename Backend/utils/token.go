package utils

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
)

func GenerateSecureToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	// Convert to hex
	return hex.EncodeToString(bytes), nil
}

// ValidateTokenFormat checks if the token has the correct format
func ValidateTokenFormat(token string) error {
	if len(token) != 64 {
		return errors.New("invalid token format")
	}

	_, err := hex.DecodeString(token)
	if err != nil {
		return errors.New("invalid token format")
	}

	return nil
}
