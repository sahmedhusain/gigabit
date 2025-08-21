package mockdata

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"path/filepath"
)

// LoadMockData loads all mock data SQL files into the database
func LoadMockData(db *sql.DB) error {
	log.Println("Loading mock data...")
	
	// Define the order of loading (important for foreign key constraints)
	sqlFiles := []string{
		"users.sql",
		"follows.sql", 
		"posts.sql",
		"likes.sql",
		"comments.sql",
		"groups.sql",
		"events.sql",
		"messages.sql",
		"notifications.sql",
	}

	mockDataDir := "mockdata"
	
	for _, filename := range sqlFiles {
		filePath := filepath.Join(mockDataDir, filename)
		
		log.Printf("Loading %s...", filename)
		
		// Read the SQL file
		content, err := ioutil.ReadFile(filePath)
		if err != nil {
			return fmt.Errorf("failed to read %s: %v", filename, err)
		}

		// Execute the SQL
		if _, err := db.Exec(string(content)); err != nil {
			return fmt.Errorf("failed to execute %s: %v", filename, err)
		}
		
		log.Printf("✓ Loaded %s successfully", filename)
	}
	
	log.Println("All mock data loaded successfully!")
	return nil
}

// ClearAllData clears all data from tables (useful for testing)
func ClearAllData(db *sql.DB) error {
	log.Println("Clearing all data...")
	
	// Define tables to clear in reverse order to handle foreign keys
	tables := []string{
		"notifications",
		"messages",
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
			return fmt.Errorf("failed to clear table %s: %v", table, err)
		}
		// Reset auto-increment counter for each table
		if _, err := db.Exec(fmt.Sprintf("DELETE FROM sqlite_sequence WHERE name='%s'", table)); err != nil {
			// Ignore errors here as some tables may not have auto-increment
		}
		log.Printf("✓ Cleared table %s", table)
	}
	
	log.Println("All data cleared successfully!")
	return nil
}