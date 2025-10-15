package main

import (
	"flag"
	"log"
	"social/mockdata"
	"social/websocket"
)

func main() {
	useMockData := flag.Bool("mock", false, "Load mock data instead of using existing database")
	clearData := flag.Bool("clear", false, "Clear all existing data before loading mock data (use with -mock)")
	flag.Parse()

	// Initialize database
	InitDatabase()

	// Handle mock data loading
	if *useMockData {
		if *clearData {
			log.Println("Clearing existing data...")
			if err := mockdata.ClearAllData(DB.DB); err != nil {
				log.Fatal("Failed to clear existing data:", err)
			}
		}

		log.Println("Loading mock data...")
		if err := mockdata.LoadMockData(DB.DB); err != nil {
			log.Fatal("Failed to load mock data:", err)
		}
		log.Println("Mock data loaded successfully! 🎉")
	} else {
		log.Println("Using existing database (use -mock flag to load mock data)")
	}

	// Create websocket hub
	hub := websocket.NewHub()
	hub.SetDB(DB.GetDB())
	go hub.Run()

	// Create and start server
	server := NewServer(hub)

	log.Println("Starting server on :8080")
	if err := server.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
