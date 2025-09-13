package services

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"html/template"
	"net/smtp"
	"os"
	"strconv"

	"github.com/seatmaster/backend/internal/config"
	"github.com/seatmaster/backend/internal/database"
	"github.com/seatmaster/backend/internal/database/models"
)

// EmailService handles email operations
type EmailService struct {
	config *config.Config
	db     *database.DB
}

// NewEmailService creates a new email service
func NewEmailService(config *config.Config, db *database.DB) *EmailService {
	return &EmailService{
		config: config,
		db:     db,
	}
}

// EmailConfig represents SMTP configuration
type EmailConfig struct {
	SMTPHost     string
	SMTPPort     int
	SMTPUsername string
	SMTPPassword string
	FromEmail    string
	FromName     string
}

// EmailMessage represents an email message
type EmailMessage struct {
	To      string
	Subject string
	Body    string
	HTML    string
}

// GetEmailConfig retrieves email configuration from environment variables
func (s *EmailService) GetEmailConfig() (*EmailConfig, error) {
	port, err := strconv.Atoi(os.Getenv("SMTP_PORT"))
	if err != nil {
		port = 587 // Default SMTP port
	}

	return &EmailConfig{
		SMTPHost:     os.Getenv("SMTP_HOST"),
		SMTPPort:     port,
		SMTPUsername: os.Getenv("SMTP_USERNAME"),
		SMTPPassword: os.Getenv("SMTP_PASSWORD"),
		FromEmail:    os.Getenv("FROM_EMAIL"),
		FromName:     os.Getenv("FROM_NAME"),
	}, nil
}

// SendEmail sends an email using SMTP
func (s *EmailService) SendEmail(message *EmailMessage) error {
	config, err := s.GetEmailConfig()
	if err != nil {
		return fmt.Errorf("failed to get email config: %w", err)
	}

	// Validate required configuration
	if config.SMTPHost == "" || config.SMTPUsername == "" || config.SMTPPassword == "" {
		return fmt.Errorf("email configuration is incomplete")
	}

	// Create the email message
	msg := s.createEmailMessage(config, message)

	// Set up authentication
	auth := smtp.PlainAuth("", config.SMTPUsername, config.SMTPPassword, config.SMTPHost)

	// Connect to the server
	addr := fmt.Sprintf("%s:%d", config.SMTPHost, config.SMTPPort)

	// Create TLS configuration
	tlsConfig := &tls.Config{
		InsecureSkipVerify: false,
		ServerName:         config.SMTPHost,
	}

	// Connect to the server
	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		return fmt.Errorf("failed to connect to SMTP server: %w", err)
	}
	defer conn.Close()

	// Create SMTP client
	client, err := smtp.NewClient(conn, config.SMTPHost)
	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %w", err)
	}
	defer client.Quit()

	// Authenticate
	if err := client.Auth(auth); err != nil {
		return fmt.Errorf("failed to authenticate: %w", err)
	}

	// Set sender
	if err := client.Mail(config.FromEmail); err != nil {
		return fmt.Errorf("failed to set sender: %w", err)
	}

	// Set recipient
	if err := client.Rcpt(message.To); err != nil {
		return fmt.Errorf("failed to set recipient: %w", err)
	}

	// Send the email
	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("failed to get data writer: %w", err)
	}

	_, err = w.Write(msg)
	if err != nil {
		return fmt.Errorf("failed to write email data: %w", err)
	}

	err = w.Close()
	if err != nil {
		return fmt.Errorf("failed to close data writer: %w", err)
	}

	return nil
}

// createEmailMessage creates the email message in proper format
func (s *EmailService) createEmailMessage(config *EmailConfig, message *EmailMessage) []byte {
	var msg bytes.Buffer

	// Email headers
	msg.WriteString(fmt.Sprintf("From: %s <%s>\r\n", config.FromName, config.FromEmail))
	msg.WriteString(fmt.Sprintf("To: %s\r\n", message.To))
	msg.WriteString(fmt.Sprintf("Subject: %s\r\n", message.Subject))
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString("Content-Type: multipart/alternative; boundary=\"boundary123\"\r\n")
	msg.WriteString("\r\n")

	// Text part
	msg.WriteString("--boundary123\r\n")
	msg.WriteString("Content-Type: text/plain; charset=\"UTF-8\"\r\n")
	msg.WriteString("\r\n")
	msg.WriteString(message.Body)
	msg.WriteString("\r\n")

	// HTML part
	if message.HTML != "" {
		msg.WriteString("--boundary123\r\n")
		msg.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
		msg.WriteString("\r\n")
		msg.WriteString(message.HTML)
		msg.WriteString("\r\n")
	}

	msg.WriteString("--boundary123--\r\n")

	return msg.Bytes()
}

