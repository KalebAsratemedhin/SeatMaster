package errors

import "errors"

var (
	ErrInvalidEmail     = errors.New("invalid email")
	ErrPasswordTooShort = errors.New("password must be at least 8 characters")
	
	ErrInvalidName      = errors.New("name is required")
	ErrInvalidBannerURL = errors.New("banner URL is required")
	ErrInvalidVisibility = errors.New("visibility is required")
	ErrInvalidEventType = errors.New("event type is required")
	ErrInvalidMessage = errors.New("message is required")
	ErrInvalidEventDate = errors.New("event date is required")
	ErrInvalidStartTime = errors.New("start time is required")
	ErrInvalidEndTime = errors.New("end time is required")
	ErrInvalidOwnerID = errors.New("owner ID is required")
	ErrInvalidLocation = errors.New("location is required")
	ErrInvalidLatitude = errors.New("latitude is required")
	ErrInvalidLongitude = errors.New("longitude is required")

	ErrInvalidEventID = errors.New("event ID is required")
	ErrInvalidUserID = errors.New("user ID is required")
	ErrInvalidInviteStatus = errors.New("invite status is required")
)