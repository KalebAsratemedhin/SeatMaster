package services

import (
	"encoding/csv"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/seatmaster/backend/internal/database"
	"github.com/seatmaster/backend/internal/database/models"
	customerrors "github.com/seatmaster/backend/internal/errors"
)

// BulkGuestService handles bulk operations for guests
type BulkGuestService struct {
	db *database.DB
}

// NewBulkGuestService creates a new bulk guest service
func NewBulkGuestService(db *database.DB) *BulkGuestService {
	return &BulkGuestService{db: db}
}

// ImportGuestsFromCSV imports guests from CSV data
func (s *BulkGuestService) ImportGuestsFromCSV(eventID, ownerID uuid.UUID, csvData []byte) (*models.BulkImportResult, error) {
	// Verify event ownership
	if err := s.verifyEventOwnership(eventID, ownerID); err != nil {
		return nil, err
	}

	// Parse CSV data
	reader := csv.NewReader(strings.NewReader(string(csvData)))
	reader.FieldsPerRecord = -1 // Allow variable number of fields

	records, err := reader.ReadAll()
	if err != nil {
		return nil, customerrors.ErrCSVFormatInvalid
	}

	if len(records) < 2 { // Need header + at least one data row
		return nil, customerrors.ErrCSVDataInvalid
	}

	// Parse header
	header := records[0]
	headerMap := make(map[string]int)
	for i, col := range header {
		headerMap[strings.ToLower(strings.TrimSpace(col))] = i
	}

	// Validate required fields
	requiredFields := []string{"name", "email"}
	for _, field := range requiredFields {
		if _, exists := headerMap[field]; !exists {
			return nil, fmt.Errorf("required field '%s' not found in CSV", field)
		}
	}

	result := &models.BulkImportResult{
		Errors:   []models.BulkImportError{},
		Warnings: []models.BulkImportWarning{},
	}

	// Process data rows
	for rowIndex, record := range records[1:] {
		rowNum := rowIndex + 2 // +2 because we start from row 2 (after header)

		// Skip empty rows
		if len(record) == 0 || (len(record) == 1 && strings.TrimSpace(record[0]) == "") {
			continue
		}

		// Parse row data
		guestData, err := s.parseCSVRow(record, headerMap, rowNum)
		if err != nil {
			result.Errors = append(result.Errors, models.BulkImportError{
				Row:     rowNum,
				Field:   "general",
				Value:   strings.Join(record, ","),
				Message: err.Error(),
			})
			result.FailureCount++
			continue
		}

		// Validate guest data
		if err := s.validateGuestData(guestData); err != nil {
			result.Errors = append(result.Errors, models.BulkImportError{
				Row:     rowNum,
				Field:   "validation",
				Value:   guestData.Name,
				Message: err.Error(),
			})
			result.FailureCount++
			continue
		}

		// Check if guest already exists
		var existingGuest models.Guest
		if err := s.db.DB.Where("event_id = ? AND email = ?", eventID, guestData.Email).First(&existingGuest).Error; err == nil {
			// Guest exists, update if needed
			if err := s.updateExistingGuest(&existingGuest, guestData); err != nil {
				result.Errors = append(result.Errors, models.BulkImportError{
					Row:     rowNum,
					Field:   "update",
					Value:   guestData.Email,
					Message: err.Error(),
				})
				result.FailureCount++
				continue
			}
			result.UpdatedGuests = append(result.UpdatedGuests, existingGuest)
		} else {
			// Create new guest
			guest := &models.Guest{
				EventID:    eventID,
				Name:       guestData.Name,
				Email:      guestData.Email,
				Phone:      s.stringToPointer(guestData.Phone),
				Notes:      s.stringToPointer(guestData.Notes),
				RSVPStatus: models.RSVPStatusPending,
				Source:     models.GuestSourceOwnerAdded,
				Approved:   true,
			}

			if err := s.db.DB.Create(guest).Error; err != nil {
				result.Errors = append(result.Errors, models.BulkImportError{
					Row:     rowNum,
					Field:   "creation",
					Value:   guestData.Email,
					Message: err.Error(),
				})
				result.FailureCount++
				continue
			}

			// Handle plus-one if specified
			if guestData.PlusOneName != "" {
				plusOne := &models.PlusOne{
					GuestID: guest.ID,
					Name:    guestData.PlusOneName,
					Email:   s.stringToPointer(guestData.PlusOneEmail),
					Status:  models.PlusOneStatusPending,
				}
				s.db.DB.Create(plusOne)
			}

			result.NewGuests = append(result.NewGuests, *guest)
		}

		result.SuccessCount++
	}

	result.TotalProcessed = int64(len(records) - 1)
	return result, nil
}

