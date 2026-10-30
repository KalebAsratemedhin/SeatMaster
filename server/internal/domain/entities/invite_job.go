package entities

import "time"

const (
	InviteJobStatusQueued    = "queued"
	InviteJobStatusRunning   = "running"
	InviteJobStatusCompleted = "completed"
	InviteJobStatusFailed    = "failed"
)

// InviteJob tracks an async bulk invite / import run.
type InviteJob struct {
	ID        string    `json:"id"`
	EventID   string    `json:"event_id"`
	OwnerID   string    `json:"owner_id"`
	Status    string    `json:"status"`
	Total     int       `json:"total"`
	Sent      int       `json:"sent"`
	Failed    int       `json:"failed"`
	Emails    JSONB     `json:"emails" gorm:"type:jsonb"`
	Errors    JSONB     `json:"errors" gorm:"type:jsonb"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (InviteJob) TableName() string {
	return "invite_jobs"
}

// InviteJobErrorItem is one failed email in a job.
type InviteJobErrorItem struct {
	Email string `json:"email"`
	Error string `json:"error"`
}

// AttendeeRecommendation is a past guest suggested for a new invite list.
type AttendeeRecommendation struct {
	Email         string
	DisplayName   string
	LastEventName string
	LastEventDate time.Time
}
