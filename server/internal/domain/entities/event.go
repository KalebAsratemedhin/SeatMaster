package entities

import (
	"time"

	"github.com/KalebAsratemedhin/seatmaster/pkg/errors"
)

type Visibility string

type EventType string

const (
	EventTypePublic  EventType = "public"
	EventTypePrivate EventType = "private"
)

const (
	VisibilityPublic  Visibility = "public"
	VisibilityPrivate Visibility = "private"
)

type Event struct {
	ID        int64     `json:"id"`
	OwnerID     int64    `json:"owner_id"`
	Name  string    `json:"name"`
	BannerURL  string    `json:"banner_url"`
	Visibility  Visibility    `json:"visibility"`
	Location  string    `json:"location"`
	Latitude  float64    `json:"latitude"`
	Longitude  float64    `json:"longitude"`
	EventType  EventType    `json:"event_type"`
	Message  string    `json:"message"`
	EventDate  time.Time    `json:"event_date"`
	StartTime  time.Time    `json:"start_time"`
	EndTime  time.Time    `json:"end_time"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (e *Event) Validate() error {
	if e.Name == "" {
		return errors.ErrInvalidName
	}
	if e.BannerURL == "" {
		return errors.ErrInvalidBannerURL
	}
	if e.Visibility == "" {
		return errors.ErrInvalidVisibility
	}
	if e.EventType == "" {
		return errors.ErrInvalidEventType
	}
	if e.Message == "" {
		return errors.ErrInvalidMessage
	}
	if e.EventDate.IsZero() {
		return errors.ErrInvalidEventDate
	}
	if e.StartTime.IsZero() {
		return errors.ErrInvalidStartTime
	}
	if e.EndTime.IsZero() {
		return errors.ErrInvalidEndTime
	}
	if e.OwnerID == 0 {
		return errors.ErrInvalidOwnerID
	}
	if e.Location == "" {
		return errors.ErrInvalidLocation
	}
	if e.Latitude == 0 {
		return errors.ErrInvalidLatitude
	}
	if e.Longitude == 0 {
		return errors.ErrInvalidLongitude
	}
	return nil
}