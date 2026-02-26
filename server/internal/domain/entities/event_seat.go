package entities

import "time"

type EventSeat struct {
	ID           string    `json:"id"`
	EventTableID string    `json:"event_table_id"`
	Label        string    `json:"label"`
	DisplayOrder int       `json:"display_order"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
