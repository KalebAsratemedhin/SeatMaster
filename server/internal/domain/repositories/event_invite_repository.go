package repositories

import (
	"context"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
)

// EventInviteRepository defines persistence for event invites.
type EventInviteRepository interface {
	Create(ctx context.Context, invite *entities.EventInvite) error
	ListByEventID(ctx context.Context, eventID int64) ([]*entities.EventInvite, error)
	ListByEventIDPaginated(ctx context.Context, eventID int64, limit, offset int) ([]*entities.EventInvite, int64, error)
	ListByUserID(ctx context.Context, userID int64) ([]*entities.EventInvite, error)
	ListByUserIDPaginated(ctx context.Context, userID int64, limit, offset int) ([]*entities.EventInvite, int64, error)
	FindByEventAndUser(ctx context.Context, eventID, userID int64) (*entities.EventInvite, error)
	ExistsByEventAndUser(ctx context.Context, eventID, userID int64) (bool, error)
	ExistsByEventAndEmail(ctx context.Context, eventID int64, email string) (bool, error)
	Update(ctx context.Context, invite *entities.EventInvite) error
}
