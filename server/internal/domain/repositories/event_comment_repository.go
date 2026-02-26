package repositories

import (
	"context"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
)

type EventCommentRepository interface {
	Create(ctx context.Context, c *entities.EventComment) error
	FindByID(ctx context.Context, id string) (*entities.EventComment, error)
	ListByEventID(ctx context.Context, eventID string, limit, offset int) ([]*entities.EventComment, int64, error)
}
