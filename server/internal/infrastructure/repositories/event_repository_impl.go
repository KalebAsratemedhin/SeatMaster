package repositories

import (
	"context"
	"errors"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/repositories"

	"gorm.io/gorm"
)

type eventRepositoryImpl struct {
	db *gorm.DB
}

// NewEventRepository returns an implementation of EventRepository.
func NewEventRepository(db *gorm.DB) repositories.EventRepository {
	return &eventRepositoryImpl{db: db}
}

func (r *eventRepositoryImpl) Create(ctx context.Context, event *entities.Event) error {
	return r.db.WithContext(ctx).Create(event).Error
}

func (r *eventRepositoryImpl) FindByID(ctx context.Context, id int64) (*entities.Event, error) {
	var event entities.Event
	err := r.db.WithContext(ctx).First(&event, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		return nil, err
	}
	return &event, nil
}

func (r *eventRepositoryImpl) FindByOwnerID(ctx context.Context, ownerID int64) ([]*entities.Event, error) {
	var events []*entities.Event
	err := r.db.WithContext(ctx).Where("owner_id = ?", ownerID).Order("event_date DESC, start_time DESC").Find(&events).Error
	if err != nil {
		return nil, err
	}
	return events, nil
}

func (r *eventRepositoryImpl) FindByUserID(ctx context.Context, userID int64) ([]*entities.Event, error) {
	var ids []int64
	err := r.db.WithContext(ctx).Model(&entities.EventInvite{}).Where("user_id = ?", userID).Distinct("event_id").Pluck("event_id", &ids).Error
	if err != nil {
		return nil, err
	}
	if len(ids) == 0 {
		return []*entities.Event{}, nil
	}
	var events []*entities.Event
	err = r.db.WithContext(ctx).Where("id IN ?", ids).Order("event_date DESC, start_time DESC").Find(&events).Error
	if err != nil {
		return nil, err
	}
	return events, nil
}

// FindByEmail is not applicable to events; returns gorm.ErrRecordNotFound to satisfy interface.
func (r *eventRepositoryImpl) FindByEmail(ctx context.Context, email string) (*entities.Event, error) {
	return nil, gorm.ErrRecordNotFound
}

func (r *eventRepositoryImpl) ExistsByID(ctx context.Context, id int64) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&entities.Event{}).Where("id = ?", id).Count(&count).Error
	return count > 0, err
}

func (r *eventRepositoryImpl) ExistsByOwnerID(ctx context.Context, ownerID int64) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&entities.Event{}).Where("owner_id = ?", ownerID).Count(&count).Error
	return count > 0, err
}

func (r *eventRepositoryImpl) ExistsByUserID(ctx context.Context, userID int64) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&entities.EventInvite{}).Where("user_id = ?", userID).Count(&count).Error
	return count > 0, err
}

// ExistsByEmail is not applicable to events; returns false to satisfy interface.
func (r *eventRepositoryImpl) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	return false, nil
}

func (r *eventRepositoryImpl) ExistsByName(ctx context.Context, name string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&entities.Event{}).Where("name = ?", name).Count(&count).Error
	return count > 0, err
}

func (r *eventRepositoryImpl) Update(ctx context.Context, event *entities.Event) error {
	return r.db.WithContext(ctx).Save(event).Error
}

func (r *eventRepositoryImpl) Delete(ctx context.Context, event *entities.Event) error {
	return r.db.WithContext(ctx).Delete(event).Error
}

func (r *eventRepositoryImpl) ListPublic(ctx context.Context, search string, limit, offset int) ([]*entities.Event, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	q := r.db.WithContext(ctx).Where("visibility = ?", "public")
	if search != "" {
		q = q.Where("name ILIKE ?", "%"+search+"%")
	}
	var events []*entities.Event
	err := q.Order("event_date DESC, start_time DESC").Limit(limit).Offset(offset).Find(&events).Error
	if err != nil {
		return nil, err
	}
	return events, nil
}
