package dto

type CreateEventRequest struct {
	Name  string `json:"name"`
	BannerURL  string `json:"banner_url"`
	Visibility  string `json:"visibility"`
	EventType  string `json:"event_type"`
	Message  string `json:"message"`
	EventDate  string `json:"event_date"`
	StartTime  string `json:"start_time"`
	EndTime  string `json:"end_time"`
	Location  string `json:"location"`
	Latitude  float64 `json:"latitude"`
	Longitude  float64 `json:"longitude"`
}
type UpdateEventRequest struct {
	ID        int64  `json:"id"`
	Name  string `json:"name"`
	BannerURL  string `json:"banner_url"`
	Visibility  string `json:"visibility"`
	EventType  string `json:"event_type"`
	Message  string `json:"message"`
	EventDate  string `json:"event_date"`
	StartTime  string `json:"start_time"`
	EndTime  string `json:"end_time"`
	Location  string `json:"location"`
	Latitude  float64 `json:"latitude"`
	Longitude  float64 `json:"longitude"`
}

type EventResponse struct {
	ID        int64  `json:"id"`
	OwnerID   int64  `json:"owner_id"`
	Name  string `json:"name"`
	BannerURL  string `json:"banner_url"`
	Visibility  string `json:"visibility"`
	EventType  string `json:"event_type"`
	Message  string `json:"message"`
	EventDate  string `json:"event_date"`
	StartTime  string `json:"start_time"`
	EndTime  string `json:"end_time"`
	Location  string `json:"location"`
	Latitude  float64 `json:"latitude"`
	Longitude  float64 `json:"longitude"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

// InviteEventRequest is the body for inviting a user to an event by email.
type InviteEventRequest struct {
	Email string `json:"email"`
}

// EventInviteResponse is returned when listing invites for an event.
type EventInviteResponse struct {
	ID        int64  `json:"id"`
	EventID   int64  `json:"event_id"`
	UserID    int64  `json:"user_id"`
	Email     string `json:"email"`
	Status    string `json:"status"`
	SeatID    *int64 `json:"seat_id,omitempty"`
	CreatedAt string `json:"created_at"`
}

// InvitationWithEventResponse is returned when a guest lists their invitations (event + invite status).
type InvitationWithEventResponse struct {
	Event  EventResponse       `json:"event"`
	Invite EventInviteResponse `json:"invite"`
}

// RespondToInviteRequest is the body for a guest to update their RSVP status.
type RespondToInviteRequest struct {
	Status string `json:"status"` // "confirmed" or "declined"
	SeatID *int64 `json:"seat_id,omitempty"` // optional: seat to assign when confirming
}

// PaginatedEventsResponse is used for GET /events with limit/offset.
type PaginatedEventsResponse struct {
	Items []*EventResponse `json:"items"`
	Total int64            `json:"total"`
}

// PaginatedInvitationsResponse is used for GET /invitations with limit/offset.
type PaginatedInvitationsResponse struct {
	Items []*InvitationWithEventResponse `json:"items"`
	Total int64                          `json:"total"`
}

// PaginatedInvitesResponse is used for GET /events/:id/invites with limit/offset.
type PaginatedInvitesResponse struct {
	Items []*EventInviteResponse `json:"items"`
	Total int64                  `json:"total"`
}

// EventTableResponse is a table in the seating chart.
type EventTableResponse struct {
	ID           int64                `json:"id"`
	EventID      int64                `json:"event_id"`
	Name         string               `json:"name"`
	Shape        string               `json:"shape"` // "round", "rectangular", or "grid"
	Rows         *int                 `json:"rows,omitempty"`    // for grid
	Columns      *int                 `json:"columns,omitempty"` // for grid
	Capacity     int                  `json:"capacity"`
	DisplayOrder int                  `json:"display_order"`
	Seats        []*EventSeatResponse `json:"seats"`
}

// EventSeatResponse is a single seat (can show assigned invite).
type EventSeatResponse struct {
	ID           int64  `json:"id"`
	EventTableID int64  `json:"event_table_id"`
	Label        string `json:"label"`
	DisplayOrder int    `json:"display_order"`
	InviteID     *int64 `json:"invite_id,omitempty"` // set if a guest has chosen this seat
}

// CreateEventTableRequest for adding a table to an event. Name is auto-set to "Table N".
// For shape "grid", Rows and Columns are required and Capacity = Rows * Columns.
type CreateEventTableRequest struct {
	Capacity int    `json:"capacity"`
	Shape    string `json:"shape"` // "round", "rectangular", or "grid"
	Rows     *int   `json:"rows,omitempty"`    // required when shape is "grid"
	Columns  *int   `json:"columns,omitempty"` // required when shape is "grid"
}

// UpdateEventTableRequest for updating a table.
type UpdateEventTableRequest struct {
	Shape        string `json:"shape"`
	Rows         *int   `json:"rows,omitempty"`
	Columns      *int   `json:"columns,omitempty"`
	Capacity     int    `json:"capacity"`
	DisplayOrder int    `json:"display_order"`
}

// ReorderEventTablesRequest for reordering tables/sitting areas.
type ReorderEventTablesRequest struct {
	TableIDs []int64 `json:"table_ids"`
}