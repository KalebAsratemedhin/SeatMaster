package repositories

import (
	"context"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
)

type UserRepository interface {
	Create(ctx context.Context, user *entities.User) error
	FindByEmail(ctx context.Context, email string) (*entities.User, error)
	FindByID(ctx context.Context, id int64) (*entities.User, error)
	ExistsByEmail(ctx context.Context, email string) (bool, error)
	Update(ctx context.Context, user *entities.User) error
}