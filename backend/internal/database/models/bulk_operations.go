package models

import (
	"time"

	"github.com/google/uuid"
)

// BulkImportResult represents the result of a bulk guest import operation
type BulkImportResult struct {
	TotalProcessed int64               `json:"total_processed"`
	SuccessCount   int64               `json:"success_count"`
	FailureCount   int64               `json:"failure_count"`
	Errors         []BulkImportError   `json:"errors"`
	Warnings       []BulkImportWarning `json:"warnings"`
	NewGuests      []Guest             `json:"new_guests"`
	UpdatedGuests  []Guest             `json:"updated_guests"`
	ImportTime     time.Duration       `json:"import_time"`
}

// BulkImportError represents an error during bulk import
type BulkImportError struct {
	Row     int    `json:"row"`
	Field   string `json:"field"`
	Value   string `json:"value"`
	Message string `json:"message"`
}

// BulkImportWarning represents a warning during bulk import
type BulkImportWarning struct {
	Row     int    `json:"row"`
	Field   string `json:"field"`
	Value   string `json:"value"`
	Message string `json:"message"`
}

// GuestExportFilters represents filters for guest export
type GuestExportFilters struct {
	Categories []uuid.UUID  `json:"categories"`
	Tags       []uuid.UUID  `json:"tags"`
	RSVPStatus *RSVPStatus  `json:"rsvp_status"`
	Source     *GuestSource `json:"source"`
	Approved   *bool        `json:"approved"`
}

// BulkInvitationRequest represents a request to send bulk invitations
type BulkInvitationRequest struct {
	GuestIDs    []uuid.UUID `json:"guest_ids" binding:"required"`
	Subject     string      `json:"subject" binding:"required"`
	Message     string      `json:"message" binding:"required"`
	ExpiresAt   *time.Time  `json:"expires_at"`
	PrefillData bool        `json:"prefill_data"` // Whether to prefill name/phone from guest data
}

// BulkInvitationResult represents the result of bulk invitation sending
type BulkInvitationResult struct {
	TotalRequested int64                 `json:"total_requested"`
	SuccessCount   int64                 `json:"success_count"`
	FailureCount   int64                 `json:"failure_count"`
	Errors         []BulkInvitationError `json:"errors"`
	Invitations    []Invitation          `json:"invitations"`
}

// BulkInvitationError represents an error during bulk invitation
type BulkInvitationError struct {
	GuestID uuid.UUID `json:"guest_id"`
	Message string    `json:"message"`
}

// BulkRSVPUpdateRequest represents a request to update RSVP status for multiple guests
type BulkRSVPUpdateRequest struct {
	GuestIDs []uuid.UUID `json:"guest_ids" binding:"required"`
	Status   RSVPStatus  `json:"status" binding:"required"`
	Notes    *string     `json:"notes"`
}

// BulkRSVPUpdateResult represents the result of bulk RSVP updates
type BulkRSVPUpdateResult struct {
	TotalRequested int64                 `json:"total_requested"`
	SuccessCount   int64                 `json:"success_count"`
	FailureCount   int64                 `json:"failure_count"`
	Errors         []BulkRSVPUpdateError `json:"errors"`
	UpdatedGuests  []Guest               `json:"updated_guests"`
}

// BulkRSVPUpdateError represents an error during bulk RSVP update
type BulkRSVPUpdateError struct {
	GuestID uuid.UUID `json:"guest_id"`
	Message string    `json:"message"`
}

// BulkDeleteResult represents the result of bulk guest deletion
type BulkDeleteResult struct {
	TotalRequested int64             `json:"total_requested"`
	SuccessCount   int64             `json:"success_count"`
	FailureCount   int64             `json:"failure_count"`
	Errors         []BulkDeleteError `json:"errors"`
}

// BulkDeleteError represents an error during bulk deletion
type BulkDeleteError struct {
	GuestID uuid.UUID `json:"guest_id"`
	Message string    `json:"message"`
}

// CSVImportRow represents a single row from CSV import
type CSVImportRow struct {
	Name         string `csv:"name"`
	Email        string `csv:"email"`
	Phone        string `csv:"phone"`
	Notes        string `csv:"notes"`
	Category     string `csv:"category"`
	Tags         string `csv:"tags"`
	PlusOneName  string `csv:"plus_one_name"`
	PlusOneEmail string `csv:"plus_one_email"`
}

// CSVExportRow represents a single row for CSV export
type CSVExportRow struct {
	Name       string `csv:"name"`
	Email      string `csv:"email"`
	Phone      string `csv:"phone"`
	Notes      string `csv:"notes"`
	RSVPStatus string `csv:"rsvp_status"`
	RSVPDate   string `csv:"rsvp_date"`
	Source     string `csv:"source"`
	Approved   string `csv:"approved"`
	Categories string `csv:"categories"`
	Tags       string `csv:"tags"`
	PlusOnes   string `csv:"plus_ones"`
	SeatInfo   string `csv:"seat_info"`
}
