package usecases

import (
	"context"
	"errors"
	"time"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/dto"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/repositories"
	"gorm.io/gorm"
)

type EventUseCase struct {
	eventRepo     repositories.EventRepository
	eventInviteRepo repositories.EventInviteRepository
	userRepo      repositories.UserRepository
}

func NewEventUseCase(
	eventRepo repositories.EventRepository,
	eventInviteRepo repositories.EventInviteRepository,
	userRepo repositories.UserRepository,
) *EventUseCase {
	return &EventUseCase{
		eventRepo:       eventRepo,
		eventInviteRepo: eventInviteRepo,
		userRepo:        userRepo,
	}
}

func (uc *EventUseCase) toEventResponse(event *entities.Event) *dto.EventResponse {
	if event == nil {
		return nil
	}
	return &dto.EventResponse{
		ID:         event.ID,
		OwnerID:    event.OwnerID,
		Name:       event.Name,
		BannerURL:  event.BannerURL,
		Visibility: string(event.Visibility),
		EventType:  string(event.EventType),
		Message:    event.Message,
		EventDate:  event.EventDate.Format("2006-01-02"),
		StartTime:  string(event.StartTime),
		EndTime:    string(event.EndTime),
		Location:   event.Location,
		Latitude:   event.Latitude,
		Longitude:  event.Longitude,
		CreatedAt:  event.CreatedAt.Format(time.RFC3339),
		UpdatedAt:  event.UpdatedAt.Format(time.RFC3339),
	}
}

func (uc *EventUseCase) CreateEvent(ctx context.Context, ownerID int64, req dto.CreateEventRequest) (*dto.EventResponse, error) {
	exists, err := uc.eventRepo.ExistsByName(ctx, req.Name)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("event with this name already exists")
	}

	eventDate, err := time.Parse("2006-01-02", req.EventDate)
	if err != nil {
		return nil, err
	}
	if _, err := time.Parse("15:04:05", req.StartTime); err != nil {
		return nil, err
	}
	if _, err := time.Parse("15:04:05", req.EndTime); err != nil {
		return nil, err
	}

	event := &entities.Event{
		OwnerID:    ownerID,
		Name:       req.Name,
		BannerURL:  req.BannerURL,
		Visibility: entities.Visibility(req.Visibility),
		EventType:  entities.EventType(req.EventType),
		Message:    req.Message,
		EventDate:  eventDate,
		StartTime:  entities.TimeOfDay(req.StartTime),
		EndTime:    entities.TimeOfDay(req.EndTime),
		Location:   req.Location,
		Latitude:   req.Latitude,
		Longitude:  req.Longitude,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	if err := event.Validate(); err != nil {
		return nil, err
	}

	if err := uc.eventRepo.Create(ctx, event); err != nil {
		return nil, err
	}

	return uc.toEventResponse(event), nil
}

func (uc *EventUseCase) UpdateEvent(ctx context.Context, ownerID int64, req dto.UpdateEventRequest) (*dto.EventResponse, error) {
	event, err := uc.eventRepo.FindByID(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	if event.OwnerID != ownerID {
		return nil, errors.New("you are not the owner of this event")
	}

	eventDate, err := time.Parse("2006-01-02", req.EventDate)
	if err != nil {
		return nil, err
	}
	if _, err := time.Parse("15:04:05", req.StartTime); err != nil {
		return nil, err
	}
	if _, err := time.Parse("15:04:05", req.EndTime); err != nil {
		return nil, err
	}

	event.Name = req.Name
	event.BannerURL = req.BannerURL
	event.Visibility = entities.Visibility(req.Visibility)
	event.EventType = entities.EventType(req.EventType)
	event.Message = req.Message
	event.EventDate = eventDate
	event.StartTime = entities.TimeOfDay(req.StartTime)
	event.EndTime = entities.TimeOfDay(req.EndTime)
	event.Location = req.Location
	event.Latitude = req.Latitude
	event.Longitude = req.Longitude
	event.UpdatedAt = time.Now()

	if err := event.Validate(); err != nil {
		return nil, err
	}

	if err := uc.eventRepo.Update(ctx, event); err != nil {
		return nil, err
	}

	return uc.toEventResponse(event), nil
}

func (uc *EventUseCase) DeleteEvent(ctx context.Context, id int64, ownerID int64) error {
	event, err := uc.eventRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if event.OwnerID != ownerID {
		return errors.New("you are not the owner of this event")
	}
	return uc.eventRepo.Delete(ctx, event)
}

func (uc *EventUseCase) GetEvent(ctx context.Context, id int64, callerID int64) (*dto.EventResponse, error) {
	event, err := uc.eventRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if event.Visibility == entities.VisibilityPrivate {
		if callerID == 0 {
			return nil, errors.New("forbidden: event is private")
		}
		if event.OwnerID != callerID {
			invited, err := uc.eventInviteRepo.ExistsByEventAndUser(ctx, id, callerID)
			if err != nil || !invited {
				return nil, errors.New("forbidden: you do not have access to this event")
			}
		}
	}
	return uc.toEventResponse(event), nil
}

func (uc *EventUseCase) GetEvents(ctx context.Context, ownerID int64) ([]*dto.EventResponse, error) {
	events, err := uc.eventRepo.FindByOwnerID(ctx, ownerID)
	if err != nil {
		return nil, err
	}
	out := make([]*dto.EventResponse, len(events))
	for i := range events {
		out[i] = uc.toEventResponse(events[i])
	}
	return out, nil
}

func (uc *EventUseCase) GetInvitationEvents(ctx context.Context, userID int64) ([]*dto.EventResponse, error) {
	events, err := uc.eventRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]*dto.EventResponse, len(events))
	for i := range events {
		out[i] = uc.toEventResponse(events[i])
	}
	return out, nil
}

