package usecases

import (
	"context"
	"time"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/dto"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/repositories"
)

type ProfileUseCase struct {
	userRepo repositories.UserRepository
	authUC   *AuthUseCase
}

func NewProfileUseCase(userRepo repositories.UserRepository, authUC *AuthUseCase) *ProfileUseCase {
	return &ProfileUseCase{userRepo: userRepo, authUC: authUC}
}

func (uc *ProfileUseCase) GetProfile(ctx context.Context, userID int64) (*dto.UserResponse, error) {
	user, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	resp := uc.authUC.UserToResponse(user)
	return &resp, nil
}

func (uc *ProfileUseCase) UpdateProfile(ctx context.Context, userID int64, req dto.UpdateProfileRequest) (*dto.UserResponse, error) {
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