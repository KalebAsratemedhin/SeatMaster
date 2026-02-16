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
	CreatedAt string `json:"created_at"`
}

// RsvpRequest is the body for a guest responding to an invitation.
type RsvpRequest struct {
	Status string `json:"status"` // "confirmed" or "declined"
}