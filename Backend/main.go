package main

import (
	"flag"
	"log"
"gigabit/mockdata"
"gigabit/websocket"
)

func main() {
	useMockData := flag.Bool("mock", false, "Load mock data instead of using existing database")
	clearData := flag.Bool("clear", false, "Clear all existing data before loading mock data (use with -mock)")
	flag.Parse()
	InitDatabase()
	if *useMockData {
		if *clearData {
			if err := mockdata.ClearAllData(DB.DB); err != nil {
				log.Fatal("Failed to clear existing data:", err)
			}
		}
		if err := mockdata.LoadMockData(DB.DB); err != nil {
			log.Fatal("Failed to load mock data:", err)
		}
	}
	hub := websocket.NewHub()
	hub.SetDB(DB.GetDB())
	go hub.Run()
	server := NewServer(hub)
	log.Println("Starting server on :8080")
	if err := server.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
