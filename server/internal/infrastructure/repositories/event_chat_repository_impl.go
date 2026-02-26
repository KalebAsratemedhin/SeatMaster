package repositories

import (
	"context"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/repositories"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type eventChatThreadRepositoryImpl struct {
	db *gorm.DB
}

func NewEventChatThreadRepository(db *gorm.DB) repositories.EventChatThreadRepository {
	return &eventChatThreadRepositoryImpl{db: db}
}

func (r *eventChatThreadRepositoryImpl) Create(ctx context.Context, t *entities.EventChatThread) error {
	if t.ID == "" {
		t.ID = uuid.New().String()
	}
	return r.db.WithContext(ctx).Create(t).Error
}

func (r *eventChatThreadRepositoryImpl) FindByID(ctx context.Context, id string) (*entities.EventChatThread, error) {
	var row entities.EventChatThread
	err := r.db.WithContext(ctx).First(&row, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *eventChatThreadRepositoryImpl) FindByEventAndGuest(ctx context.Context, eventID, guestID string) (*entities.EventChatThread, error) {
	var row entities.EventChatThread
	err := r.db.WithContext(ctx).Where("event_id = ? AND guest_id = ?", eventID, guestID).First(&row).Error
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *eventChatThreadRepositoryImpl) ListThreadsForEvent(ctx context.Context, eventID string, userID string) ([]*entities.EventChatThread, error) {
	var list []*entities.EventChatThread
	err := r.db.WithContext(ctx).Where("event_id = ? AND (owner_id = ? OR guest_id = ?)", eventID, userID, userID).
		Order("created_at DESC").Find(&list).Error
	return list, err
}

type eventChatMessageRepositoryImpl struct {
	db *gorm.DB
}

func NewEventChatMessageRepository(db *gorm.DB) repositories.EventChatMessageRepository {
	return &eventChatMessageRepositoryImpl{db: db}
}

func (r *eventChatMessageRepositoryImpl) Create(ctx context.Context, m *entities.EventChatMessage) error {
	if m.ID == "" {
		m.ID = uuid.New().String()
	}
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *eventChatMessageRepositoryImpl) ListByThreadID(ctx context.Context, threadID string, limit, offset int) ([]*entities.EventChatMessage, int64, error) {
	var total int64
	if err := r.db.WithContext(ctx).Model(&entities.EventChatMessage{}).Where("thread_id = ?", threadID).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if limit <= 0 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}
	var list []*entities.EventChatMessage
	err := r.db.WithContext(ctx).Where("thread_id = ?", threadID).
		Order("created_at ASC").Limit(limit).Offset(offset).Find(&list).Error
	return list, total, err
}
