package services

import (
	"crypto/rand"
	"errors"
	"fmt"
	"time"

	"github.com/seatmaster/backend/internal/config"
	"github.com/seatmaster/backend/internal/database"
	"github.com/seatmaster/backend/internal/database/models"
	customerrors "github.com/seatmaster/backend/internal/errors"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	db     *database.DB
	config *config.Config
}

func NewAuthService(db *database.DB, config *config.Config) *AuthService {
	return &AuthService{
		db:     db,
		config: config,
	}
}

func (s *AuthService) CreateUser(req *models.CreateUserRequest) (*models.User, error) {
	// Check if user already exists
	var existingUser models.User
	result := s.db.Where("email = ?", req.Email).First(&existingUser)
	if result.Error == nil {
		return nil, fmt.Errorf("%w: %s", customerrors.ErrUserAlreadyExists, req.Email)
	} else if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("error checking existing user: %w", result.Error)
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := &models.User{
		Email:     req.Email,
		Password:  string(hashedPassword),
		FirstName: req.FirstName,
		LastName:  req.LastName,
	}

	result = s.db.Create(user)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to create user: %w", result.Error)
	}

	return user, nil
}

func (s *AuthService) SignIn(req *models.SignInRequest) (*models.AuthResponse, error) {
	// Get user by email
	var user models.User
	result := s.db.Where("email = ?", req.Email).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, customerrors.ErrInvalidCredentials
		}
		return nil, fmt.Errorf("error finding user: %w", result.Error)
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, customerrors.ErrInvalidCredentials
	}

	// Generate JWT token
	token, err := s.generateJWT(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &models.AuthResponse{
		User:  &user,
		Token: token,
	}, nil
}

func (s *AuthService) GetUserByID(userID uint) (*models.User, error) {
	var user models.User
	result := s.db.First(&user, userID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, customerrors.ErrUserNotFound
		}
		return nil, fmt.Errorf("error finding user: %w", result.Error)
	}

	return &user, nil
}

func (s *AuthService) generateJWT(userID uint) (string, error) {
	// Create token claims
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(s.config.JWT.Expiry).Unix(),
		"iat":     time.Now().Unix(),
		"jti":     generateJTI(),
	}

	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token
	tokenString, err := token.SignedString([]byte(s.config.JWT.Secret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}
	return tokenString, nil
}

func (s *AuthService) ValidateToken(tokenString string) (uint, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.config.JWT.Secret), nil
	})

	if err != nil {
		return 0, fmt.Errorf("%w: %v", customerrors.ErrTokenInvalid, err)
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userID, ok := claims["user_id"].(float64)
		if !ok {
			return 0, fmt.Errorf("%w: invalid user_id in token", customerrors.ErrTokenInvalid)
		}
		return uint(userID), nil
	}

	return 0, customerrors.ErrTokenInvalid
}

func generateJTI() string {
	b := make([]byte, 16)
	rand.Read(b)
	return fmt.Sprintf("%x", b)
}
