package services

import "context"

// Mailer sends emails. Implementations may use SMTP (e.g. Gmail), SendGrid, etc.
type Mailer interface {
	// SendInviteEmail sends an invitation email with a link to the invitation card (/invite/:eventId).
	SendInviteEmail(ctx context.Context, toEmail, eventName, inviteURL string) error
}
