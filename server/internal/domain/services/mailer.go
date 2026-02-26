package services

import "context"

// Mailer sends emails. Implementations may use SMTP (e.g. Gmail), SendGrid, etc.
type Mailer interface {
	// SendInviteEmail sends an invitation email to the guest with a link to the event RSVP page.
	SendInviteEmail(ctx context.Context, toEmail, eventName, rsvpURL string) error
}
