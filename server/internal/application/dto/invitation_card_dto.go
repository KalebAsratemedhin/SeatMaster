package dto

import "encoding/json"

// UpsertInvitationCardRequest is the body for PUT /events/{id}/invitation-card.
// Document uses json.RawMessage so omitted vs explicit null can be distinguished:
//   - omitted (nil) → leave existing document unchanged
//   - JSON null     → clear document
//   - object        → validate and store
type UpsertInvitationCardRequest struct {
	TemplateID  string          `json:"template_id"`
	Headline    *string         `json:"headline"`
	HostLine    *string         `json:"host_line"`
	BodyMessage *string         `json:"body_message"`
	AccentKey   *string         `json:"accent_key"`
	ShowBanner  bool            `json:"show_banner"`
	Published   bool            `json:"published"`
	Document    json.RawMessage `json:"document"`
	PreviewURL  *string         `json:"preview_url"`
}

// InvitationCardResponse is returned by GET/PUT invitation-card.
type InvitationCardResponse struct {
	ID          string          `json:"id"`
	EventID     string          `json:"event_id"`
	TemplateID  string          `json:"template_id"`
	Headline    *string         `json:"headline"`
	HostLine    *string         `json:"host_line"`
	BodyMessage *string         `json:"body_message"`
	AccentKey   *string         `json:"accent_key"`
	ShowBanner  bool            `json:"show_banner"`
	Published   bool            `json:"published"`
	Document    json.RawMessage `json:"document"`
	PreviewURL  *string         `json:"preview_url"`
	CreatedAt   string          `json:"created_at"`
	UpdatedAt   string          `json:"updated_at"`
}
