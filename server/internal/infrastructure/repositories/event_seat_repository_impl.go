package repositories

import (
	"context"
	"errors"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/repositories"
	"gorm.io/gorm"
)

type eventSeatRepositoryImpl struct {
	db *gorm.DB
}

func NewEventSeatRepository(db *gorm.DB) repositories.EventSeatRepository {
	return &eventSeatRepositoryImpl{db: db}
}

func (r *eventSeatRepositoryImpl) Create(ctx context.Context, s *entities.EventSeat) error {
	return r.db.WithContext(ctx).Create(s).Error
}

func (r *eventSeatRepositoryImpl) CreateBulk(ctx context.Context, seats []*entities.EventSeat) error {
	if len(seats) == 0 {
		return nil
	}
	return r.db.WithContext(ctx).Create(&seats).Error
}

func (r *eventSeatRepositoryImpl) FindByID(ctx context.Context, id int64) (*entities.EventSeat, error) {
	var row entities.EventSeat
	err := r.db.WithContext(ctx).First(&row, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		return nil, err
	}
	return &row, nil
}

func (r *eventSeatRepositoryImpl) ListByEventTableID(ctx context.Context, tableID int64) ([]*entities.EventSeat, error) {
	var list []*entities.EventSeat
	err := r.db.WithContext(ctx).Where("event_table_id = ?", tableID).Order("display_order ASC, id ASC").Find(&list).Error
	if err != nil {
		return nil, err
	}
	return list, nil
}

func (r *eventSeatRepositoryImpl) ListByEventID(ctx context.Context, eventID int64) ([]*entities.EventSeat, error) {
	var list []*entities.EventSeat
	err := r.db.WithContext(ctx).Table("event_seats").
		Joins("INNER JOIN event_tables ON event_tables.id = event_seats.event_table_id").
		Where("event_tables.event_id = ?", eventID).
		Order("event_tables.display_order ASC, event_tables.id ASC, event_seats.display_order ASC, event_seats.id ASC").
		Select("event_seats.*").
		Find(&list).Error
	if err != nil {
		return nil, err
	}
	return list, nil
}

func (r *eventSeatRepositoryImpl) Update(ctx context.Context, s *entities.EventSeat) error {
	return r.db.WithContext(ctx).Save(s).Error
}

func (r *eventSeatRepositoryImpl) Delete(ctx context.Context, s *entities.EventSeat) error {
	return r.db.WithContext(ctx).Delete(s).Error
}

func (r *eventSeatRepositoryImpl) DeleteByTableID(ctx context.Context, eventTableID int64) error {
	return r.db.WithContext(ctx).Where("event_table_id = ?", eventTableID).Delete(&entities.EventSeat{}).Error
}
