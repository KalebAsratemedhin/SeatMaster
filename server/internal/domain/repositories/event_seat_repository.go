package repositories

import (
	"context"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
)

type EventSeatRepository interface {
	Create(ctx context.Context, s *entities.EventSeat) error
	CreateBulk(ctx context.Context, seats []*entities.EventSeat) error
	FindByID(ctx context.Context, id string) (*entities.EventSeat, error)
	ListByEventTableID(ctx context.Context, tableID string) ([]*entities.EventSeat, error)
	ListByEventID(ctx context.Context, eventID string) ([]*entities.EventSeat, error)
	Update(ctx context.Context, s *entities.EventSeat) error
	Delete(ctx context.Context, s *entities.EventSeat) error
	DeleteByTableID(ctx context.Context, eventTableID string) error
}