// ExportGuestsToCSV exports guests to CSV format
func (s *BulkGuestService) ExportGuestsToCSV(eventID, ownerID uuid.UUID, filters *models.GuestExportFilters) ([]byte, error) {
	// Verify event ownership
	if err := s.verifyEventOwnership(eventID, ownerID); err != nil {
		return nil, err
	}

	// Build query
	query := s.db.DB.Model(&models.Guest{}).Where("event_id = ?", eventID)

	// Apply filters
	if filters != nil {
		if filters.RSVPStatus != nil {
			query = query.Where("rsvp_status = ?", *filters.RSVPStatus)
		}
		if filters.Source != nil {
			query = query.Where("source = ?", *filters.Source)
		}
		if filters.Approved != nil {
			query = query.Where("approved = ?", *filters.Approved)
		}
	}

	var guests []models.Guest
	if err := query.Preload("User").Find(&guests).Error; err != nil {
		return nil, err
	}

	// Create CSV
	var csvData strings.Builder
	writer := csv.NewWriter(&csvData)

	// Write header
	header := []string{"Name", "Email", "Phone", "Notes", "RSVP Status", "RSVP Date", "Source", "Approved", "Categories", "Tags", "Plus Ones", "Seat Info"}
	writer.Write(header)

	// Write data rows
	for _, guest := range guests {
		row := []string{
			guest.Name,
			guest.Email,
			s.pointerToString(guest.Phone),
			s.pointerToString(guest.Notes),
			string(guest.RSVPStatus),
			guest.RSVPDate.Format("2006-01-02 15:04:05"),
			string(guest.Source),
			strconv.FormatBool(guest.Approved),
			"", // Categories - would need to be populated
			"", // Tags - would need to be populated
			"", // Plus ones - would need to be populated
			"", // Seat info - would need to be populated
		}
		writer.Write(row)
	}

	writer.Flush()
	return []byte(csvData.String()), nil
}

// SendBulkInvitations sends invitations to multiple guests
func (s *BulkGuestService) SendBulkInvitations(eventID, ownerID uuid.UUID, req *models.BulkInvitationRequest) (*models.BulkInvitationResult, error) {
	// Verify event ownership
	if err := s.verifyEventOwnership(eventID, ownerID); err != nil {
		return nil, err
	}

	result := &models.BulkInvitationResult{
		Errors: []models.BulkInvitationError{},
	}

	// Process each guest ID
	for _, guestID := range req.GuestIDs {
		// Check if guest exists and belongs to event
		var guest models.Guest
		if err := s.db.DB.Where("id = ? AND event_id = ?", guestID, eventID).First(&guest).Error; err != nil {
			result.Errors = append(result.Errors, models.BulkInvitationError{
				GuestID: guestID,
				Message: "Guest not found",
			})
			result.FailureCount++
			continue
		}

		// Check if invitation already exists
		var existingInvitation models.Invitation
		if err := s.db.DB.Where("event_id = ? AND email = ?", eventID, guest.Email).First(&existingInvitation).Error; err == nil {
			result.Errors = append(result.Errors, models.BulkInvitationError{
				GuestID: guestID,
				Message: "Invitation already exists for this email",
			})
			result.FailureCount++
			continue
		}

		// Create invitation
		expiresAt := time.Now().AddDate(0, 0, 30) // Default to 30 days from now
		if req.ExpiresAt != nil {
			expiresAt = *req.ExpiresAt
		}

		invitation := &models.Invitation{
			EventID:        eventID,
			Email:          guest.Email,
			PrefilledName:  &guest.Name,
			PrefilledPhone: guest.Phone,
			ExpiresAt:      expiresAt,
		}

		if err := s.db.DB.Create(invitation).Error; err != nil {
			result.Errors = append(result.Errors, models.BulkInvitationError{
				GuestID: guestID,
				Message: err.Error(),
			})
			result.FailureCount++
			continue
		}

		result.Invitations = append(result.Invitations, *invitation)
		result.SuccessCount++
	}

	result.TotalRequested = int64(len(req.GuestIDs))
	return result, nil
}

// UpdateBulkRSVP updates RSVP status for multiple guests
func (s *BulkGuestService) UpdateBulkRSVP(eventID, ownerID uuid.UUID, req *models.BulkRSVPUpdateRequest) (*models.BulkRSVPUpdateResult, error) {
	// Verify event ownership
	if err := s.verifyEventOwnership(eventID, ownerID); err != nil {
		return nil, err
	}

	result := &models.BulkRSVPUpdateResult{
		Errors: []models.BulkRSVPUpdateError{},
	}

	// Process each guest ID
	for _, guestID := range req.GuestIDs {
		// Check if guest exists and belongs to event
		var guest models.Guest
		if err := s.db.DB.Where("id = ? AND event_id = ?", guestID, eventID).First(&guest).Error; err != nil {
			result.Errors = append(result.Errors, models.BulkRSVPUpdateError{
				GuestID: guestID,
				Message: "Guest not found",
			})
			result.FailureCount++
			continue
		}

		// Update RSVP status
		updates := make(map[string]interface{})
		updates["rsvp_status"] = req.Status
		updates["rsvp_date"] = time.Now()
		if req.Notes != nil {
			updates["notes"] = *req.Notes
		}

		if err := s.db.DB.Model(&guest).Updates(updates).Error; err != nil {
			result.Errors = append(result.Errors, models.BulkRSVPUpdateError{
				GuestID: guestID,
				Message: err.Error(),
			})
			result.FailureCount++
			continue
		}

		result.UpdatedGuests = append(result.UpdatedGuests, guest)
		result.SuccessCount++
	}

	result.TotalRequested = int64(len(req.GuestIDs))
	return result, nil
}

