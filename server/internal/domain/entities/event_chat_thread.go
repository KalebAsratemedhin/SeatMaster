package entities

import "time"

type EventChatThread struct {
	ID        string    `json:"id"`
	EventID   string    `json:"event_id"`
	OwnerID   string    `json:"owner_id"`
	GuestID   string    `json:"guest_id"`
	CreatedAt time.Time `json:"created_at"`
}
