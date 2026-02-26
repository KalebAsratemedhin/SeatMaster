package repositories

import (
	"context"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
)

type EventRepository interface {
	Create(ctx context.Context, event *entities.Event) error
	FindByID(ctx context.Context, id string) (*entities.Event, error)
	FindByOwnerID(ctx context.Context, ownerID string) ([]*entities.Event, error)
	FindByOwnerIDPaginated(ctx context.Context, ownerID string, limit, offset int) ([]*entities.Event, int64, error)
	FindByUserID(ctx context.Context, userID string) ([]*entities.Event, error)
	FindByUserIDPaginated(ctx context.Context, userID string, limit, offset int) ([]*entities.Event, int64, error)
	FindByEmail(ctx context.Context, email string) (*entities.Event, error)
	ExistsByID(ctx context.Context, id string) (bool, error)
	ExistsByOwnerID(ctx context.Context, ownerID string) (bool, error)
	ExistsByUserID(ctx context.Context, userID string) (bool, error)
	ExistsByEmail(ctx context.Context, email string) (bool, error)
	ExistsByName(ctx context.Context, name string) (bool, error)
	Delete(ctx context.Context, event *entities.Event) error
	Update(ctx context.Context, event *entities.Event) error
	// ListPublic returns public events with optional search, for discovery (no auth).
	ListPublic(ctx context.Context, search string, limit, offset int) ([]*entities.Event, error)
}