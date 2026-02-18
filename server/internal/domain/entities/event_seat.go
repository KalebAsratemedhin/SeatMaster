package entities

import "time"

type EventSeat struct {
	ID           int64     `json:"id"`
	EventTableID int64     `json:"event_table_id"`
	Label        string    `json:"label"`
	DisplayOrder int       `json:"display_order"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
