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

type CommentUseCase struct {
	eventRepo   repositories.EventRepository
	inviteRepo  repositories.EventInviteRepository
	commentRepo repositories.EventCommentRepository
	userRepo    repositories.UserRepository
}

func NewCommentUseCase(
	eventRepo repositories.EventRepository,
	inviteRepo repositories.EventInviteRepository,
	commentRepo repositories.EventCommentRepository,
	userRepo repositories.UserRepository,
) *CommentUseCase {
	return &CommentUseCase{
		eventRepo:   eventRepo,
		inviteRepo:  inviteRepo,
		commentRepo: commentRepo,
		userRepo:    userRepo,
	}
}

func (uc *CommentUseCase) canAccessEvent(ctx context.Context, eventID string, callerID string) (bool, error) {
	if callerID == "" {
		return false, nil
	}
	event, err := uc.eventRepo.FindByID(ctx, eventID)
	if err != nil {
		return false, err
	}
	if event.OwnerID == callerID || event.Visibility == entities.VisibilityPublic {
		return true, nil
	}
	invited, _ := uc.inviteRepo.ExistsByEventAndUser(ctx, eventID, callerID)
	return invited, nil
}

func (uc *CommentUseCase) ListComments(ctx context.Context, eventID string, callerID string, limit, offset int) (*dto.PaginatedCommentsResponse, error) {
	ok, err := uc.canAccessEvent(ctx, eventID, callerID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, errors.New("forbidden: you do not have access to this event")
	}
	list, total, err := uc.commentRepo.ListByEventID(ctx, eventID, limit, offset)
	if err != nil {
		return nil, err
	}
	items := make([]*dto.EventCommentResponse, len(list))
	for i, c := range list {
		author := ""
		if u, err := uc.userRepo.FindByID(ctx, c.UserID); err == nil {
			author = strings.TrimSpace(u.FirstName + " " + u.LastName)
			if author == "" {
				author = u.Email
			}
		}
		items[i] = &dto.EventCommentResponse{
			ID:        c.ID,
			EventID:   c.EventID,
			ParentID:  c.ParentID,
			UserID:    c.UserID,
			Author:    author,
			Body:      c.Body,
			CreatedAt: c.CreatedAt.Format(time.RFC3339),
		}
	}
	return &dto.PaginatedCommentsResponse{Items: items, Total: total}, nil
}

func (uc *CommentUseCase) CreateComment(ctx context.Context, eventID string, userID string, body string, parentID *string) (*dto.EventCommentResponse, error) {
	if userID == "" {
		return nil, errors.New("unauthorized")
	}
	body = strings.TrimSpace(body)
	if body == "" {
		return nil, errors.New("comment body is required")
	}
	ok, err := uc.canAccessEvent(ctx, eventID, userID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, errors.New("forbidden: you do not have access to this event")
	}
	if parentID != nil && *parentID != "" {
		parent, err := uc.commentRepo.FindByID(ctx, *parentID)
		if err != nil || parent == nil {
			return nil, errors.New("parent comment not found")
		}
		if parent.EventID != eventID {
			return nil, errors.New("parent comment does not belong to this event")
		}
	}
	user, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	author := strings.TrimSpace(user.FirstName + " " + user.LastName)
	if author == "" {
		author = user.Email
	}
	c := &entities.EventComment{
		EventID:   eventID,
		ParentID:  parentID,
		UserID:    userID,
		Body:      body,
		CreatedAt: time.Now(),
	}
	if err := uc.commentRepo.Create(ctx, c); err != nil {
		return nil, err
	}
	resp := &dto.EventCommentResponse{
		ID:        c.ID,
		EventID:   c.EventID,
		ParentID:  c.ParentID,
		UserID:    c.UserID,
		Author:    author,
		Body:      c.Body,
		CreatedAt: c.CreatedAt.Format(time.RFC3339),
	}
	return resp, nil
}