// DeleteBulkGuests removes multiple guests from an event
func (s *BulkGuestService) DeleteBulkGuests(eventID, ownerID uuid.UUID, guestIDs []uuid.UUID) (*models.BulkDeleteResult, error) {
	// Verify event ownership
	if err := s.verifyEventOwnership(eventID, ownerID); err != nil {
		return nil, err
	}

	result := &models.BulkDeleteResult{
		Errors: []models.BulkDeleteError{},
	}

	// Process each guest ID
	for _, guestID := range guestIDs {
		// Check if guest exists and belongs to event
		var guest models.Guest
		if err := s.db.DB.Where("id = ? AND event_id = ?", guestID, eventID).First(&guest).Error; err != nil {
			result.Errors = append(result.Errors, models.BulkDeleteError{
				GuestID: guestID,
				Message: "Guest not found",
			})
			result.FailureCount++
			continue
		}

		// Delete guest
		if err := s.db.DB.Delete(&guest).Error; err != nil {
			result.Errors = append(result.Errors, models.BulkDeleteError{
				GuestID: guestID,
				Message: err.Error(),
			})
			result.FailureCount++
			continue
		}

		result.SuccessCount++
	}

	result.TotalRequested = int64(len(guestIDs))
	return result, nil
}

// Helper methods

func (s *BulkGuestService) parseCSVRow(record []string, headerMap map[string]int, rowNum int) (*models.CSVImportRow, error) {
	guestData := &models.CSVImportRow{}

	// Extract fields
	if nameIdx, exists := headerMap["name"]; exists && nameIdx < len(record) {
		guestData.Name = strings.TrimSpace(record[nameIdx])
	}
	if emailIdx, exists := headerMap["email"]; exists && emailIdx < len(record) {
		guestData.Email = strings.TrimSpace(record[emailIdx])
	}
	if phoneIdx, exists := headerMap["phone"]; exists && phoneIdx < len(record) {
		guestData.Phone = strings.TrimSpace(record[phoneIdx])
	}
	if notesIdx, exists := headerMap["notes"]; exists && notesIdx < len(record) {
		guestData.Notes = strings.TrimSpace(record[notesIdx])
	}
	if categoryIdx, exists := headerMap["category"]; exists && categoryIdx < len(record) {
		guestData.Category = strings.TrimSpace(record[categoryIdx])
	}
	if tagsIdx, exists := headerMap["tags"]; exists && tagsIdx < len(record) {
		guestData.Tags = strings.TrimSpace(record[tagsIdx])
	}
	if plusOneNameIdx, exists := headerMap["plus_one_name"]; exists && plusOneNameIdx < len(record) {
		guestData.PlusOneName = strings.TrimSpace(record[plusOneNameIdx])
	}
	if plusOneEmailIdx, exists := headerMap["plus_one_email"]; exists && plusOneEmailIdx < len(record) {
		guestData.PlusOneEmail = strings.TrimSpace(record[plusOneEmailIdx])
	}

	return guestData, nil
}

func (s *BulkGuestService) validateGuestData(guestData *models.CSVImportRow) error {
	if guestData.Name == "" {
		return fmt.Errorf("name is required")
	}
	if guestData.Email == "" {
		return fmt.Errorf("email is required")
	}
	// Add more validation as needed
	return nil
}

func (s *BulkGuestService) updateExistingGuest(existingGuest *models.Guest, guestData *models.CSVImportRow) error {
	updates := make(map[string]interface{})

	if guestData.Name != "" && guestData.Name != existingGuest.Name {
		updates["name"] = guestData.Name
	}
	if guestData.Phone != "" && guestData.Phone != s.pointerToString(existingGuest.Phone) {
		updates["phone"] = guestData.Phone
	}
	if guestData.Notes != "" && guestData.Notes != s.pointerToString(existingGuest.Notes) {
		updates["notes"] = guestData.Notes
	}

	if len(updates) > 0 {
		return s.db.DB.Model(existingGuest).Updates(updates).Error
	}
	return nil
}

func (s *BulkGuestService) verifyEventOwnership(eventID, userID uuid.UUID) error {
	var event models.Event
	if err := s.db.DB.Where("id = ? AND owner_id = ?", eventID, userID).First(&event).Error; err != nil {
		return customerrors.ErrEventAccess
	}
	return nil
}

// stringToPointer converts a string to a pointer, returning nil if empty
func (s *BulkGuestService) stringToPointer(str string) *string {
	if str == "" {
		return nil
	}
	return &str
}

// pointerToString converts a pointer to a string, returning empty string if nil
func (s *BulkGuestService) pointerToString(ptr *string) string {
	if ptr == nil {
		return ""
	}
	return *ptr
}
