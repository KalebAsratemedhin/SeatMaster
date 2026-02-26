package repositories

import (
	"context"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
)

type EventChatThreadRepository interface {
	Create(ctx context.Context, t *entities.EventChatThread) error
	FindByID(ctx context.Context, id string) (*entities.EventChatThread, error)
	FindByEventAndGuest(ctx context.Context, eventID, guestID string) (*entities.EventChatThread, error)
	ListThreadsForEvent(ctx context.Context, eventID string, userID string) ([]*entities.EventChatThread, error)
}

type EventChatMessageRepository interface {
	Create(ctx context.Context, m *entities.EventChatMessage) error
	ListByThreadID(ctx context.Context, threadID string, limit, offset int) ([]*entities.EventChatMessage, int64, error)
}