// ListPublicEvents returns public events for discovery (no auth). search is optional; limit/offset for pagination.
func (uc *EventUseCase) ListPublicEvents(ctx context.Context, search string, limit, offset int) ([]*dto.EventResponse, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	events, err := uc.eventRepo.ListPublic(ctx, search, limit, offset)
	if err != nil {
		return nil, err
	}
	out := make([]*dto.EventResponse, len(events))
	for i := range events {
		out[i] = uc.toEventResponse(events[i])
	}
	return out, nil
}

// GetMyInvite returns the current user's invite for an event. Returns nil, err if not invited.
func (uc *EventUseCase) GetMyInvite(ctx context.Context, userID int64, eventID int64) (*dto.EventInviteResponse, error) {
	if userID == 0 {
		return nil, errors.New("unauthorized")
	}
	invite, err := uc.eventInviteRepo.FindByEventAndUser(ctx, eventID, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("not found")
		}
		return nil, err
	}
	if invite == nil {
		return nil, errors.New("not found")
	}
	return &dto.EventInviteResponse{
		ID:        invite.ID,
		EventID:   invite.EventID,
		UserID:    invite.UserID,
		Email:     invite.Email,
		Status:    invite.Status,
		CreatedAt: invite.CreatedAt.Format(time.RFC3339),
	}, nil
}

// RespondToInvite lets an invited user set their RSVP status (confirmed or declined).
func (uc *EventUseCase) RespondToInvite(ctx context.Context, userID int64, eventID int64, status string) (*dto.EventInviteResponse, error) {
	if userID == 0 {
		return nil, errors.New("unauthorized")
	}
	if status != "confirmed" && status != "declined" {
		return nil, errors.New("status must be confirmed or declined")
	}
	invite, err := uc.eventInviteRepo.FindByEventAndUser(ctx, eventID, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("not found")
		}
		return nil, err
	}
	if invite == nil {
		return nil, errors.New("not found")
	}
	invite.Status = status
	invite.UpdatedAt = time.Now()
	if err := uc.eventInviteRepo.Update(ctx, invite); err != nil {
		return nil, err
	}
	return &dto.EventInviteResponse{
		ID:        invite.ID,
		EventID:   invite.EventID,
		UserID:    invite.UserID,
		Email:     invite.Email,
		Status:    invite.Status,
		CreatedAt: invite.CreatedAt.Format(time.RFC3339),
	}, nil
}

// InviteUserToEvent invites a user (by email) to an event. Only the event owner can invite.
func (uc *EventUseCase) InviteUserToEvent(ctx context.Context, ownerID, eventID int64, email string) (*dto.EventInviteResponse, error) {
	event, err := uc.eventRepo.FindByID(ctx, eventID)
	if err != nil {
		return nil, err
	}
	if event.OwnerID != ownerID {
		return nil, errors.New("you are not the owner of this event")
	}
	if email == "" {
		return nil, errors.New("email is required")
	}

	user, err := uc.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, errors.New("no user found with this email")
	}

	exists, err := uc.eventInviteRepo.ExistsByEventAndUser(ctx, eventID, user.ID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("user is already invited to this event")
	}

	invite := &entities.EventInvite{
		EventID:   eventID,
		UserID:    user.ID,
		Email:     user.Email,
		Status:    "pending",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	if err := invite.Validate(); err != nil {
		return nil, err
	}
	if err := uc.eventInviteRepo.Create(ctx, invite); err != nil {
		return nil, err
	}

	return &dto.EventInviteResponse{
		ID:        invite.ID,
		EventID:   invite.EventID,
		UserID:    invite.UserID,
		Email:     invite.Email,
		Status:    invite.Status,
		CreatedAt: invite.CreatedAt.Format(time.RFC3339),
	}, nil
}

// ListEventInvites returns invites for an event. Only the event owner can list.
func (uc *EventUseCase) ListEventInvites(ctx context.Context, ownerID, eventID int64) ([]*dto.EventInviteResponse, error) {
	event, err := uc.eventRepo.FindByID(ctx, eventID)
	if err != nil {
		return nil, err
	}
	if event.OwnerID != ownerID {
		return nil, errors.New("you are not the owner of this event")
	}

	invites, err := uc.eventInviteRepo.ListByEventID(ctx, eventID)
	if err != nil {
		return nil, err
	}
	out := make([]*dto.EventInviteResponse, len(invites))
	for i := range invites {
		out[i] = &dto.EventInviteResponse{
			ID:        invites[i].ID,
			EventID:   invites[i].EventID,
			UserID:    invites[i].UserID,
			Email:     invites[i].Email,
			Status:    invites[i].Status,
			CreatedAt: invites[i].CreatedAt.Format(time.RFC3339),
		}
	}
	return out, nil
}