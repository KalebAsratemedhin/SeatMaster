package entities

import (
	"database/sql/driver"
	"fmt"
	"time"

	"github.com/KalebAsratemedhin/seatmaster/pkg/errors"
)

// TimeOfDay holds a time-of-day string "HH:MM:SS" and implements sql.Scanner and driver.Valuer
// so PostgreSQL TIME columns (returned as string or time.Time by the driver) scan correctly.
type TimeOfDay string

func (t *TimeOfDay) Scan(value interface{}) error {
	if value == nil {
		*t = ""
		return nil
	}
	switch v := value.(type) {
	case string:
		*t = TimeOfDay(v)
		return nil
	case []byte:
		*t = TimeOfDay(string(v))
		return nil
	case time.Time:
		*t = TimeOfDay(v.Format("15:04:05"))
		return nil
	default:
		return fmt.Errorf("cannot scan %T into TimeOfDay", value)
	}
}

func (t TimeOfDay) Value() (driver.Value, error) {
	if t == "" {
		return nil, nil
	}
	return string(t), nil
}

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
	StartTime  TimeOfDay    `json:"start_time"`
	EndTime    TimeOfDay    `json:"end_time"`
	CreatedAt  time.Time    `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (e *Event) Validate() error {
	if e.Name == "" {
		return errors.ErrInvalidName
	}
	// Banner is optional
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
	if e.StartTime == "" {
		return errors.ErrInvalidStartTime
	}
	if e.EndTime == "" {
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