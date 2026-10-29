package repositories

import (
	"context"
	"errors"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/repositories"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type eventInvitationCardRepositoryImpl struct {
	db *gorm.DB
}

func NewEventInvitationCardRepository(db *gorm.DB) repositories.EventInvitationCardRepository {
	return &eventInvitationCardRepositoryImpl{db: db}
}

func (r *eventInvitationCardRepositoryImpl) FindByEventID(ctx context.Context, eventID string) (*entities.EventInvitationCard, error) {
	var card entities.EventInvitationCard
	err := r.db.WithContext(ctx).Where("event_id = ?", eventID).First(&card).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &card, nil
}

func (r *eventInvitationCardRepositoryImpl) Create(ctx context.Context, card *entities.EventInvitationCard) error {
	if card.ID == "" {
		card.ID = uuid.New().String()
	}
	return r.db.WithContext(ctx).Create(card).Error
}

func (r *eventInvitationCardRepositoryImpl) Update(ctx context.Context, card *entities.EventInvitationCard) error {
	return r.db.WithContext(ctx).Save(card).Error
}

func (r *eventInvitationCardRepositoryImpl) DeleteByEventID(ctx context.Context, eventID string) (bool, error) {
	res := r.db.WithContext(ctx).Where("event_id = ?", eventID).Delete(&entities.EventInvitationCard{})
	if res.Error != nil {
		return false, res.Error
	}
	return res.RowsAffected > 0, nil
}

func (r *eventInvitationCardRepositoryImpl) PreviewURLsByEventIDs(ctx context.Context, eventIDs []string) (map[string]string, error) {
	out := make(map[string]string, len(eventIDs))
	if len(eventIDs) == 0 {
		return out, nil
	}
	type row struct {
		EventID    string  `gorm:"column:event_id"`
		PreviewURL *string `gorm:"column:preview_url"`
	}
	var rows []row
	err := r.db.WithContext(ctx).
		Model(&entities.EventInvitationCard{}).
		Select("event_id, preview_url").
		Where("event_id IN ? AND preview_url IS NOT NULL AND preview_url <> ''", eventIDs).
		Find(&rows).Error
	if err != nil {
		return nil, err
	}
	for _, row := range rows {
		if row.PreviewURL != nil && *row.PreviewURL != "" {
			out[row.EventID] = *row.PreviewURL
		}
	}
	return out, nil
}
