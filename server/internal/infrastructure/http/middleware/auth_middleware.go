package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/security"
)

// ContextKey is a typed key for context values to avoid collisions.
type ContextKey string

const (
	UserIDKey   ContextKey = "user_id"
	UserEmailKey ContextKey = "user_email"
)

type AuthMiddleware struct {
	jwt *security.JWTManager
}

func NewAuthMiddleware(jwt *security.JWTManager) *AuthMiddleware {
	return &AuthMiddleware{jwt: jwt}
}

func (m *AuthMiddleware) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Invalid authorization header format", http.StatusUnauthorized)
			return
		}

		claims, err := m.jwt.ValidateToken(parts[1])
		if err != nil {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		ctx := r.Context()
		ctx = context.WithValue(ctx, UserIDKey, claims.UserID)
		ctx = context.WithValue(ctx, UserEmailKey, claims.Email)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetUserID returns the user ID from context if set (e.g. by AuthMiddleware). Second return is false if missing or invalid.
func GetUserID(ctx context.Context) (int64, bool) {
	v := ctx.Value(UserIDKey)
	if v == nil {
		return 0, false
	}
	id, ok := v.(int64)
	return id, ok
}