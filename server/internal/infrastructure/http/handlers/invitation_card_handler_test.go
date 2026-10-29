package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/dto"
	"github.com/KalebAsratemedhin/seatmaster/internal/application/usecases"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/http/middleware"
	"github.com/gorilla/mux"
)

// Minimal fakes duplicated for handler package (usecase tests live separately).

type handlerFakeEventRepo struct {
	event *entities.Event
}

func (f *handlerFakeEventRepo) Create(ctx context.Context, event *entities.Event) error { return nil }
func (f *handlerFakeEventRepo) FindByID(ctx context.Context, id string) (*entities.Event, error) {
	if f.event == nil || f.event.ID != id {
		return nil, errors.New("record not found")
	}
	return f.event, nil
}
func (f *handlerFakeEventRepo) FindByOwnerID(ctx context.Context, ownerID string) ([]*entities.Event, error) {
	return nil, nil
}
func (f *handlerFakeEventRepo) FindByOwnerIDPaginated(ctx context.Context, ownerID string, limit, offset int) ([]*entities.Event, int64, error) {
	return nil, 0, nil
}
func (f *handlerFakeEventRepo) FindByUserID(ctx context.Context, userID string) ([]*entities.Event, error) {
	return nil, nil
}
func (f *handlerFakeEventRepo) FindByUserIDPaginated(ctx context.Context, userID string, limit, offset int) ([]*entities.Event, int64, error) {
	return nil, 0, nil
}
func (f *handlerFakeEventRepo) FindByEmail(ctx context.Context, email string) (*entities.Event, error) {
	return nil, nil
}
func (f *handlerFakeEventRepo) ExistsByID(ctx context.Context, id string) (bool, error) {
	return false, nil
}
func (f *handlerFakeEventRepo) ExistsByOwnerID(ctx context.Context, ownerID string) (bool, error) {
	return false, nil
}
func (f *handlerFakeEventRepo) ExistsByUserID(ctx context.Context, userID string) (bool, error) {
	return false, nil
}
func (f *handlerFakeEventRepo) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	return false, nil
}
func (f *handlerFakeEventRepo) ExistsByName(ctx context.Context, name string) (bool, error) {
	return false, nil
}
func (f *handlerFakeEventRepo) Delete(ctx context.Context, event *entities.Event) error { return nil }
func (f *handlerFakeEventRepo) Update(ctx context.Context, event *entities.Event) error  { return nil }
func (f *handlerFakeEventRepo) ListPublic(ctx context.Context, search string, limit, offset int) ([]*entities.Event, error) {
	return nil, nil
}

type handlerFakeCardRepo struct {
	byEvent map[string]*entities.EventInvitationCard
}

func (f *handlerFakeCardRepo) FindByEventID(ctx context.Context, eventID string) (*entities.EventInvitationCard, error) {
	c, ok := f.byEvent[eventID]
	if !ok {
		return nil, nil
	}
	cp := *c
	return &cp, nil
}
func (f *handlerFakeCardRepo) Create(ctx context.Context, card *entities.EventInvitationCard) error {
	if card.ID == "" {
		card.ID = "card-1"
	}
	cp := *card
	f.byEvent[card.EventID] = &cp
	return nil
}
func (f *handlerFakeCardRepo) Update(ctx context.Context, card *entities.EventInvitationCard) error {
	cp := *card
	f.byEvent[card.EventID] = &cp
	return nil
}
func (f *handlerFakeCardRepo) DeleteByEventID(ctx context.Context, eventID string) (bool, error) {
	if _, ok := f.byEvent[eventID]; !ok {
		return false, nil
	}
	delete(f.byEvent, eventID)
	return true, nil
}

func (f *handlerFakeCardRepo) PreviewURLsByEventIDs(ctx context.Context, eventIDs []string) (map[string]string, error) {
	out := make(map[string]string)
	for _, id := range eventIDs {
		if c, ok := f.byEvent[id]; ok && c.PreviewURL != nil && *c.PreviewURL != "" {
			out[id] = *c.PreviewURL
		}
	}
	return out, nil
}

