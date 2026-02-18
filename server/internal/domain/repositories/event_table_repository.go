package repositories

import (
	"context"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
)

type EventTableRepository interface {
	Create(ctx context.Context, t *entities.EventTable) error
	FindByID(ctx context.Context, id int64) (*entities.EventTable, error)
	ListByEventID(ctx context.Context, eventID int64) ([]*entities.EventTable, error)
	Update(ctx context.Context, t *entities.EventTable) error
	Delete(ctx context.Context, t *entities.EventTable) error
}
