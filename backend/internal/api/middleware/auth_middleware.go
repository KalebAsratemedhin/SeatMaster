package middleware

import (
	"net/http"
	"strings"

	customerrors "github.com/seatmaster/backend/internal/errors"
	"github.com/seatmaster/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type AuthMiddleware struct {
	authService *services.AuthService
}

// UserContext holds user information in the request context
type UserContext struct {
	UserID uint
}

// GetUserFromContext safely extracts user information from gin context
func GetUserFromContext(c *gin.Context) (*UserContext, bool) {
	userCtx, exists := c.Get("user_context")
	if !exists {
		return nil, false
	}

	if user, ok := userCtx.(*UserContext); ok {
		return user, true
	}

	return nil, false
}

func NewAuthMiddleware(authService *services.AuthService) *AuthMiddleware {
	return &AuthMiddleware{
		authService: authService,
	}
}

// AuthRequired middleware checks if the request has a valid JWT token
func (m *AuthMiddleware) AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": customerrors.ErrMissingAuthToken.Error()})
			c.Abort()
			return
		}

		// Check if it's a Bearer token
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": customerrors.ErrInvalidAuthToken.Error()})
			c.Abort()
			return
		}

		// Extract token
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": customerrors.ErrMissingAuthToken.Error()})
			c.Abort()
			return
		}

		// Validate token
		userID, err := m.authService.ValidateToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": customerrors.ErrTokenInvalid.Error()})
			c.Abort()
			return
		}

		// Set user context with proper type
		userCtx := &UserContext{UserID: userID}
		c.Set("user_context", userCtx)
		c.Next()
	}
}
