package repositories

import (
	"context"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/repositories"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type eventCommentRepositoryImpl struct {
	db *gorm.DB
}

func NewEventCommentRepository(db *gorm.DB) repositories.EventCommentRepository {
	return &eventCommentRepositoryImpl{db: db}
}

func (r *eventCommentRepositoryImpl) Create(ctx context.Context, c *entities.EventComment) error {
	if c.ID == "" {
		c.ID = uuid.New().String()
	}
	return r.db.WithContext(ctx).Create(c).Error
}

func (r *eventCommentRepositoryImpl) FindByID(ctx context.Context, id string) (*entities.EventComment, error) {
	var c entities.EventComment
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&c).Error
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *eventCommentRepositoryImpl) ListByEventID(ctx context.Context, eventID string, limit, offset int) ([]*entities.EventComment, int64, error) {
	var total int64
	if err := r.db.WithContext(ctx).Model(&entities.EventComment{}).Where("event_id = ?", eventID).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if limit <= 0 {
		limit = 200
	}
	if offset < 0 {
		offset = 0
	}
	var list []*entities.EventComment
	// Order: top-level first (parent_id IS NULL), then by created_at so replies can be grouped under parents
	err := r.db.WithContext(ctx).Where("event_id = ?", eventID).
		Order("CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END, created_at ASC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}
