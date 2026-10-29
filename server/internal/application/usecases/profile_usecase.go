package usecases

import (
	"context"
	"errors"
	"time"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/dto"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/repositories"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/security"
	pkgerrors "github.com/KalebAsratemedhin/seatmaster/pkg/errors"
)

var (
	ErrInvalidCurrentPassword  = errors.New("invalid_current_password")
	ErrNewPasswordSameAsCurrent = errors.New("new_password_same_as_current")
	ErrInvalidPassword         = errors.New("invalid_password")
	ErrConfirmationRequired    = errors.New("confirmation_required")
	ErrHasOwnedEvents          = errors.New("has_owned_events")
	ErrUserNotFound            = errors.New("user not found")
)

type ProfileUseCase struct {
	userRepo  repositories.UserRepository
	eventRepo repositories.EventRepository
	authUC    *AuthUseCase
	password  *security.PasswordManager
}

func NewProfileUseCase(
	userRepo repositories.UserRepository,
	eventRepo repositories.EventRepository,
	authUC *AuthUseCase,
	password *security.PasswordManager,
) *ProfileUseCase {
	return &ProfileUseCase{
		userRepo:  userRepo,
		eventRepo: eventRepo,
		authUC:    authUC,
		password:  password,
	}
}

func (uc *ProfileUseCase) GetProfile(ctx context.Context, userID string) (*dto.UserResponse, error) {
	user, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	resp := uc.authUC.UserToResponse(user)
	return &resp, nil
}

func (uc *ProfileUseCase) UpdateProfile(ctx context.Context, userID string, req dto.UpdateProfileRequest) (*dto.UserResponse, error) {
	user, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	user.FirstName = req.FirstName
	user.LastName = req.LastName
	user.Phone = req.Phone
	user.AvatarURL = req.AvatarURL
	user.UpdatedAt = time.Now()
	if err := uc.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}
	resp := uc.authUC.UserToResponse(user)
	return &resp, nil
}

func (uc *ProfileUseCase) ChangePassword(ctx context.Context, userID string, req dto.ChangePasswordRequest) error {
	if userID == "" {
		return errors.New("unauthorized")
	}
	if len(req.NewPassword) < 8 {
		return pkgerrors.ErrPasswordTooShort
	}
	if req.CurrentPassword == "" {
		return ErrInvalidCurrentPassword
	}
	if req.NewPassword == req.CurrentPassword {
		return ErrNewPasswordSameAsCurrent
	}

	user, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		return ErrUserNotFound
	}
	if !uc.password.Verify(req.CurrentPassword, user.Password) {
		return ErrInvalidCurrentPassword
	}

	hashed, err := uc.password.Hash(req.NewPassword)
	if err != nil {
		return err
	}
	return uc.userRepo.UpdatePassword(ctx, userID, hashed)
}

func (uc *ProfileUseCase) DeleteAccount(ctx context.Context, userID string, req dto.DeleteAccountRequest) error {
	if userID == "" {
		return errors.New("unauthorized")
	}
	if req.Confirmation != "DELETE" {
		return ErrConfirmationRequired
	}
	if req.Password == "" {
		return ErrInvalidPassword
	}

	user, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		return ErrUserNotFound
	}
	if !uc.password.Verify(req.Password, user.Password) {
		return ErrInvalidPassword
	}

	owns, err := uc.eventRepo.ExistsByOwnerID(ctx, userID)
	if err != nil {
		return err
	}
	if owns {
		return ErrHasOwnedEvents
	}

	if err := uc.userRepo.Delete(ctx, userID); err != nil {
		return ErrUserNotFound
	}
	return nil
}
