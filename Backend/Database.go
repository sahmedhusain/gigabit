package main

import (
	"log"
	"social/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDatabase() {
	var err error

	// Connect to SQLite database
	DB, err = gorm.Open(sqlite.Open("social_network.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto-migrate the schema
	err = DB.AutoMigrate(
		&models.User{},
		&models.Post{},
		&models.Comment{},
		&models.Like{},
		&models.Friendship{},
	)

	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Add unique constraints
	DB.Exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_user_post ON likes(user_id, post_id)")
	DB.Exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_friendships_unique ON friendships(requester_id, addressee_id)")

	log.Println("Database connected and migrated successfully")
}
