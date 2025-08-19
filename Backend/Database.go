package main

import (
	"log"
	customsqlite "social/pkg/db/sqlite"
)

var DB *customsqlite.DB

func InitDatabase() {
	var err error

	// Initialize database with migrations
	DB, err = customsqlite.NewDB("social_network.db")
	if err != nil {
		log.Fatal("Failed to initialize database with migrations:", err)
	}

	log.Println("Database initialized successfully with migrations")
}
