package main

import (
	"log"
)

func main() {
	// Initialize database
	InitDatabase()

	// Create and start server
	server := NewServer()

	log.Println("Starting server on :8080")
	if err := server.Router.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
