package usecases

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/dto"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
)

type fakeEventRepo struct {
	event *entities.Event
	err   error
}

func (f *fakeEventRepo) Create(ctx context.Context, event *entities.Event) error { return nil }
func (f *fakeEventRepo) FindByID(ctx context.Context, id string) (*entities.Event, error) {
	if f.err != nil {
		return nil, f.err
	}
	if f.event == nil || f.event.ID != id {
		return nil, errors.New("record not found")
	}
	return f.event, nil
}
func (f *fakeEventRepo) FindByOwnerID(ctx context.Context, ownerID string) ([]*entities.Event, error) {
	return nil, nil
}
func (f *fakeEventRepo) FindByOwnerIDPaginated(ctx context.Context, ownerID string, limit, offset int) ([]*entities.Event, int64, error) {
	return nil, 0, nil
}
func (f *fakeEventRepo) FindByUserID(ctx context.Context, userID string) ([]*entities.Event, error) {
	return nil, nil
}
func (f *fakeEventRepo) FindByUserIDPaginated(ctx context.Context, userID string, limit, offset int) ([]*entities.Event, int64, error) {
	return nil, 0, nil
}
func (f *fakeEventRepo) FindByEmail(ctx context.Context, email string) (*entities.Event, error) {
	return nil, nil
}
func (f *fakeEventRepo) ExistsByID(ctx context.Context, id string) (bool, error) { return false, nil }
func (f *fakeEventRepo) ExistsByOwnerID(ctx context.Context, ownerID string) (bool, error) {
	return false, nil
}
func (f *fakeEventRepo) ExistsByUserID(ctx context.Context, userID string) (bool, error) {
	return false, nil
}
func (f *fakeEventRepo) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	return false, nil
}
func (f *fakeEventRepo) ExistsByName(ctx context.Context, name string) (bool, error) {
	return false, nil
}
func (f *fakeEventRepo) Delete(ctx context.Context, event *entities.Event) error { return nil }
func (f *fakeEventRepo) Update(ctx context.Context, event *entities.Event) error { return nil }
func (f *fakeEventRepo) ListPublic(ctx context.Context, search string, limit, offset int) ([]*entities.Event, error) {
	return nil, nil
}

type fakeCardRepo struct {
	byEvent map[string]*entities.EventInvitationCard
}

func newFakeCardRepo() *fakeCardRepo {
	return &fakeCardRepo{byEvent: map[string]*entities.EventInvitationCard{}}
}

func (f *fakeCardRepo) FindByEventID(ctx context.Context, eventID string) (*entities.EventInvitationCard, error) {
	c, ok := f.byEvent[eventID]
	if !ok {
		return nil, nil
	}
	cp := *c
	if c.Document != nil {
		cp.Document = append(entities.JSONB(nil), c.Document...)
	}
	return &cp, nil
}

func (f *fakeCardRepo) Create(ctx context.Context, card *entities.EventInvitationCard) error {
	if card.ID == "" {
		card.ID = "card-1"
	}
	cp := *card
	if card.Document != nil {
		cp.Document = append(entities.JSONB(nil), card.Document...)
	}
	f.byEvent[card.EventID] = &cp
	return nil
}

func (f *fakeCardRepo) Update(ctx context.Context, card *entities.EventInvitationCard) error {
	cp := *card
	if card.Document != nil {
		cp.Document = append(entities.JSONB(nil), card.Document...)
	} else {
		cp.Document = nil
	}
	f.byEvent[card.EventID] = &cp
	return nil
}

func (f *fakeCardRepo) DeleteByEventID(ctx context.Context, eventID string) (bool, error) {
	if _, ok := f.byEvent[eventID]; !ok {
		return false, nil
	}
	delete(f.byEvent, eventID)
	return true, nil
}

func (f *fakeCardRepo) PreviewURLsByEventIDs(ctx context.Context, eventIDs []string) (map[string]string, error) {
	out := make(map[string]string)
	for _, id := range eventIDs {
		if c, ok := f.byEvent[id]; ok && c.PreviewURL != nil && *c.PreviewURL != "" {
			out[id] = *c.PreviewURL
		}
	}
	return out, nil
}

