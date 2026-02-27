package dto

// DashboardResponse is returned by GET /dashboard.
type DashboardResponse struct {
	ActiveEvents     int64                   `json:"active_events"`
	TotalInvited     int64                   `json:"total_invited"`
	Confirmed        int64                   `json:"confirmed"`
	Pending          int64                   `json:"pending"`
	Declined         int64                   `json:"declined"`
	RecentRSVPs      []*RecentRSVPItem       `json:"recent_rsvps"`
	UpcomingEvent    *DashboardEventSummary  `json:"upcoming_event,omitempty"`
	GuestStats       *GuestStatsResponse     `json:"guest_stats,omitempty"`
	MyRecentRSVPs   []*MyRecentRSVPItem     `json:"my_recent_rsvps,omitempty"`
}

// GuestStatsResponse is the current user's invitation counts (as a guest).
type GuestStatsResponse struct {
	Total    int64 `json:"total"`
	Confirmed int64 `json:"confirmed"`
	Pending   int64 `json:"pending"`
	Declined  int64 `json:"declined"`
}

// MyRecentRSVPItem is one row for "events I recently RSVP'd to".
type MyRecentRSVPItem struct {
	EventID      string `json:"event_id"`
	EventName    string `json:"event_name"`
	EventDate    string `json:"event_date"`
	Status       string `json:"status"`
	ResponseTime string `json:"response_time"`
}

// RecentRSVPItem is one row in the recent RSVPs table.
type RecentRSVPItem struct {
	GuestName    string `json:"guest_name"`
	EventName    string `json:"event_name"`
	EventID      string `json:"event_id"`
	Status       string `json:"status"`
	PlusOne      string `json:"plus_one"` // "Yes (1)", "No", "-"
	ResponseTime string `json:"response_time"`
}

// DashboardEventSummary for the upcoming event card.
type DashboardEventSummary struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	EventDate string `json:"event_date"`
}

// TicketResponse is returned by GET /events/:id/ticket for a confirmed guest.
type TicketResponse struct {
	TicketID   string         `json:"ticket_id"`   // invite ID, encode in QR for check-in
	GuestName  string         `json:"guest_name"`
	EventName  string         `json:"event_name"`
	EventDate  string         `json:"event_date"`
	StartTime  string         `json:"start_time"`
	EndTime    string         `json:"end_time"`
	Location   string         `json:"location"`
}
