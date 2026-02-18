package repositories

import (
	"context"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
)

type EventRepository interface {
	Create(ctx context.Context, event *entities.Event) error
	FindByID(ctx context.Context, id int64) (*entities.Event, error)
	FindByOwnerID(ctx context.Context, ownerID int64) ([]*entities.Event, error)
	FindByOwnerIDPaginated(ctx context.Context, ownerID int64, limit, offset int) ([]*entities.Event, int64, error)
	FindByUserID(ctx context.Context, userID int64) ([]*entities.Event, error)
	FindByUserIDPaginated(ctx context.Context, userID int64, limit, offset int) ([]*entities.Event, int64, error)
	FindByEmail(ctx context.Context, email string) (*entities.Event, error)
	ExistsByID(ctx context.Context, id int64) (bool, error)
	ExistsByOwnerID(ctx context.Context, ownerID int64) (bool, error)
	ExistsByUserID(ctx context.Context, userID int64) (bool, error)
	ExistsByEmail(ctx context.Context, email string) (bool, error)
	ExistsByName(ctx context.Context, name string) (bool, error)
	Delete(ctx context.Context, event *entities.Event) error
	Update(ctx context.Context, event *entities.Event) error
	// ListPublic returns public events with optional search, for discovery (no auth).
	ListPublic(ctx context.Context, search string, limit, offset int) ([]*entities.Event, error)
}