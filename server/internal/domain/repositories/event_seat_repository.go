package repositories

import (
	"context"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
)

type EventSeatRepository interface {
	Create(ctx context.Context, s *entities.EventSeat) error
	CreateBulk(ctx context.Context, seats []*entities.EventSeat) error
	FindByID(ctx context.Context, id int64) (*entities.EventSeat, error)
	ListByEventTableID(ctx context.Context, tableID int64) ([]*entities.EventSeat, error)
	ListByEventID(ctx context.Context, eventID int64) ([]*entities.EventSeat, error)
	Update(ctx context.Context, s *entities.EventSeat) error
	Delete(ctx context.Context, s *entities.EventSeat) error
	DeleteByTableID(ctx context.Context, eventTableID int64) error
}
