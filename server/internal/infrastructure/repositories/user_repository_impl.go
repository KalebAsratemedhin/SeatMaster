package repositories

import (
	"context"
	"errors"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/repositories"

	"gorm.io/gorm"
)

type userRepositoryImpl struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) repositories.UserRepository {
	return &userRepositoryImpl{db: db}
}

func (r *userRepositoryImpl) Create(ctx context.Context, user *entities.User) error {
	result := r.db.WithContext(ctx).Create(user)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (r *userRepositoryImpl) FindByEmail(ctx context.Context, email string) (*entities.User, error) {
	var user entities.User
	result := r.db.WithContext(ctx).Where("email = ?", email).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, result.Error
		}
		return nil, result.Error
	}
	return &user, nil
}

func (r *userRepositoryImpl) FindByID(ctx context.Context, id int64) (*entities.User, error) {
	var user entities.User
	result := r.db.WithContext(ctx).First(&user, id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, result.Error
		}
		return nil, result.Error
	}
	return &user, nil
}

func (r *userRepositoryImpl) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	var count int64
	result := r.db.WithContext(ctx).Model(&entities.User{}).Where("email = ?", email).Count(&count)
	if result.Error != nil {
		return false, result.Error
	}
	return count > 0, nil
}

func (r *userRepositoryImpl) Update(ctx context.Context, user *entities.User) error {
	result := r.db.WithContext(ctx).Model(user).Updates(map[string]interface{}{
		"first_name":  user.FirstName,
		"last_name":   user.LastName,
		"phone":       user.Phone,
		"avatar_url":  user.AvatarURL,
		"updated_at":  user.UpdatedAt,
	})
	if result.Error != nil {
		return result.Error
	}
	return nil
}