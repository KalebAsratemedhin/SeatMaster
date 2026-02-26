package entities

import "time"

type EventComment struct {
	ID        string    `json:"id"`
	EventID   string    `json:"event_id"`
	ParentID  *string   `json:"parent_id,omitempty"`
	UserID    string    `json:"user_id"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"created_at"`
}
