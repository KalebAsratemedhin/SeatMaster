package repositories

import (
	"context"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/repositories"

	"gorm.io/gorm"
)

type eventInviteRepositoryImpl struct {
	db *gorm.DB
}

// NewEventInviteRepository returns an implementation of EventInviteRepository.
func NewEventInviteRepository(db *gorm.DB) repositories.EventInviteRepository {
	return &eventInviteRepositoryImpl{db: db}
}

func (r *eventInviteRepositoryImpl) Create(ctx context.Context, invite *entities.EventInvite) error {
	return r.db.WithContext(ctx).Create(invite).Error
}

func (r *eventInviteRepositoryImpl) ListByEventID(ctx context.Context, eventID int64) ([]*entities.EventInvite, error) {
	var invites []*entities.EventInvite
	err := r.db.WithContext(ctx).Where("event_id = ?", eventID).Order("created_at DESC").Find(&invites).Error
	if err != nil {
		return nil, err
	}
	return invites, nil
}

func (r *eventInviteRepositoryImpl) ExistsByEventAndUser(ctx context.Context, eventID, userID int64) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&entities.EventInvite{}).
		Where("event_id = ? AND user_id = ?", eventID, userID).Count(&count).Error
	return count > 0, err
}

func (r *eventInviteRepositoryImpl) ExistsByEventAndEmail(ctx context.Context, eventID int64, email string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&entities.EventInvite{}).
		Where("event_id = ? AND email = ?", eventID, email).Count(&count).Error
	return count > 0, err
}
