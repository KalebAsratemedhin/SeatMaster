package mail

import (
	"context"
	"fmt"
	"net/smtp"
	"os"
	"strings"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/services"
)

type smtpMailer struct {
	host     string
	port     string
	username string
	password string
	from     string
	frontendURL string
}

// NewSMTPMailer returns a Mailer that sends via SMTP (e.g. Gmail SMTP).
// Set env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, FRONTEND_URL.
// If SMTP_HOST is empty, SendInviteEmail is a no-op (for local dev without email).
func NewSMTPMailer() services.Mailer {
	host := os.Getenv("SMTP_HOST")
	return &smtpMailer{
		host:        host,
		port:        getEnv("SMTP_PORT", "587"),
		username:    os.Getenv("SMTP_USER"),
		password:    os.Getenv("SMTP_PASSWORD"),
		from:        getEnv("SMTP_FROM", os.Getenv("SMTP_USER")),
		frontendURL: getEnv("FRONTEND_URL", "http://localhost:3000"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func (m *smtpMailer) SendInviteEmail(ctx context.Context, toEmail, eventName, rsvpURL string) error {
	if m.host == "" || m.username == "" || m.password == "" {
		return nil // no-op when not configured
	}
	// If rsvpURL is relative, make it absolute
	if rsvpURL != "" && !strings.HasPrefix(rsvpURL, "http") {
		rsvpURL = strings.TrimSuffix(m.frontendURL, "/") + rsvpURL
	}
	subject := fmt.Sprintf("You're invited to %s", eventName)
	body := fmt.Sprintf("You have been invited to %s.\n\nRSVP here: %s\n", eventName, rsvpURL)
	msg := []byte("To: " + toEmail + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"Content-Type: text/plain; charset=UTF-8\r\n" +
		"\r\n" + body)
	addr := m.host + ":" + m.port
	auth := smtp.PlainAuth("", m.username, m.password, m.host)
	return smtp.SendMail(addr, auth, m.from, []string{toEmail}, msg)
}
