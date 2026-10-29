package repositories

import (
	"context"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
)

type EventInvitationCardRepository interface {
	FindByEventID(ctx context.Context, eventID string) (*entities.EventInvitationCard, error)
	Create(ctx context.Context, card *entities.EventInvitationCard) error
	Update(ctx context.Context, card *entities.EventInvitationCard) error
	DeleteByEventID(ctx context.Context, eventID string) (bool, error)
	// PreviewURLsByEventIDs returns event_id → preview_url for cards that have one.
	PreviewURLsByEventIDs(ctx context.Context, eventIDs []string) (map[string]string, error)
}
