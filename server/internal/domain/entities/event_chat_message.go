package entities

import "time"

type EventChatMessage struct {
	ID        string    `json:"id"`
	ThreadID  string    `json:"thread_id"`
	SenderID  string    `json:"sender_id"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"created_at"`
}
