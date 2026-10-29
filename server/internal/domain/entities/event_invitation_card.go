package entities

import "time"

// EventInvitationCard is the persisted invitation-card design for an event (1:1).
type EventInvitationCard struct {
	ID          string    `json:"id"`
	EventID     string    `json:"event_id"`
	TemplateID  string    `json:"template_id"`
	Headline    *string   `json:"headline"`
	HostLine    *string   `json:"host_line"`
	BodyMessage *string   `json:"body_message"`
	AccentKey   *string   `json:"accent_key"`
	ShowBanner  bool      `json:"show_banner"`
	Published   bool      `json:"published"`
	Document    JSONB     `json:"document" gorm:"type:jsonb"`
	PreviewURL  *string   `json:"preview_url"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (EventInvitationCard) TableName() string {
	return "event_invitation_cards"
}
