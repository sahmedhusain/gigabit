package mockdata

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
)

// LoadMockData loads all mock data SQL files into the database
func LoadMockData(db *sql.DB) error {
	log.Println("Loading mock data...")

	// Clear existing data first
	if err := ClearAllData(db); err != nil {
		return fmt.Errorf("failed to clear existing data: %v", err)
	}

	// Disable foreign key constraints during loading
	if _, err := db.Exec("PRAGMA foreign_keys = OFF"); err != nil {
		log.Printf("Warning: Could not disable foreign keys: %v", err)
	}

	// Define the order of loading (important for foreign key constraints)
	sqlFiles := []string{
		"users.sql",
		"follows.sql",
		"groups.sql",
		"group_members.sql",
		"group_conversations.sql",
		"private_conversations.sql",
		"private_messages.sql",
		"posts.sql",
		"group_posts.sql", // Added group posts
		"likes.sql",
		// "comments.sql", // Temporarily disabled due to syntax errors
		"events.sql",
		"event_responses.sql",
		"messages.sql",
		"notifications.sql",
	}

	mockDataDir := "mockdata"

	for _, filename := range sqlFiles {
		filePath := filepath.Join(mockDataDir, filename)

		log.Printf("Loading %s...", filename)

		// Read the SQL file
		content, err := os.ReadFile(filePath)
		if err != nil {
			return fmt.Errorf("failed to read %s: %v", filename, err)
		}

		// Execute the SQL
		if _, err := db.Exec(string(content)); err != nil {
			return fmt.Errorf("failed to execute %s: %v", filename, err)
		}

		log.Printf("✓ Loaded %s successfully", filename)
	}

	// Re-enable foreign key constraints
	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		log.Printf("Warning: Could not re-enable foreign keys: %v", err)
	}

	log.Println("All mock data loaded successfully!")
	return nil
}

// ClearAllData clears all data from tables (useful for testing)
func ClearAllData(db *sql.DB) error {
	log.Println("Clearing all data...")

	// Disable foreign key constraints during clearing
	if _, err := db.Exec("PRAGMA foreign_keys = OFF"); err != nil {
		log.Printf("Warning: Could not disable foreign keys: %v", err)
	}

	// Define tables to clear in reverse order to handle foreign keys
	tables := []string{
		"notifications",
		"group_messages",
		"private_messages",
		"group_conversations",
		"private_conversations",
		"event_responses",
		"events",
		"group_members",
		"groups",
		"comments",
		"likes",
		"posts",
		"follows",
		"sessions",
		"users",
	}

	for _, table := range tables {
		if _, err := db.Exec(fmt.Sprintf("DELETE FROM %s", table)); err != nil {
			// Ignore "no such table" errors since some tables may not exist yet
			if !strings.Contains(err.Error(), "no such table") {
				return fmt.Errorf("failed to clear table %s: %v", table, err)
			}
		}
		// Reset auto-increment counter for each table
		if _, err := db.Exec(fmt.Sprintf("DELETE FROM sqlite_sequence WHERE name='%s'", table)); err != nil {
			// Ignore errors here as some tables may not have auto-increment or may not exist
		}
		log.Printf("✓ Cleared table %s", table)
	}

	// Re-enable foreign key constraints
	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		log.Printf("Warning: Could not re-enable foreign keys: %v", err)
	}

	log.Println("All data cleared successfully!")
	return nil
}