func withUser(r *http.Request, userID string) *http.Request {
	ctx := context.WithValue(r.Context(), middleware.UserIDKey, userID)
	return r.WithContext(ctx)
}

func TestInvitationCardHandler_OwnerNonOwnerAndUpsert(t *testing.T) {
	eventID := "11111111-1111-1111-1111-111111111111"
	event := &entities.Event{ID: eventID, OwnerID: "owner-1", Name: "E", Visibility: entities.VisibilityPrivate}
	cards := &handlerFakeCardRepo{byEvent: map[string]*entities.EventInvitationCard{}}
	_ = cards.Create(context.Background(), &entities.EventInvitationCard{
		ID: "c1", EventID: eventID, TemplateID: "formal_gold", Published: false,
		ShowBanner: true, CreatedAt: time.Now(), UpdatedAt: time.Now(),
	})
	uc := usecases.NewInvitationCardUseCase(&handlerFakeEventRepo{event: event}, cards)
	h := NewInvitationCardHandler(uc)

	// Owner GET unpublished → 200
	req := mux.SetURLVars(httptest.NewRequest(http.MethodGet, "/api/v1/events/"+eventID+"/invitation-card", nil), map[string]string{"id": eventID})
	req = withUser(req, "owner-1")
	rr := httptest.NewRecorder()
	h.Get(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("owner get: %d %s", rr.Code, rr.Body.String())
	}

	// Anon GET unpublished → 404
	req = mux.SetURLVars(httptest.NewRequest(http.MethodGet, "/api/v1/events/"+eventID+"/invitation-card", nil), map[string]string{"id": eventID})
	rr = httptest.NewRecorder()
	h.Get(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Fatalf("anon unpublished: %d", rr.Code)
	}
	var errBody map[string]string
	_ = json.Unmarshal(rr.Body.Bytes(), &errBody)
	if errBody["error"] != "invitation_card_not_found" {
		t.Fatalf("error code: %v", errBody)
	}

	// Non-owner PUT → 403
	body, _ := json.Marshal(dto.UpsertInvitationCardRequest{TemplateID: "x", ShowBanner: true})
	req = mux.SetURLVars(httptest.NewRequest(http.MethodPut, "/api/v1/events/"+eventID+"/invitation-card", bytes.NewReader(body)), map[string]string{"id": eventID})
	req = withUser(req, "other")
	rr = httptest.NewRecorder()
	h.Upsert(rr, req)
	if rr.Code != http.StatusForbidden {
		t.Fatalf("non-owner put: %d %s", rr.Code, rr.Body.String())
	}

	// Owner PUT publish → 200
	body, _ = json.Marshal(dto.UpsertInvitationCardRequest{TemplateID: "formal_gold", ShowBanner: true, Published: true})
	req = mux.SetURLVars(httptest.NewRequest(http.MethodPut, "/api/v1/events/"+eventID+"/invitation-card", bytes.NewReader(body)), map[string]string{"id": eventID})
	req = withUser(req, "owner-1")
	rr = httptest.NewRecorder()
	h.Upsert(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("owner put: %d %s", rr.Code, rr.Body.String())
	}

	// Anon GET published → 200
	req = mux.SetURLVars(httptest.NewRequest(http.MethodGet, "/api/v1/events/"+eventID+"/invitation-card", nil), map[string]string{"id": eventID})
	rr = httptest.NewRecorder()
	h.Get(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("anon published: %d", rr.Code)
	}

	// Owner DELETE → 204
	req = mux.SetURLVars(httptest.NewRequest(http.MethodDelete, "/api/v1/events/"+eventID+"/invitation-card", nil), map[string]string{"id": eventID})
	req = withUser(req, "owner-1")
	rr = httptest.NewRecorder()
	h.Delete(rr, req)
	if rr.Code != http.StatusNoContent {
		t.Fatalf("delete: %d", rr.Code)
	}
}
