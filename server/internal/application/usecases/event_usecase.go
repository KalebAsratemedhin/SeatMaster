package usecases

import (
	"context"
	"errors"
	"strconv"
	"time"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/dto"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/repositories"
)

type EventUseCase struct {
	eventRepo       repositories.EventRepository
	eventInviteRepo repositories.EventInviteRepository
	eventTableRepo  repositories.EventTableRepository
	eventSeatRepo   repositories.EventSeatRepository
	userRepo        repositories.UserRepository
}

func NewEventUseCase(
	eventRepo repositories.EventRepository,
	eventInviteRepo repositories.EventInviteRepository,
	eventTableRepo repositories.EventTableRepository,
	eventSeatRepo repositories.EventSeatRepository,
	userRepo repositories.UserRepository,
) *EventUseCase {
	return &EventUseCase{
		eventRepo:       eventRepo,
		eventInviteRepo: eventInviteRepo,
		eventTableRepo:  eventTableRepo,
		eventSeatRepo:   eventSeatRepo,
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

func (uc *EventUseCase) GetEventsPaginated(ctx context.Context, ownerID int64, limit, offset int) (*dto.PaginatedEventsResponse, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	events, total, err := uc.eventRepo.FindByOwnerIDPaginated(ctx, ownerID, limit, offset)
	if err != nil {
		return nil, err
	}
	out := make([]*dto.EventResponse, len(events))
	for i := range events {
		out[i] = uc.toEventResponse(events[i])
	}
	return &dto.PaginatedEventsResponse{Items: out, Total: total}, nil
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

// GetMyInvitations returns events the user is invited to, with invite (id + status) for each.
func (uc *EventUseCase) GetMyInvitations(ctx context.Context, userID int64) ([]*dto.InvitationWithEventResponse, error) {
	invites, err := uc.eventInviteRepo.ListByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return uc.invitesToInvitationResponses(ctx, invites), nil
}

// GetMyInvitationsPaginated returns paginated invitations for the user.
func (uc *EventUseCase) GetMyInvitationsPaginated(ctx context.Context, userID int64, limit, offset int) (*dto.PaginatedInvitationsResponse, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	invites, total, err := uc.eventInviteRepo.ListByUserIDPaginated(ctx, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	items := uc.invitesToInvitationResponses(ctx, invites)
	return &dto.PaginatedInvitationsResponse{Items: items, Total: total}, nil
}

func (uc *EventUseCase) invitesToInvitationResponses(ctx context.Context, invites []*entities.EventInvite) []*dto.InvitationWithEventResponse {
	out := make([]*dto.InvitationWithEventResponse, 0, len(invites))
	for _, inv := range invites {
		event, err := uc.eventRepo.FindByID(ctx, inv.EventID)
		if err != nil {
			continue
		}
		out = append(out, &dto.InvitationWithEventResponse{
			Event: *uc.toEventResponse(event),
			Invite: dto.EventInviteResponse{
				ID:        inv.ID,
				EventID:   inv.EventID,
				UserID:    inv.UserID,
				Email:     inv.Email,
				Status:    inv.Status,
				SeatID:    inv.SeatID,
				CreatedAt: inv.CreatedAt.Format(time.RFC3339),
			},
		})
	}
	return out
}

// RespondToInvite updates the current user's RSVP status for an event (confirmed or declined). Optionally assigns seat when confirming.
// For public events, if the user has no invite yet, one is created so they can RSVP.
func (uc *EventUseCase) RespondToInvite(ctx context.Context, userID int64, eventID int64, status string, seatID *int64) (*dto.EventInviteResponse, error) {
	if status != "confirmed" && status != "declined" {
		return nil, errors.New("status must be confirmed or declined")
	}
	event, err := uc.eventRepo.FindByID(ctx, eventID)
	if err != nil {
		return nil, errors.New("event not found")
	}
	invite, err := uc.eventInviteRepo.FindByEventAndUser(ctx, eventID, userID)
	if err != nil {
		if event.Visibility != entities.VisibilityPublic {
			return nil, errors.New("invitation not found")
		}
		user, errUser := uc.userRepo.FindByID(ctx, userID)
		if errUser != nil {
			return nil, errors.New("user not found")
		}
		invite = &entities.EventInvite{
			EventID:   eventID,
			UserID:    userID,
			Email:     user.Email,
			Status:    status,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		if seatID != nil && *seatID > 0 {
			seat, errSeat := uc.eventSeatRepo.FindByID(ctx, *seatID)
			if errSeat == nil {
				table, _ := uc.eventTableRepo.FindByID(ctx, seat.EventTableID)
				if table != nil && table.EventID == eventID {
					invite.SeatID = seatID
				}
			}
		}
		if errCreate := uc.eventInviteRepo.Create(ctx, invite); errCreate != nil {
			return nil, errCreate
		}
		return uc.toEventInviteResponse(invite), nil
	}
	invite.Status = status
	if status == "declined" {
		invite.SeatID = nil
	} else if seatID != nil && *seatID > 0 {
		seat, err := uc.eventSeatRepo.FindByID(ctx, *seatID)
		if err != nil {
			return nil, errors.New("seat not found")
		}
		table, err := uc.eventTableRepo.FindByID(ctx, seat.EventTableID)
		if err != nil || table.EventID != eventID {
			return nil, errors.New("seat does not belong to this event")
		}
		invite.SeatID = seatID
	}
	invite.UpdatedAt = time.Now()
	if err := uc.eventInviteRepo.Update(ctx, invite); err != nil {
		return nil, err
	}
	return uc.toEventInviteResponse(invite), nil
}

func (uc *EventUseCase) toEventInviteResponse(inv *entities.EventInvite) *dto.EventInviteResponse {
	return &dto.EventInviteResponse{
		ID:        inv.ID,
		EventID:   inv.EventID,
		UserID:    inv.UserID,
		Email:     inv.Email,
		Status:    inv.Status,
		SeatID:    inv.SeatID,
		CreatedAt: inv.CreatedAt.Format(time.RFC3339),
	}
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
		out[i] = uc.toEventInviteResponse(invites[i])
	}
	return out, nil
}

// ListEventInvitesPaginated returns paginated invites for an event. Only the event owner can list.
func (uc *EventUseCase) ListEventInvitesPaginated(ctx context.Context, ownerID, eventID int64, limit, offset int) (*dto.PaginatedInvitesResponse, error) {
	event, err := uc.eventRepo.FindByID(ctx, eventID)
	if err != nil {
		return nil, err
	}
	if event.OwnerID != ownerID {
		return nil, errors.New("you are not the owner of this event")
	}
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	invites, total, err := uc.eventInviteRepo.ListByEventIDPaginated(ctx, eventID, limit, offset)
	if err != nil {
		return nil, err
	}
	out := make([]*dto.EventInviteResponse, len(invites))
	for i := range invites {
		out[i] = uc.toEventInviteResponse(invites[i])
	}
	return &dto.PaginatedInvitesResponse{Items: out, Total: total}, nil
}

// CreateEventTable creates a table and capacity seats for an event. Owner only.
func (uc *EventUseCase) CreateEventTable(ctx context.Context, ownerID, eventID int64, req dto.CreateEventTableRequest) (*dto.EventTableResponse, error) {
	event, err := uc.eventRepo.FindByID(ctx, eventID)
	if err != nil {
		return nil, err
	}
	if event.OwnerID != ownerID {
		return nil, errors.New("you are not the owner of this event")
	}
	shape := req.Shape
	if shape != "rectangular" && shape != "grid" {
		shape = "round"
	}
	capacity := req.Capacity
	var tableRows, tableCols *int
	if shape == "grid" {
		if req.Rows == nil || req.Columns == nil || *req.Rows < 1 || *req.Columns < 1 {
			return nil, errors.New("rows and columns are required for sitting area (min 1 each)")
		}
		if *req.Rows > 100 || *req.Columns > 100 {
			return nil, errors.New("rows and columns must be at most 100 each")
		}
		capacity = *req.Rows * *req.Columns
		tableRows = req.Rows
		tableCols = req.Columns
	} else {
		if req.Capacity < 1 || req.Capacity > 50 {
			return nil, errors.New("capacity must be between 1 and 50")
		}
		capacity = req.Capacity
	}
	tables, _ := uc.eventTableRepo.ListByEventID(ctx, eventID)
	displayOrder := len(tables)
	var tableNumber, sittingAreaNumber int
	for _, tbl := range tables {
		if tbl.Shape == "grid" {
			sittingAreaNumber++
		} else {
			tableNumber++
		}
	}
	var name string
	if shape == "grid" {
		name = "Sitting area " + strconv.Itoa(sittingAreaNumber+1)
	} else {
		name = "Table " + strconv.Itoa(tableNumber+1)
	}
	// Default position: stagger new tables/sitting areas on the floor
	posX := 20.0 + float64(displayOrder%4)*22.0
	posY := 25.0 + float64(displayOrder/4)*25.0
	t := &entities.EventTable{
		EventID:      eventID,
		Name:         name,
		Shape:        shape,
		TableRows:    tableRows,
		TableColumns: tableCols,
		Capacity:     capacity,
		DisplayOrder: displayOrder,
		PositionX:    posX,
		PositionY:    posY,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	if err := uc.eventTableRepo.Create(ctx, t); err != nil {
		return nil, err
	}
	seats := make([]*entities.EventSeat, capacity)
	for i := 0; i < capacity; i++ {
		seats[i] = &entities.EventSeat{
			EventTableID: t.ID,
			Label:        strconv.Itoa(i + 1),
			DisplayOrder: i,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}
	}
	if err := uc.eventSeatRepo.CreateBulk(ctx, seats); err != nil {
		_ = uc.eventTableRepo.Delete(ctx, t)
		return nil, err
	}
	return uc.buildEventTableResponse(ctx, t, seats, nil), nil
}

// ListEventSeating returns tables with seats and which invite (if any) is assigned to each seat. Caller must be owner or invited guest.
func (uc *EventUseCase) ListEventSeating(ctx context.Context, eventID int64, callerID int64) ([]*dto.EventTableResponse, error) {
	event, err := uc.eventRepo.FindByID(ctx, eventID)
	if err != nil {
		return nil, err
	}
	canAccess := event.OwnerID == callerID || event.Visibility == entities.VisibilityPublic
	if !canAccess && callerID != 0 {
		invited, _ := uc.eventInviteRepo.ExistsByEventAndUser(ctx, eventID, callerID)
		canAccess = invited
	}
	if !canAccess {
		return nil, errors.New("forbidden: you do not have access to this event")
	}
	tables, err := uc.eventTableRepo.ListByEventID(ctx, eventID)
	if err != nil {
		return nil, err
	}
	invites, _ := uc.eventInviteRepo.ListByEventID(ctx, eventID)
	seatToInvite := make(map[int64]int64)
	for _, inv := range invites {
		if inv.SeatID != nil {
			seatToInvite[*inv.SeatID] = inv.ID
		}
	}
	out := make([]*dto.EventTableResponse, 0, len(tables))
	for _, t := range tables {
		seats, _ := uc.eventSeatRepo.ListByEventTableID(ctx, t.ID)
		out = append(out, uc.buildEventTableResponse(ctx, t, seats, seatToInvite))
	}
	return out, nil
}

func (uc *EventUseCase) buildEventTableResponse(ctx context.Context, t *entities.EventTable, seats []*entities.EventSeat, seatToInvite map[int64]int64) *dto.EventTableResponse {
	if seatToInvite == nil {
		seatToInvite = make(map[int64]int64)
	}
	seatResp := make([]*dto.EventSeatResponse, len(seats))
	for i := range seats {
		var inviteID *int64
		if id, ok := seatToInvite[seats[i].ID]; ok {
			inviteID = &id
		}
		seatResp[i] = &dto.EventSeatResponse{
			ID:           seats[i].ID,
			EventTableID: seats[i].EventTableID,
			Label:        seats[i].Label,
			DisplayOrder: seats[i].DisplayOrder,
			InviteID:     inviteID,
		}
	}
	shape := t.Shape
	if shape != "rectangular" && shape != "grid" {
		shape = "round"
	}
	return &dto.EventTableResponse{
		ID:           t.ID,
		EventID:      t.EventID,
		Name:         t.Name,
		Shape:        shape,
		Rows:         t.TableRows,
		Columns:      t.TableColumns,
		Capacity:     t.Capacity,
		DisplayOrder: t.DisplayOrder,
		PositionX:    t.PositionX,
		PositionY:    t.PositionY,
		Seats:        seatResp,
	}
}

// UpdateEventTable updates a table. Owner only. Changing capacity does not add/remove seats (future enhancement).
func (uc *EventUseCase) UpdateEventTable(ctx context.Context, ownerID, eventID, tableID int64, req dto.UpdateEventTableRequest) (*dto.EventTableResponse, error) {
	event, err := uc.eventRepo.FindByID(ctx, eventID)
	if err != nil {
		return nil, err
	}
	if event.OwnerID != ownerID {
		return nil, errors.New("you are not the owner of this event")
	}
	t, err := uc.eventTableRepo.FindByID(ctx, tableID)
	if err != nil {
		return nil, err
	}
	if t.EventID != eventID {
		return nil, errors.New("table does not belong to this event")
	}
	if req.Shape == "rectangular" || req.Shape == "round" || req.Shape == "grid" {
		t.Shape = req.Shape
		if req.Shape == "grid" && req.Rows != nil && req.Columns != nil && *req.Rows > 0 && *req.Columns > 0 {
			cap := *req.Rows * *req.Columns
			if cap <= 50 {
				t.TableRows = req.Rows
				t.TableColumns = req.Columns
				t.Capacity = cap
			}
		}
	}
	if req.Capacity > 0 && t.Shape != "grid" {
		t.Capacity = req.Capacity
	}
	if req.PositionX != nil {
		x := *req.PositionX
		if x < 0 {
			x = 0
		}
		if x > 100 {
			x = 100
		}
		t.PositionX = x
	}
	if req.PositionY != nil {
		y := *req.PositionY
		if y < 0 {
			y = 0
		}
		if y > 100 {
			y = 100
		}
		t.PositionY = y
	}
	if req.DisplayOrder >= 0 {
		t.DisplayOrder = req.DisplayOrder
	}
	t.UpdatedAt = time.Now()
	if err := uc.eventTableRepo.Update(ctx, t); err != nil {
		return nil, err
	}
	seats, _ := uc.eventSeatRepo.ListByEventTableID(ctx, t.ID)
	invites, _ := uc.eventInviteRepo.ListByEventID(ctx, eventID)
	seatToInvite := make(map[int64]int64)
	for _, inv := range invites {
		if inv.SeatID != nil {
			seatToInvite[*inv.SeatID] = inv.ID
		}
	}
	return uc.buildEventTableResponse(ctx, t, seats, seatToInvite), nil
}

// ReorderEventTables updates display_order of tables to match the given order. Owner only.
func (uc *EventUseCase) ReorderEventTables(ctx context.Context, ownerID, eventID int64, orderedTableIDs []int64) error {
	event, err := uc.eventRepo.FindByID(ctx, eventID)
	if err != nil {
		return err
	}
	if event.OwnerID != ownerID {
		return errors.New("you are not the owner of this event")
	}
	tables, err := uc.eventTableRepo.ListByEventID(ctx, eventID)
	if err != nil {
		return err
	}
	if len(orderedTableIDs) != len(tables) {
		return errors.New("table order must include all tables exactly once")
	}
	idToTable := make(map[int64]*entities.EventTable)
	for _, t := range tables {
		idToTable[t.ID] = t
	}
	for i, id := range orderedTableIDs {
		t, ok := idToTable[id]
		if !ok {
			return errors.New("invalid table id in order")
		}
		t.DisplayOrder = i
		t.UpdatedAt = time.Now()
		if err := uc.eventTableRepo.Update(ctx, t); err != nil {
			return err
		}
	}
	return nil
}

// DeleteEventTable deletes a table and its seats. Owner only.
func (uc *EventUseCase) DeleteEventTable(ctx context.Context, ownerID, eventID, tableID int64) error {
	event, err := uc.eventRepo.FindByID(ctx, eventID)
	if err != nil {
		return err
	}
	if event.OwnerID != ownerID {
		return errors.New("you are not the owner of this event")
	}
	t, err := uc.eventTableRepo.FindByID(ctx, tableID)
	if err != nil {
		return err
	}
	if t.EventID != eventID {
		return errors.New("table does not belong to this event")
	}
	_ = uc.eventSeatRepo.DeleteByTableID(ctx, tableID)
	return uc.eventTableRepo.Delete(ctx, t)
}