package middleware

import (
	"context"
	"log"
	"net/http"
	"strings"

	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/security"
)

// ContextKey is a typed key for context values to avoid collisions.
type ContextKey string

const (
	UserIDKey    ContextKey = "user_id"
	UserEmailKey ContextKey = "user_email"
)

// UserExistsFunc returns whether a user id still exists (used after account deletion).
type UserExistsFunc func(ctx context.Context, userID string) (bool, error)

type AuthMiddleware struct {
	jwt        *security.JWTManager
	userExists UserExistsFunc
}

func NewAuthMiddleware(jwt *security.JWTManager, userExists UserExistsFunc) *AuthMiddleware {
	return &AuthMiddleware{jwt: jwt, userExists: userExists}
}

func (m *AuthMiddleware) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			log.Printf("error %d: Authorization header required", http.StatusUnauthorized)
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			log.Printf("error %d: Invalid authorization header format", http.StatusUnauthorized)
			http.Error(w, "Invalid authorization header format", http.StatusUnauthorized)
			return
		}

		claims, err := m.jwt.ValidateToken(parts[1])
		if err != nil {
			log.Printf("error %d: Invalid token", http.StatusUnauthorized)
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		if m.userExists != nil {
			ok, err := m.userExists(r.Context(), claims.UserID)
			if err != nil || !ok {
				log.Printf("error %d: Invalid token (user missing)", http.StatusUnauthorized)
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}
		}

		ctx := r.Context()
		ctx = context.WithValue(ctx, UserIDKey, claims.UserID)
		ctx = context.WithValue(ctx, UserEmailKey, claims.Email)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// OptionalAuth does not require a token: if a valid Bearer token for an existing user
// is present, it sets the user in context; otherwise the request continues unauthenticated.
func (m *AuthMiddleware) OptionalAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			next.ServeHTTP(w, r)
			return
		}
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			next.ServeHTTP(w, r)
			return
		}
		claims, err := m.jwt.ValidateToken(parts[1])
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}
		if m.userExists != nil {
			ok, err := m.userExists(r.Context(), claims.UserID)
			if err != nil || !ok {
				next.ServeHTTP(w, r)
				return
			}
		}
		ctx := r.Context()
		ctx = context.WithValue(ctx, UserIDKey, claims.UserID)
		ctx = context.WithValue(ctx, UserEmailKey, claims.Email)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetUserID returns the user ID from context if set (e.g. by AuthMiddleware). Second return is false if missing or invalid.
func GetUserID(ctx context.Context) (string, bool) {
	v := ctx.Value(UserIDKey)
	if v == nil {
		return "", false
	}
	id, ok := v.(string)
	return id, ok
}
