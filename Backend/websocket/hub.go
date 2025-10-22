package websocket

import (
	"database/sql"
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

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[uint]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan Message),
	}
}

func (h *Hub) SetDB(db *sql.DB) {
	h.db = db
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if existingClient, exists := h.clients[client.ID]; exists {
				h.safeCloseClient(existingClient)
			}
			h.clients[client.ID] = client
			h.mu.Unlock()
			if h.db != nil {
				var status string
				err := h.db.QueryRow("SELECT status FROM users WHERE id = ?", client.ID).Scan(&status)
				if err != nil {
					status = "online"
					_, _ = h.db.Exec("UPDATE users SET status = 'online', last_status_change = CURRENT_TIMESTAMP WHERE id = ?", client.ID)
				}
				broadcastStatus := status
				if status == "invisible" {
					broadcastStatus = "offline"
				}
				h.BroadcastUserStatus(client.ID, broadcastStatus)
			} else {
				h.BroadcastUserStatus(client.ID, "online")
			}
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.ID]; ok {
				delete(h.clients, client.ID)
				h.mu.Unlock()
				h.safeCloseClient(client)
				h.BroadcastUserStatus(client.ID, "offline")
			} else {
				h.mu.Unlock()
			}
		case message := <-h.broadcast:
			h.handleMessage(message)
		}
	}
}

func (h *Hub) safeCloseClient(client *Client) {
	client.mu.Lock()
	defer client.mu.Unlock()
	client.Conn.Close()
	if !client.Closed {
		close(client.Send)
		client.Closed = true
	}
}
