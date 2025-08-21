package services

import (
	"crypto/rand"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
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
		Phone:     &req.Phone,
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

func (s *AuthService) GetUserByID(userID uuid.UUID) (*models.User, error) {
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

func (s *AuthService) UpdateProfile(userID uuid.UUID, req *models.UpdateProfileRequest) (*models.User, error) {
	var user models.User
	result := s.db.First(&user, userID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, customerrors.ErrUserNotFound
		}
		return nil, fmt.Errorf("error finding user: %w", result.Error)
	}

	// Update fields
	user.FirstName = req.FirstName
	user.LastName = req.LastName
	user.Phone = &req.Phone
	user.ProfilePic = &req.ProfilePic
	user.UpdatedAt = time.Now()

	result = s.db.Save(&user)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to update profile: %w", result.Error)
	}

	return &user, nil
}

func (s *AuthService) ChangePassword(userID uuid.UUID, req *models.ChangePasswordRequest) error {
	var user models.User
	result := s.db.First(&user, userID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return customerrors.ErrUserNotFound
		}
		return fmt.Errorf("error finding user: %w", result.Error)
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword)); err != nil {
		return customerrors.ErrInvalidCredentials
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash new password: %w", err)
	}

	// Update password
	user.Password = string(hashedPassword)
	user.UpdatedAt = time.Now()

	result = s.db.Save(&user)
	if result.Error != nil {
		return fmt.Errorf("failed to update password: %w", result.Error)
	}

	return nil
}

func (s *AuthService) generateJWT(userID uuid.UUID) (string, error) {
	// Create token claims
	claims := jwt.MapClaims{
		"user_id": userID.String(),
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

func (s *AuthService) ValidateToken(tokenString string) (uuid.UUID, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.config.JWT.Secret), nil
	})

	if err != nil {
		return uuid.Nil, fmt.Errorf("%w: %v", customerrors.ErrTokenInvalid, err)
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userIDStr, ok := claims["user_id"].(string)
		if !ok {
			return uuid.Nil, fmt.Errorf("%w: invalid user_id in token", customerrors.ErrTokenInvalid)
		}

		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			return uuid.Nil, fmt.Errorf("%w: invalid user_id format", customerrors.ErrTokenInvalid)
		}

		return userID, nil
	}

	return uuid.Nil, customerrors.ErrTokenInvalid
}

func generateJTI() string {
	b := make([]byte, 16)
	rand.Read(b)
	return fmt.Sprintf("%x", b)
}
