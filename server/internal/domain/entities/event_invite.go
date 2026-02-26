package entities

import (
	"time"

	"github.com/KalebAsratemedhin/seatmaster/pkg/errors"
)

type EventInvite struct {
	ID          string    `json:"id"`
	EventID     string    `json:"event_id"`
	UserID      *string   `json:"user_id,omitempty"` // nil when invited by email only (no account yet)
	Email       string    `json:"email"`
	Status      string    `json:"status"`
	SeatID      *string   `json:"seat_id,omitempty"`
	GuestSeatID *string   `json:"guest_seat_id,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (e *EventInvite) Validate() error {
	if e.EventID == "" {
		return errors.ErrInvalidEventID
	}
	if e.Email == "" {
		return errors.ErrInvalidEmail
	}
	if e.Status == "" {
		return errors.ErrInvalidInviteStatus
	}
	return nil
}