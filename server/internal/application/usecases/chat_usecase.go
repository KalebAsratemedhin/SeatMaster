package usecases

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/dto"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/repositories"
)

type ChatUseCase struct {
	eventRepo  repositories.EventRepository
	inviteRepo repositories.EventInviteRepository
	threadRepo repositories.EventChatThreadRepository
	messageRepo repositories.EventChatMessageRepository
	userRepo   repositories.UserRepository
}

func NewChatUseCase(
	eventRepo repositories.EventRepository,
	inviteRepo repositories.EventInviteRepository,
	threadRepo repositories.EventChatThreadRepository,
	messageRepo repositories.EventChatMessageRepository,
	userRepo repositories.UserRepository,
) *ChatUseCase {
	return &ChatUseCase{
		eventRepo:   eventRepo,
		inviteRepo:  inviteRepo,
		threadRepo:  threadRepo,
		messageRepo: messageRepo,
		userRepo:    userRepo,
	}
}

func (uc *ChatUseCase) canAccessEvent(ctx context.Context, eventID string, callerID string) (bool, error) {
	if callerID == "" {
		return false, nil
	}
	event, err := uc.eventRepo.FindByID(ctx, eventID)
	if err != nil {
		return false, err
	}
	if event.OwnerID == callerID {
		return true, nil
	}
	invited, _ := uc.inviteRepo.ExistsByEventAndUser(ctx, eventID, callerID)
	return invited, nil
}

// GetOrCreateThread returns the 1:1 thread between event owner and the given guest. If caller is owner, guestID is the other participant; if caller is guest, we look up the thread where guest_id = callerID.
func (uc *ChatUseCase) GetOrCreateThread(ctx context.Context, eventID string, callerID string, guestID string) (*dto.EventChatThreadResponse, error) {
	if callerID == "" {
		return nil, errors.New("unauthorized")
	}
	event, err := uc.eventRepo.FindByID(ctx, eventID)
	if err != nil {
		return nil, err
	}
	// Caller must be owner or the guest we're opening with
	isOwner := event.OwnerID == callerID
	if isOwner {
		// Owner opening thread with a guest: guestID must be invited
		if guestID == "" {
			return nil, errors.New("guest_id is required")
		}
		invited, _ := uc.inviteRepo.ExistsByEventAndUser(ctx, eventID, guestID)
		if !invited {
			return nil, errors.New("guest is not invited to this event")
		}
	} else {
		// Caller is guest: they can only open their own thread (guestID must be callerID or we use caller as guest)
		guestID = callerID
		if event.OwnerID != callerID {
			invited, _ := uc.inviteRepo.ExistsByEventAndUser(ctx, eventID, callerID)
			if !invited {
				return nil, errors.New("you are not invited to this event")
			}
		}
	}
	thread, err := uc.threadRepo.FindByEventAndGuest(ctx, eventID, guestID)
	if err != nil {
		// Create thread: owner_id = event.OwnerID, guest_id = guestID
		thread = &entities.EventChatThread{
			EventID:   eventID,
			OwnerID:   event.OwnerID,
			GuestID:   guestID,
			CreatedAt: time.Now(),
		}
		if err := uc.threadRepo.Create(ctx, thread); err != nil {
			return nil, err
		}
	}
	guestName := ""
	if u, err := uc.userRepo.FindByID(ctx, thread.GuestID); err == nil {
		guestName = strings.TrimSpace(u.FirstName + " " + u.LastName)
		if guestName == "" {
			guestName = u.Email
		}
	}
	return &dto.EventChatThreadResponse{
		ID:        thread.ID,
		EventID:   thread.EventID,
		OwnerID:   thread.OwnerID,
		GuestID:   thread.GuestID,
		GuestName: guestName,
		CreatedAt: thread.CreatedAt.Format(time.RFC3339),
	}, nil
}

func (uc *ChatUseCase) ListMyThreads(ctx context.Context, eventID string, callerID string) ([]*dto.EventChatThreadResponse, error) {
	if callerID == "" {
		return nil, errors.New("unauthorized")
	}
	ok, err := uc.canAccessEvent(ctx, eventID, callerID)
	if err != nil || !ok {
		return nil, errors.New("forbidden: you do not have access to this event")
	}
	threads, err := uc.threadRepo.ListThreadsForEvent(ctx, eventID, callerID)
	if err != nil {
		return nil, err
	}
	out := make([]*dto.EventChatThreadResponse, len(threads))
	for i, t := range threads {
		guestName := ""
		if u, err := uc.userRepo.FindByID(ctx, t.GuestID); err == nil {
			guestName = strings.TrimSpace(u.FirstName + " " + u.LastName)
			if guestName == "" {
				guestName = u.Email
			}
		}
		out[i] = &dto.EventChatThreadResponse{
			ID:        t.ID,
			EventID:   t.EventID,
			OwnerID:   t.OwnerID,
			GuestID:   t.GuestID,
			GuestName: guestName,
			CreatedAt: t.CreatedAt.Format(time.RFC3339),
		}
	}
	return out, nil
}

func (uc *ChatUseCase) CanAccessThread(ctx context.Context, threadID string, userID string) (bool, error) {
	if userID == "" {
		return false, nil
	}
	thread, err := uc.threadRepo.FindByID(ctx, threadID)
	if err != nil {
		return false, err
	}
	return thread.OwnerID == userID || thread.GuestID == userID, nil
}

func (uc *ChatUseCase) ListMessages(ctx context.Context, threadID string, callerID string, limit, offset int) (*dto.PaginatedChatMessagesResponse, error) {
	ok, err := uc.CanAccessThread(ctx, threadID, callerID)
	if err != nil || !ok {
		return nil, errors.New("forbidden: you do not have access to this thread")
	}
	list, total, err := uc.messageRepo.ListByThreadID(ctx, threadID, limit, offset)
	if err != nil {
		return nil, err
	}
	items := make([]*dto.EventChatMessageResponse, len(list))
	for i, m := range list {
		items[i] = &dto.EventChatMessageResponse{
			ID:        m.ID,
			ThreadID:  m.ThreadID,
			SenderID:  m.SenderID,
			Body:      m.Body,
			CreatedAt: m.CreatedAt.Format(time.RFC3339),
		}
	}
	return &dto.PaginatedChatMessagesResponse{Items: items, Total: total}, nil
}

func (uc *ChatUseCase) SendMessage(ctx context.Context, threadID string, senderID string, body string) (*dto.EventChatMessageResponse, error) {
	if senderID == "" {
		return nil, errors.New("unauthorized")
	}
	body = strings.TrimSpace(body)
	if body == "" {
		return nil, errors.New("message body is required")
	}
	ok, err := uc.CanAccessThread(ctx, threadID, senderID)
	if err != nil || !ok {
		return nil, errors.New("forbidden: you do not have access to this thread")
	}
	m := &entities.EventChatMessage{
		ThreadID:  threadID,
		SenderID:  senderID,
		Body:      body,
		CreatedAt: time.Now(),
	}
	if err := uc.messageRepo.Create(ctx, m); err != nil {
		return nil, err
	}
	return &dto.EventChatMessageResponse{
		ID:        m.ID,
		ThreadID:  m.ThreadID,
		SenderID:  m.SenderID,
		Body:      m.Body,
		CreatedAt: m.CreatedAt.Format(time.RFC3339),
	}, nil
}
