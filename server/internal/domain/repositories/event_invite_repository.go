package repositories

import (
	"context"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
)

// EventInviteRepository defines persistence for event invites.
type EventInviteRepository interface {
	Create(ctx context.Context, invite *entities.EventInvite) error
	ListByEventID(ctx context.Context, eventID string) ([]*entities.EventInvite, error)
	ListByEventIDPaginated(ctx context.Context, eventID string, limit, offset int) ([]*entities.EventInvite, int64, error)
	ListByUserID(ctx context.Context, userID string) ([]*entities.EventInvite, error)
	ListByUserIDPaginated(ctx context.Context, userID string, limit, offset int) ([]*entities.EventInvite, int64, error)
	FindByEventAndUser(ctx context.Context, eventID, userID string) (*entities.EventInvite, error)
	FindByEventAndEmail(ctx context.Context, eventID string, email string) (*entities.EventInvite, error)
	ExistsByEventAndUser(ctx context.Context, eventID, userID string) (bool, error)
	ExistsByEventAndEmail(ctx context.Context, eventID string, email string) (bool, error)
	ListByUserIDOrEmail(ctx context.Context, userID string, email string) ([]*entities.EventInvite, error)
	ListByUserIDOrEmailPaginated(ctx context.Context, userID string, email string, limit, offset int) ([]*entities.EventInvite, int64, error)
	Update(ctx context.Context, invite *entities.EventInvite) error
}
