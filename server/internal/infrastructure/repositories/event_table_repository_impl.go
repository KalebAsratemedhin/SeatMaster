package repositories

import (
	"context"
	"errors"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/repositories"
	"gorm.io/gorm"
)

type eventTableRepositoryImpl struct {
	db *gorm.DB
}

func NewEventTableRepository(db *gorm.DB) repositories.EventTableRepository {
	return &eventTableRepositoryImpl{db: db}
}

func (r *eventTableRepositoryImpl) Create(ctx context.Context, t *entities.EventTable) error {
	return r.db.WithContext(ctx).Create(t).Error
}

func (r *eventTableRepositoryImpl) FindByID(ctx context.Context, id int64) (*entities.EventTable, error) {
	var row entities.EventTable
	err := r.db.WithContext(ctx).First(&row, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		return nil, err
	}
	return &row, nil
}

func (r *eventTableRepositoryImpl) ListByEventID(ctx context.Context, eventID int64) ([]*entities.EventTable, error) {
	var list []*entities.EventTable
	err := r.db.WithContext(ctx).Where("event_id = ?", eventID).Order("display_order ASC, id ASC").Find(&list).Error
	if err != nil {
		return nil, err
	}
	return list, nil
}

func (r *eventTableRepositoryImpl) Update(ctx context.Context, t *entities.EventTable) error {
	return r.db.WithContext(ctx).Save(t).Error
}

func (r *eventTableRepositoryImpl) Delete(ctx context.Context, t *entities.EventTable) error {
	return r.db.WithContext(ctx).Delete(t).Error
}
