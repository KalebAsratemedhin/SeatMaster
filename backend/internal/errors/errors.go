package errors

import "errors"

// Authentication errors
var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUserNotFound       = errors.New("user not found")
	ErrUserAlreadyExists  = errors.New("user already exists")
	ErrTokenInvalid       = errors.New("invalid or expired token")
	ErrTokenExpired       = errors.New("token has expired")
	ErrUnauthorized       = errors.New("unauthorized access")
)

// Validation errors
var (
	ErrInvalidInput     = errors.New("invalid input provided")
	ErrMissingAuthToken = errors.New("authorization token required")
	ErrInvalidAuthToken = errors.New("invalid authorization token format")
)

// Database errors
var (
	ErrDatabaseConnection = errors.New("database connection failed")
	ErrDatabaseQuery      = errors.New("database query failed")
)

// Event errors
var (
	ErrEventNotFound = errors.New("event not found")
	ErrEventAccess   = errors.New("access denied to event")
	ErrEventFull     = errors.New("event has reached maximum guest capacity")
)

// Guest errors
var (
	ErrGuestNotFound      = errors.New("guest not found")
	ErrGuestAlreadyExists = errors.New("guest already exists for this event")
	ErrAccessDenied       = errors.New("access denied to this resource")
)