func testEvent(ownerID string) *entities.Event {
	return &entities.Event{
		ID:        "11111111-1111-1111-1111-111111111111",
		OwnerID:   ownerID,
		Name:      "Wedding",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

func TestInvitationCard_Get_OwnerSeesUnpublished(t *testing.T) {
	event := testEvent("owner-1")
	cards := newFakeCardRepo()
	_ = cards.Create(context.Background(), &entities.EventInvitationCard{
		ID:         "c1",
		EventID:    event.ID,
		TemplateID: "formal_gold",
		Published:  false,
		ShowBanner: true,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	})
	uc := NewInvitationCardUseCase(&fakeEventRepo{event: event}, cards)

	resp, err := uc.Get(context.Background(), event.ID, "owner-1")
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if resp.Published {
		t.Fatal("expected unpublished")
	}
}

func TestInvitationCard_Get_NonOwnerUnpublished404(t *testing.T) {
	event := testEvent("owner-1")
	event.Visibility = entities.VisibilityPrivate
	cards := newFakeCardRepo()
	_ = cards.Create(context.Background(), &entities.EventInvitationCard{
		ID:         "c1",
		EventID:    event.ID,
		TemplateID: "formal_gold",
		Published:  false,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	})
	uc := NewInvitationCardUseCase(&fakeEventRepo{event: event}, cards)

	_, err := uc.Get(context.Background(), event.ID, "other-user")
	if !errors.Is(err, ErrInvitationCardNotFound) {
		t.Fatalf("want invitation_card_not_found, got %v", err)
	}

	_, err = uc.Get(context.Background(), event.ID, "")
	if !errors.Is(err, ErrInvitationCardNotFound) {
		t.Fatalf("anon want invitation_card_not_found, got %v", err)
	}
}

func TestInvitationCard_Get_PublishedPublic(t *testing.T) {
	event := testEvent("owner-1")
	cards := newFakeCardRepo()
	_ = cards.Create(context.Background(), &entities.EventInvitationCard{
		ID:         "c1",
		EventID:    event.ID,
		TemplateID: "modern_minimal",
		Published:  true,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	})
	uc := NewInvitationCardUseCase(&fakeEventRepo{event: event}, cards)

	resp, err := uc.Get(context.Background(), event.ID, "")
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if resp.TemplateID != "modern_minimal" {
		t.Fatalf("template: %s", resp.TemplateID)
	}
}

func TestInvitationCard_Upsert_IdempotentAndOwnerOnly(t *testing.T) {
	event := testEvent("owner-1")
	cards := newFakeCardRepo()
	uc := NewInvitationCardUseCase(&fakeEventRepo{event: event}, cards)
	ctx := context.Background()

	req := dto.UpsertInvitationCardRequest{
		TemplateID: "formal_gold",
		ShowBanner: true,
		Published:  false,
	}
	_, err := uc.Upsert(ctx, event.ID, "other", req)
	if !errors.Is(err, ErrInvitationCardForbidden) {
		t.Fatalf("want forbidden, got %v", err)
	}

	first, err := uc.Upsert(ctx, event.ID, "owner-1", req)
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	headline := "Our Day"
	req.Headline = &headline
	req.Published = true
	second, err := uc.Upsert(ctx, event.ID, "owner-1", req)
	if err != nil {
		t.Fatalf("update: %v", err)
	}
	if first.ID != second.ID {
		t.Fatalf("upsert should keep same id: %s vs %s", first.ID, second.ID)
	}
	if second.Headline == nil || *second.Headline != "Our Day" || !second.Published {
		t.Fatalf("update not applied: %+v", second)
	}
	if len(cards.byEvent) != 1 {
		t.Fatalf("expected 1 row, got %d", len(cards.byEvent))
	}
}

func TestInvitationCard_Upsert_Validation(t *testing.T) {
	event := testEvent("owner-1")
	uc := NewInvitationCardUseCase(&fakeEventRepo{event: event}, newFakeCardRepo())
	_, err := uc.Upsert(context.Background(), event.ID, "owner-1", dto.UpsertInvitationCardRequest{})
	if err == nil || err.Error() != "validation_error: template_id is required" {
		t.Fatalf("want template validation, got %v", err)
	}
}

func TestInvitationCard_Delete_Owner(t *testing.T) {
	event := testEvent("owner-1")
	cards := newFakeCardRepo()
	_ = cards.Create(context.Background(), &entities.EventInvitationCard{
		ID: "c1", EventID: event.ID, TemplateID: "x", CreatedAt: time.Now(), UpdatedAt: time.Now(),
	})
	uc := NewInvitationCardUseCase(&fakeEventRepo{event: event}, cards)

	if err := uc.Delete(context.Background(), event.ID, "other"); !errors.Is(err, ErrInvitationCardForbidden) {
		t.Fatalf("want forbidden, got %v", err)
	}
	if err := uc.Delete(context.Background(), event.ID, "owner-1"); err != nil {
		t.Fatalf("delete: %v", err)
	}
	if err := uc.Delete(context.Background(), event.ID, "owner-1"); !errors.Is(err, ErrInvitationCardNotFound) {
		t.Fatalf("second delete want not found, got %v", err)
	}
}

func TestInvitationCard_Get_MissingCard(t *testing.T) {
	event := testEvent("owner-1")
	uc := NewInvitationCardUseCase(&fakeEventRepo{event: event}, newFakeCardRepo())
	_, err := uc.Get(context.Background(), event.ID, "owner-1")
	if !errors.Is(err, ErrInvitationCardNotFound) {
		t.Fatalf("want not found, got %v", err)
	}
}

func validCanvasDocument() json.RawMessage {
	return json.RawMessage(`{"version":1,"width":1080,"height":1528,"background":"#fff","elements":[]}`)
}

func TestInvitationCard_Document_RoundTripAndOmitVsNull(t *testing.T) {
	event := testEvent("owner-1")
	cards := newFakeCardRepo()
	uc := NewInvitationCardUseCase(&fakeEventRepo{event: event}, cards)
	ctx := context.Background()

	created, err := uc.Upsert(ctx, event.ID, "owner-1", dto.UpsertInvitationCardRequest{
		TemplateID: "canvas_v1",
		ShowBanner: false,
		Document:   validCanvasDocument(),
	})
	if err != nil {
		t.Fatalf("create with document: %v", err)
	}
	if created.Document == nil || !strings.Contains(string(created.Document), `"version":1`) {
		t.Fatalf("document missing on create: %s", created.Document)
	}

	got, err := uc.Get(ctx, event.ID, "owner-1")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if string(got.Document) != string(validCanvasDocument()) {
		t.Fatalf("round-trip mismatch: %s", got.Document)
	}

	// Omitted document leaves existing
	kept, err := uc.Upsert(ctx, event.ID, "owner-1", dto.UpsertInvitationCardRequest{
		TemplateID: "canvas_v1",
		Published:  true,
	})
	if err != nil {
		t.Fatalf("omit document: %v", err)
	}
	if string(kept.Document) != string(validCanvasDocument()) {
		t.Fatalf("omitted document wiped existing: %s", kept.Document)
	}
	if !kept.Published {
		t.Fatal("published should update while document stays")
	}

	// Explicit null clears
	cleared, err := uc.Upsert(ctx, event.ID, "owner-1", dto.UpsertInvitationCardRequest{
		TemplateID: "canvas_v1",
		Document:   json.RawMessage("null"),
	})
	if err != nil {
		t.Fatalf("null document: %v", err)
	}
	if cleared.Document != nil {
		t.Fatalf("expected cleared document, got %s", cleared.Document)
	}
}

func TestInvitationCard_Document_Oversized(t *testing.T) {
	event := testEvent("owner-1")
	uc := NewInvitationCardUseCase(&fakeEventRepo{event: event}, newFakeCardRepo())
	big := make([]byte, maxInvitationCardDocumentBytes+10)
	for i := range big {
		big[i] = 'a'
	}
	payload := json.RawMessage(`{"version":1,"width":1,"height":1,"elements":["` + string(big) + `"]}`)
	_, err := uc.Upsert(context.Background(), event.ID, "owner-1", dto.UpsertInvitationCardRequest{
		TemplateID: "canvas_v1",
		Document:   payload,
	})
	if err == nil || err.Error() != "validation_error: document too large" {
		t.Fatalf("want oversized error, got %v", err)
	}
}

func TestInvitationCard_Document_InvalidShape(t *testing.T) {
	event := testEvent("owner-1")
	uc := NewInvitationCardUseCase(&fakeEventRepo{event: event}, newFakeCardRepo())
	_, err := uc.Upsert(context.Background(), event.ID, "owner-1", dto.UpsertInvitationCardRequest{
		TemplateID: "canvas_v1",
		Document:   json.RawMessage(`{"version":2,"width":1,"height":1,"elements":[]}`),
	})
	if err == nil || !strings.Contains(err.Error(), "version") {
		t.Fatalf("want version validation, got %v", err)
	}
}
