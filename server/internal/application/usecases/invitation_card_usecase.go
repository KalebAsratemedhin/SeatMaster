package usecases

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/dto"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/repositories"
)

const maxInvitationCardDocumentBytes = 512 * 1024

var (
	ErrInvitationCardNotFound     = errors.New("invitation_card_not_found")
	ErrInvitationCardForbidden    = errors.New("forbidden")
	ErrInvitationCardUnauthorized = errors.New("unauthorized")
	ErrInvitationCardValidation   = errors.New("validation_error")
	ErrEventNotFound              = errors.New("event not found")
)

type InvitationCardUseCase struct {
	eventRepo repositories.EventRepository
	cardRepo  repositories.EventInvitationCardRepository
}

func NewInvitationCardUseCase(
	eventRepo repositories.EventRepository,
	cardRepo repositories.EventInvitationCardRepository,
) *InvitationCardUseCase {
	return &InvitationCardUseCase{
		eventRepo: eventRepo,
		cardRepo:  cardRepo,
	}
}

func (uc *InvitationCardUseCase) Get(ctx context.Context, eventID string, callerID string) (*dto.InvitationCardResponse, error) {
	event, err := uc.loadEvent(ctx, eventID)
	if err != nil {
		if errors.Is(err, ErrEventNotFound) {
			return nil, ErrInvitationCardNotFound
		}
		return nil, err
	}

	card, err := uc.cardRepo.FindByEventID(ctx, eventID)
	if err != nil {
		return nil, err
	}
	if card == nil {
		return nil, ErrInvitationCardNotFound
	}

	isOwner := callerID != "" && event.OwnerID == callerID
	if !isOwner && !card.Published {
		return nil, ErrInvitationCardNotFound
	}
	return toInvitationCardResponse(card), nil
}

func (uc *InvitationCardUseCase) Upsert(ctx context.Context, eventID string, ownerID string, req dto.UpsertInvitationCardRequest) (*dto.InvitationCardResponse, error) {
	if ownerID == "" {
		return nil, ErrInvitationCardUnauthorized
	}
	event, err := uc.loadEvent(ctx, eventID)
	if err != nil {
		return nil, err
	}
	if event.OwnerID != ownerID {
		return nil, ErrInvitationCardForbidden
	}
	if err := validateUpsertInvitationCard(req); err != nil {
		return nil, err
	}

	doc, err := resolveDocumentUpdate(req.Document)
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	existing, err := uc.cardRepo.FindByEventID(ctx, eventID)
	if err != nil {
		return nil, err
	}

	previewURL := normalizeOptionalString(req.PreviewURL)

	if existing == nil {
		card := &entities.EventInvitationCard{
			EventID:     eventID,
			TemplateID:  strings.TrimSpace(req.TemplateID),
			Headline:    normalizeOptionalString(req.Headline),
			HostLine:    normalizeOptionalString(req.HostLine),
			BodyMessage: normalizeOptionalString(req.BodyMessage),
			AccentKey:   normalizeOptionalString(req.AccentKey),
			ShowBanner:  req.ShowBanner,
			Published:   req.Published,
			PreviewURL:  previewURL,
			CreatedAt:   now,
			UpdatedAt:   now,
		}
		if doc.set {
			card.Document = doc.value
		}
		if err := uc.cardRepo.Create(ctx, card); err != nil {
			return nil, err
		}
		return toInvitationCardResponse(card), nil
	}

	existing.TemplateID = strings.TrimSpace(req.TemplateID)
	existing.Headline = normalizeOptionalString(req.Headline)
	existing.HostLine = normalizeOptionalString(req.HostLine)
	existing.BodyMessage = normalizeOptionalString(req.BodyMessage)
	existing.AccentKey = normalizeOptionalString(req.AccentKey)
	existing.ShowBanner = req.ShowBanner
	existing.Published = req.Published
	existing.UpdatedAt = now
	if req.PreviewURL != nil {
		existing.PreviewURL = previewURL
	}
	if doc.set {
		existing.Document = doc.value
	}
	if err := uc.cardRepo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return toInvitationCardResponse(existing), nil
}

func (uc *InvitationCardUseCase) Delete(ctx context.Context, eventID string, ownerID string) error {
	if ownerID == "" {
		return ErrInvitationCardUnauthorized
	}
	event, err := uc.loadEvent(ctx, eventID)
	if err != nil {
		return err
	}
	if event.OwnerID != ownerID {
		return ErrInvitationCardForbidden
	}
	deleted, err := uc.cardRepo.DeleteByEventID(ctx, eventID)
	if err != nil {
		return err
	}
	if !deleted {
		return ErrInvitationCardNotFound
	}
	return nil
}

