package usecases

import (
	"context"
	"errors"
	"time"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/dto"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/repositories"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/security"
)

type AuthUseCase struct {
	userRepo repositories.UserRepository
	jwt      *security.JWTManager
	password *security.PasswordManager
}

func NewAuthUseCase(
	userRepo repositories.UserRepository,
	jwt *security.JWTManager,
	password *security.PasswordManager,
) *AuthUseCase {
	return &AuthUseCase{
		userRepo: userRepo,
		jwt:      jwt,
		password: password,
	}
}

func (uc *AuthUseCase) Register(ctx context.Context, req dto.RegisterRequest) (*dto.AuthResponse, error) {
	exists, err := uc.userRepo.ExistsByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("user with this email already exists")
	}

	hashedPassword, err := uc.password.Hash(req.Password)
	if err != nil {
		return nil, err
	}

	user := &entities.User{
		Email:     req.Email,
		Password:  hashedPassword,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := user.Validate(); err != nil {
		return nil, err
	}

	if err := uc.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	token, err := uc.jwt.GenerateToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		Token: token,
		User:  uc.UserToResponse(user),
	}, nil
}

func (uc *AuthUseCase) UserToResponse(user *entities.User) dto.UserResponse {
	return dto.UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Phone:     user.Phone,
		AvatarURL: user.AvatarURL,
		CreatedAt: user.CreatedAt.Format(time.RFC3339),
	}
}

func (uc *AuthUseCase) Login(ctx context.Context, req dto.LoginRequest) (*dto.AuthResponse, error) {
	user, err := uc.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if !uc.password.Verify(req.Password, user.Password) {
		return nil, errors.New("invalid credentials")
	}

	token, err := uc.jwt.GenerateToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		Token: token,
		User:  uc.UserToResponse(user),
	}, nil
}