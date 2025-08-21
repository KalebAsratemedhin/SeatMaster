package utils

import (
	"github.com/google/uuid"
	"github.com/seatmaster/backend/internal/api/middleware"

	"github.com/gin-gonic/gin"
)

// GetCurrentUserID safely extracts the current user ID from the gin context
func GetCurrentUserID(c *gin.Context) (uuid.UUID, bool) {
	userCtx, exists := middleware.GetUserFromContext(c)
	if !exists {
		return uuid.Nil, false
	}
	return userCtx.UserID, true
}

// RequireAuth is a helper that returns an error response if user is not authenticated
func RequireAuth(c *gin.Context) (uuid.UUID, bool) {
	userID, exists := GetCurrentUserID(c)
	if !exists {
		c.JSON(401, gin.H{"error": "Authentication required"})
		c.Abort()
		return uuid.Nil, false
	}
	return userID, true
}
