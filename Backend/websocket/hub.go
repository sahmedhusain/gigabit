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
			// Check if user already has an active connection
			if existingClient, exists := h.clients[client.ID]; exists {
				// Close the old connection to prevent duplicate connections
				log.Printf("Closing existing connection for user %d", client.ID)
				// Safely close the existing client
				h.safeCloseClient(existingClient)
			}
			h.clients[client.ID] = client
			h.mu.Unlock()
			log.Printf("Client %d connected", client.ID)

			// Get user's last status from database and broadcast
			if h.db != nil {
				var status string
				err := h.db.QueryRow("SELECT status FROM users WHERE id = ?", client.ID).Scan(&status)
				if err != nil {
					log.Printf("Failed to get status for user %d: %v", client.ID, err)
					// If no status found, set default to online and update database
					status = "online"
					_, updateErr := h.db.Exec("UPDATE users SET status = 'online', last_status_change = CURRENT_TIMESTAMP WHERE id = ?", client.ID)
					if updateErr != nil {
						log.Printf("Failed to set default status for user %d: %v", client.ID, updateErr)
					}
				}

				log.Printf("User %d connected with status: %s", client.ID, status)

				// For invisible users, broadcast them as offline to others
				// but they can see others' real status
				broadcastStatus := status
				if status == "invisible" {
					broadcastStatus = "offline"
				}

				// Broadcast the status to all clients (except invisible users show as offline)
				h.BroadcastUserStatus(client.ID, broadcastStatus)
			} else {
				// Fallback if no database
				h.BroadcastUserStatus(client.ID, "online")
			}

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.ID]; ok {
				delete(h.clients, client.ID)
				h.mu.Unlock()

				// Safely close the client
				h.safeCloseClient(client)
				log.Printf("Client %d disconnected", client.ID)

				// DON'T update database to offline - preserve the user's last selected status
				// Only broadcast offline to other users so they know this user is disconnected
				// The database keeps the user's actual status (busy, away, etc.)
				h.BroadcastUserStatus(client.ID, "offline")
			} else {
				h.mu.Unlock()
			}

		case message := <-h.broadcast:
			h.handleMessage(message)
		}
	}
}

// safeCloseClient safely closes a client's send channel and connection
func (h *Hub) safeCloseClient(client *Client) {
	client.mu.Lock()
	defer client.mu.Unlock()

	// Close websocket connection first
	client.Conn.Close()

	// Only close the send channel if it's not already closed
	if !client.Closed {
		close(client.Send)
		client.Closed = true
	}
}
