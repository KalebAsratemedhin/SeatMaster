package entities

import "time"

type EventTable struct {
	ID           int64     `json:"id"`
	EventID      int64     `json:"event_id"`
	Name         string    `json:"name"`   // Auto-set to "Table 1", "Table 2", etc.
	Shape        string    `json:"shape"`  // "round", "rectangular", or "grid"
	TableRows    *int      `json:"table_rows,omitempty"`    // for grid
	TableColumns *int      `json:"table_columns,omitempty"` // for grid
	Capacity     int       `json:"capacity"`
	DisplayOrder int       `json:"display_order"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
