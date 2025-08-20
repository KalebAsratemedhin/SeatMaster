package constants

// HTTP status messages
const (
	StatusOK             = "ok"
	StatusError          = "error"
	MessageServerRunning = "SeatMaster Backend is running"
	MessageUserCreated   = "User created successfully"
	MessageUserLoggedOut = "Logged out successfully"
	MessageUserNotFound  = "User not found"
	MessageUnauthorized  = "User not authenticated"
)

// JWT constants
const (
	JWTDefaultExpiry = "24h"
	JWTSecretDefault = "your-super-secret-jwt-key-change-this-in-production"
)

// Database constants
const (
	DBDefaultHost     = "localhost"
	DBDefaultPort     = 5432
	DBDefaultUser     = "seatmaster"
	DBDefaultPassword = "seatmaster123"
	DBDefaultName     = "seatmaster"
	DBDefaultSSLMode  = "disable"
)

// Server constants
const (
	ServerDefaultPort = 8080
	ServerDefaultHost = "localhost"
)

// Validation constants
const (
	MinPasswordLength = 6
)