func (uc *InvitationCardUseCase) loadEvent(ctx context.Context, eventID string) (*entities.Event, error) {
	event, err := uc.eventRepo.FindByID(ctx, eventID)
	if err != nil || event == nil {
		return nil, ErrEventNotFound
	}
	return event, nil
}

type documentUpdate struct {
	set   bool
	value entities.JSONB // nil means clear when set
}

// resolveDocumentUpdate: omitted → no change; JSON null → clear; object → validate+store.
func resolveDocumentUpdate(raw json.RawMessage) (documentUpdate, error) {
	if raw == nil {
		return documentUpdate{set: false}, nil
	}
	trimmed := bytes.TrimSpace(raw)
	if bytes.Equal(trimmed, []byte("null")) {
		return documentUpdate{set: true, value: nil}, nil
	}
	if err := validateInvitationCardDocument(trimmed); err != nil {
		return documentUpdate{}, err
	}
	cp := append(entities.JSONB(nil), trimmed...)
	return documentUpdate{set: true, value: cp}, nil
}

func validateInvitationCardDocument(raw []byte) error {
	if len(raw) > maxInvitationCardDocumentBytes {
		return errors.New("validation_error: document too large")
	}
	if len(raw) == 0 || raw[0] != '{' {
		return errors.New("validation_error: document must be a JSON object")
	}

	var probe struct {
		Version  *float64        `json:"version"`
		Width    *float64        `json:"width"`
		Height   *float64        `json:"height"`
		Elements json.RawMessage `json:"elements"`
	}
	if err := json.Unmarshal(raw, &probe); err != nil {
		return errors.New("validation_error: document is invalid JSON")
	}
	if probe.Version == nil || *probe.Version != 1 {
		return errors.New("validation_error: document.version must be 1")
	}
	if probe.Width == nil || *probe.Width <= 0 {
		return errors.New("validation_error: document.width must be a positive number")
	}
	if probe.Height == nil || *probe.Height <= 0 {
		return errors.New("validation_error: document.height must be a positive number")
	}
	if probe.Elements == nil {
		return errors.New("validation_error: document.elements is required")
	}
	el := bytes.TrimSpace(probe.Elements)
	if len(el) == 0 || el[0] != '[' {
		return errors.New("validation_error: document.elements must be an array")
	}
	return nil
}

func validateUpsertInvitationCard(req dto.UpsertInvitationCardRequest) error {
	templateID := strings.TrimSpace(req.TemplateID)
	if templateID == "" {
		return errors.New("validation_error: template_id is required")
	}
	if utf8.RuneCountInString(templateID) > 64 {
		return errors.New("validation_error: template_id max length is 64")
	}
	if err := checkOptionalMax(req.Headline, 200, "headline"); err != nil {
		return err
	}
	if err := checkOptionalMax(req.HostLine, 200, "host_line"); err != nil {
		return err
	}
	if err := checkOptionalMax(req.BodyMessage, 2000, "body_message"); err != nil {
		return err
	}
	if err := checkOptionalMax(req.AccentKey, 32, "accent_key"); err != nil {
		return err
	}
	if err := checkOptionalMax(req.PreviewURL, 2048, "preview_url"); err != nil {
		return err
	}
	return nil
}

func checkOptionalMax(v *string, max int, field string) error {
	if v == nil {
		return nil
	}
	if utf8.RuneCountInString(*v) > max {
		return errors.New("validation_error: " + field + " exceeds max length")
	}
	return nil
}

// normalizeOptionalString trims; empty string becomes nil so DB stores NULL.
func normalizeOptionalString(v *string) *string {
	if v == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*v)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func toInvitationCardResponse(card *entities.EventInvitationCard) *dto.InvitationCardResponse {
	var doc json.RawMessage
	if len(card.Document) > 0 {
		doc = json.RawMessage(append([]byte(nil), card.Document...))
	}
	return &dto.InvitationCardResponse{
		ID:          card.ID,
		EventID:     card.EventID,
		TemplateID:  card.TemplateID,
		Headline:    card.Headline,
		HostLine:    card.HostLine,
		BodyMessage: card.BodyMessage,
		AccentKey:   card.AccentKey,
		ShowBanner:  card.ShowBanner,
		Published:   card.Published,
		Document:    doc,
		PreviewURL:  card.PreviewURL,
		CreatedAt:   card.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:   card.UpdatedAt.UTC().Format(time.RFC3339),
	}
}
