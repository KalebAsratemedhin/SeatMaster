package ws

import (
	"encoding/json"
	"sync"
)

// Client is a WebSocket client in a chat thread.
type Client struct {
	UserID   string
	ThreadID string
	Send     chan []byte
}

// Hub holds all chat clients per thread and broadcasts messages.
type Hub struct {
	// threadID -> clients
	threads map[string]map[*Client]bool
	mu      sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		threads: make(map[string]map[*Client]bool),
	}
}

// Register adds a client to a thread.
func (h *Hub) Register(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.threads[c.ThreadID] == nil {
		h.threads[c.ThreadID] = make(map[*Client]bool)
	}
	h.threads[c.ThreadID][c] = true
}

// Unregister removes a client.
func (h *Hub) Unregister(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if m, ok := h.threads[c.ThreadID]; ok {
		delete(m, c)
		if len(m) == 0 {
			delete(h.threads, c.ThreadID)
		}
	}
	close(c.Send)
}

// BroadcastToThread sends a message to all clients in the thread.
func (h *Hub) BroadcastToThread(threadID string, message []byte) {
	h.mu.RLock()
	clients := make([]*Client, 0, len(h.threads[threadID]))
	for c := range h.threads[threadID] {
		clients = append(clients, c)
	}
	h.mu.RUnlock()
	for _, c := range clients {
		select {
		case c.Send <- message:
		default:
			// client buffer full, skip
		}
	}
}

// BroadcastChatMessage marshals a chat message and broadcasts to the thread.
func (h *Hub) BroadcastChatMessage(threadID string, msg ChatMessageWS) {
	payload, _ := json.Marshal(msg)
	h.BroadcastToThread(threadID, payload)
}

// ChatMessageWS is the WebSocket payload for a new message.
type ChatMessageWS struct {
	Type      string `json:"type"` // "message"
	ID        string `json:"id"`
	ThreadID  string `json:"thread_id"`
	SenderID  string `json:"sender_id"`
	Body      string `json:"body"`
	CreatedAt string `json:"created_at"`
}
