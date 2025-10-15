package websocket

import (
	"database/sql"
	"log"
	"sync"
)

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	clients    map[uint]*Client
	register   chan *Client
	unregister chan *Client
	broadcast  chan Message
	db         *sql.DB
	mu         sync.RWMutex
}

// NewHub creates a new websocket hub
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[uint]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan Message),
	}
}

// SetDB sets the database connection for the hub
func (h *Hub) SetDB(db *sql.DB) {
	h.db = db
}

// Run starts the hub and handles client registration, unregistration, and message broadcasting
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.ID] = client
			h.mu.Unlock()
			log.Printf("Client %d connected", client.ID)

			// Get user's current status from database and broadcast it
			if h.db != nil {
				var status string
				err := h.db.QueryRow("SELECT status FROM users WHERE id = ?", client.ID).Scan(&status)
				if err != nil {
					log.Printf("Failed to get status for user %d: %v", client.ID, err)
					status = "online"
				}

				// If user is invisible, don't broadcast their online status
				if status != "invisible" {
					h.BroadcastUserStatus(client.ID, status)
				}
			} else {
				// Fallback if no database
				h.BroadcastUserStatus(client.ID, "online")
			}

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.ID]; ok {
				delete(h.clients, client.ID)
				close(client.Send)
				h.mu.Unlock()
				log.Printf("Client %d disconnected", client.ID)

				// Broadcast offline status when user disconnects
				h.BroadcastUserStatus(client.ID, "offline")
			} else {
				h.mu.Unlock()
			}

		case message := <-h.broadcast:
			h.handleMessage(message)
		}
	}
}
