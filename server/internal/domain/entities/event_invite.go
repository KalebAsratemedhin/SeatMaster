package entities

import (
	"time"

	"github.com/KalebAsratemedhin/seatmaster/pkg/errors"
)

type EventInvite struct {
	ID        int64     `json:"id"`
	EventID   int64     `json:"event_id"`
	UserID    int64     `json:"user_id"`
	Email     string    `json:"email"`
	Status    string    `json:"status"`
	SeatID    *int64    `json:"seat_id,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (e *EventInvite) Validate() error {
	if e.EventID == 0 {
		return errors.ErrInvalidEventID
	}
	if e.UserID == 0 {
		return errors.ErrInvalidUserID
	}
	if e.Email == "" {
		return errors.ErrInvalidEmail
	}
	if e.Status == "" {
		return errors.ErrInvalidInviteStatus
	}
	return nil
}