// SendInvitationEmail sends an invitation email
func (s *EmailService) SendInvitationEmail(invitation *models.Invitation) error {
	// Get invitation template
	template, err := s.getInvitationTemplate()
	if err != nil {
		return fmt.Errorf("failed to get invitation template: %w", err)
	}

	// Prepare template data
	data := map[string]interface{}{
		"EventName":        invitation.Event.Name,
		"EventDate":        invitation.Event.Date.Format("January 2, 2006 at 3:04 PM"),
		"EventLocation":    invitation.Event.Location,
		"EventDescription": invitation.Event.Description,
		"InvitationToken":  invitation.Token,
		"ExpiresAt":        invitation.ExpiresAt.Format("January 2, 2006"),
		"PrefilledName":    invitation.PrefilledName,
		"AcceptURL":        fmt.Sprintf("%s/invitations/%s/accept", s.config.Server.BaseURL, invitation.Token),
	}

	// Render template
	html, text, err := s.renderTemplate(template, data)
	if err != nil {
		return fmt.Errorf("failed to render template: %w", err)
	}

	// Create email message
	message := &EmailMessage{
		To:      invitation.Email,
		Subject: fmt.Sprintf("Invitation to %s", invitation.Event.Name),
		Body:    text,
		HTML:    html,
	}

	// Send email
	return s.SendEmail(message)
}

// getInvitationTemplate returns the invitation email template
func (s *EmailService) getInvitationTemplate() (string, error) {
	// For now, return a simple template
	// In production, this would be loaded from a database or file
	return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Event Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333;">You're Invited!</h1>
    
    <h2>{{.EventName}}</h2>
    
    <p><strong>Date:</strong> {{.EventDate}}</p>
    <p><strong>Location:</strong> {{.EventLocation}}</p>
    
    {{if .EventDescription}}
    <p><strong>Description:</strong> {{.EventDescription}}</p>
    {{end}}
    
    {{if .PrefilledName}}
    <p>Hello {{.PrefilledName}},</p>
    {{else}}
    <p>Hello,</p>
    {{end}}
    
    <p>You have been invited to attend this event. Please click the link below to RSVP:</p>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{.AcceptURL}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">RSVP Now</a>
    </div>
    
    <p><strong>Important:</strong> This invitation expires on {{.ExpiresAt}}.</p>
    
    <p>If you have any questions, please contact the event organizer.</p>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
    <p style="color: #666; font-size: 12px;">
        If you cannot click the link above, copy and paste this URL into your browser:<br>
        {{.AcceptURL}}
    </p>
</body>
</html>
`, nil
}

// renderTemplate renders a template with the given data
func (s *EmailService) renderTemplate(templateStr string, data map[string]interface{}) (string, string, error) {
	// Parse HTML template
	htmlTmpl, err := template.New("html").Parse(templateStr)
	if err != nil {
		return "", "", fmt.Errorf("failed to parse HTML template: %w", err)
	}

	// Render HTML
	var htmlBuf bytes.Buffer
	if err := htmlTmpl.Execute(&htmlBuf, data); err != nil {
		return "", "", fmt.Errorf("failed to execute HTML template: %w", err)
	}

	// Create text version (simple conversion)
	text := s.htmlToText(htmlBuf.String())

	return htmlBuf.String(), text, nil
}

// htmlToText converts HTML to plain text (simple implementation)
func (s *EmailService) htmlToText(html string) string {
	// This is a very basic HTML to text conversion
	// In production, you might want to use a proper HTML parser
	text := html
	// Remove HTML tags (very basic)
	text = fmt.Sprintf("Event Invitation\n\nEvent: %s\nDate: %s\nLocation: %s\n\nYou have been invited to attend this event. Please visit the following link to RSVP:\n%s\n\nThis invitation expires on %s.\n\nIf you have any questions, please contact the event organizer.",
		"{{.EventName}}", "{{.EventDate}}", "{{.EventLocation}}", "{{.AcceptURL}}", "{{.ExpiresAt}}")
	return text
}

// TestEmailConnection tests the email configuration
func (s *EmailService) TestEmailConnection() error {
	config, err := s.GetEmailConfig()
	if err != nil {
		return fmt.Errorf("failed to get email config: %w", err)
	}

	// Create a test message
	testMessage := &EmailMessage{
		To:      config.FromEmail, // Send test to self
		Subject: "SeatMaster Email Test",
		Body:    "This is a test email from SeatMaster to verify email configuration.",
		HTML:    "<p>This is a test email from SeatMaster to verify email configuration.</p>",
	}

	// Try to send the test email
	return s.SendEmail(testMessage)
}
