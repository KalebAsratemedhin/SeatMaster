package usecases

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"strings"
	"time"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/dto"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
)

// StartBulkInviteJob queues async invites for the given emails (owner only). Cap 500.
func (uc *EventUseCase) StartBulkInviteJob(ctx context.Context, ownerID, eventID string, emails []string) (*dto.InviteJobQueuedResponse, error) {
	event, err := uc.requireEventOwner(ctx, ownerID, eventID)
	if err != nil {
		return nil, err
	}
	normalized, err := normalizeBulkEmails(emails)
	if err != nil {
		return nil, err
	}
	return uc.enqueueInviteJob(ctx, event, ownerID, normalized)
}

// StartImportInviteJob parses emails from a spreadsheet and queues the same job type.
func (uc *EventUseCase) StartImportInviteJob(ctx context.Context, ownerID, eventID, filename string, fileBytes []byte) (*dto.InviteJobQueuedResponse, error) {
	event, err := uc.requireEventOwner(ctx, ownerID, eventID)
	if err != nil {
		return nil, err
	}
	emails, err := parseInviteEmailsFromFile(filename, fileBytes)
	if err != nil {
		return nil, err
	}
	normalized, err := normalizeBulkEmails(emails)
	if err != nil {
		return nil, err
	}
	return uc.enqueueInviteJob(ctx, event, ownerID, normalized)
}

// GetInviteJobStatus returns job progress for the event owner.
func (uc *EventUseCase) GetInviteJobStatus(ctx context.Context, ownerID, eventID, jobID string) (*dto.InviteJobStatusResponse, error) {
	if _, err := uc.requireEventOwner(ctx, ownerID, eventID); err != nil {
		return nil, err
	}
	if uc.inviteJobRepo == nil {
		return nil, errors.New("invite jobs not configured")
	}
	job, err := uc.inviteJobRepo.FindByID(ctx, jobID)
	if err != nil {
		return nil, err
	}
	if job == nil || job.EventID != eventID {
		return nil, errors.New("invite job not found")
	}
	return toInviteJobStatusResponse(job), nil
}

// ListAttendeeRecommendations returns past guests from events the caller owned.
func (uc *EventUseCase) ListAttendeeRecommendations(ctx context.Context, ownerID, search, excludeEventID string, limit, offset int) (*dto.PaginatedAttendeeRecommendationsResponse, error) {
	if ownerID == "" {
		return nil, errors.New("unauthorized")
	}
	if excludeEventID != "" {
		event, err := uc.eventRepo.FindByID(ctx, excludeEventID)
		if err != nil {
			return nil, errors.New("event not found")
		}
		if event.OwnerID != ownerID {
			return nil, errors.New("you are not the owner of this event")
		}
	}
	rows, total, err := uc.eventInviteRepo.ListAttendeeRecommendations(ctx, ownerID, search, excludeEventID, limit, offset)
	if err != nil {
		return nil, err
	}
	items := make([]*dto.AttendeeRecommendationItem, len(rows))
	for i, row := range rows {
		items[i] = &dto.AttendeeRecommendationItem{
			Email:         row.Email,
			DisplayName:   row.DisplayName,
			LastEventName: row.LastEventName,
			LastEventDate: row.LastEventDate.Format("2006-01-02"),
		}
	}
	return &dto.PaginatedAttendeeRecommendationsResponse{Items: items, Total: total}, nil
}

func (uc *EventUseCase) requireEventOwner(ctx context.Context, ownerID, eventID string) (*entities.Event, error) {
	event, err := uc.eventRepo.FindByID(ctx, eventID)
	if err != nil {
		return nil, errors.New("event not found")
	}
	if event.OwnerID != ownerID {
		return nil, errors.New("you are not the owner of this event")
	}
	return event, nil
}

func (uc *EventUseCase) enqueueInviteJob(ctx context.Context, event *entities.Event, ownerID string, emails []string) (*dto.InviteJobQueuedResponse, error) {
	if uc.inviteJobRepo == nil || uc.inviteJobQueue == nil {
		return nil, errors.New("invite jobs not configured")
	}
	emailsJSON, err := json.Marshal(emails)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	job := &entities.InviteJob{
		EventID:   event.ID,
		OwnerID:   ownerID,
		Status:    entities.InviteJobStatusQueued,
		Total:     len(emails),
		Sent:      0,
		Failed:    0,
		Emails:    entities.JSONB(emailsJSON),
		Errors:    entities.JSONB([]byte("[]")),
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := uc.inviteJobRepo.Create(ctx, job); err != nil {
		return nil, err
	}
	if err := uc.inviteJobQueue.EnqueueInviteJob(ctx, job.ID); err != nil {
		_ = uc.FailInviteJobByID(ctx, job.ID, "failed to enqueue job: "+err.Error())
		return nil, errors.New("failed to enqueue invite job")
	}
	return &dto.InviteJobQueuedResponse{
		JobID:  job.ID,
		Queued: job.Total,
		Status: job.Status,
	}, nil
}

// ProcessInviteJob is the River worker body: processes emails with mid-job progress updates.
func (uc *EventUseCase) ProcessInviteJob(ctx context.Context, inviteJobID string) error {
	job, err := uc.inviteJobRepo.FindByID(ctx, inviteJobID)
	if err != nil {
		return err
	}
	if job == nil {
		return errors.New("invite job not found")
	}
	if job.Status == entities.InviteJobStatusCompleted || job.Status == entities.InviteJobStatusFailed {
		return nil
	}

	event, err := uc.eventRepo.FindByID(ctx, job.EventID)
	if err != nil || event == nil {
		return uc.FailInviteJobByID(ctx, inviteJobID, "event not found")
	}

	var emails []string
	if err := json.Unmarshal(job.Emails, &emails); err != nil {
		return uc.FailInviteJobByID(ctx, inviteJobID, "invalid job payload")
	}

	job.Status = entities.InviteJobStatusRunning
	job.UpdatedAt = time.Now().UTC()
	if err := uc.inviteJobRepo.Update(ctx, job); err != nil {
		return err
	}

	errs := make([]entities.InviteJobErrorItem, 0)
	if len(job.Errors) > 0 {
		_ = json.Unmarshal(job.Errors, &errs)
	}
	sent := job.Sent
	failed := job.Failed
	// Resume after crash: skip emails already accounted for in sent+failed order.
	startAt := sent + failed
	if startAt < 0 {
		startAt = 0
	}
	if startAt > len(emails) {
		startAt = len(emails)
	}

	for i := startAt; i < len(emails); i++ {
		email := emails[i]
		_, err := uc.createInviteAndSendEmail(ctx, event, email)
		if err != nil {
			if errors.Is(err, errInviteAlreadyExists) {
				sent++
			} else {
				failed++
				errs = append(errs, entities.InviteJobErrorItem{Email: email, Error: err.Error()})
			}
		} else {
			sent++
		}
		job.Sent = sent
		job.Failed = failed
		errsJSON, _ := json.Marshal(errs)
		job.Errors = entities.JSONB(errsJSON)
		job.UpdatedAt = time.Now().UTC()
		if err := uc.inviteJobRepo.Update(ctx, job); err != nil {
			log.Printf("error: invite job %s progress update: %v", inviteJobID, err)
		}
	}

	job.Sent = sent
	job.Failed = failed
	errsJSON, _ := json.Marshal(errs)
	job.Errors = entities.JSONB(errsJSON)
	job.Status = entities.InviteJobStatusCompleted
	job.UpdatedAt = time.Now().UTC()
	if err := uc.inviteJobRepo.Update(ctx, job); err != nil {
		log.Printf("error: invite job %s finalize: %v", inviteJobID, err)
		return err
	}
	return nil
}

// FailInviteJobByID marks an invite job failed with a message (used by worker panic recovery).
func (uc *EventUseCase) FailInviteJobByID(ctx context.Context, inviteJobID string, msg string) error {
	job, err := uc.inviteJobRepo.FindByID(ctx, inviteJobID)
	if err != nil {
		return err
	}
	if job == nil {
		return errors.New("invite job not found")
	}
	errsJSON, _ := json.Marshal([]entities.InviteJobErrorItem{{Email: "", Error: msg}})
	job.Status = entities.InviteJobStatusFailed
	job.Errors = entities.JSONB(errsJSON)
	job.UpdatedAt = time.Now().UTC()
	return uc.inviteJobRepo.Update(ctx, job)
}

// RecoverIncompleteInviteJobs re-queues rows left queued/running after a crash.
func (uc *EventUseCase) RecoverIncompleteInviteJobs(ctx context.Context) error {
	if uc.inviteJobRepo == nil || uc.inviteJobQueue == nil {
		return nil
	}
	jobs, err := uc.inviteJobRepo.ListIncomplete(ctx)
	if err != nil {
		return err
	}
	for _, job := range jobs {
		if job.Status == entities.InviteJobStatusRunning {
			job.Status = entities.InviteJobStatusQueued
			job.UpdatedAt = time.Now().UTC()
			_ = uc.inviteJobRepo.Update(ctx, job)
		}
		if err := uc.inviteJobQueue.EnqueueInviteJob(ctx, job.ID); err != nil {
			log.Printf("error: recover invite job %s: %v", job.ID, err)
		}
	}
	if len(jobs) > 0 {
		log.Printf("re-queued %d incomplete invite job(s)", len(jobs))
	}
	return nil
}

func normalizeBulkEmails(emails []string) ([]string, error) {
	if len(emails) == 0 {
		return nil, errors.New("emails is required")
	}
	seen := make(map[string]struct{}, len(emails))
	out := make([]string, 0, len(emails))
	for _, raw := range emails {
		email := strings.TrimSpace(strings.ToLower(raw))
		if email == "" {
			continue
		}
		if _, ok := seen[email]; ok {
			continue
		}
		seen[email] = struct{}{}
		out = append(out, email)
	}
	if len(out) == 0 {
		return nil, errors.New("emails is required")
	}
	if len(out) > maxBulkInviteEmails {
		return nil, errors.New("too many emails (max 500)")
	}
	return out, nil
}

func toInviteJobStatusResponse(job *entities.InviteJob) *dto.InviteJobStatusResponse {
	errs := make([]dto.InviteJobErrorItem, 0)
	if len(job.Errors) > 0 {
		_ = json.Unmarshal(job.Errors, &errs)
	}
	if errs == nil {
		errs = []dto.InviteJobErrorItem{}
	}
	return &dto.InviteJobStatusResponse{
		JobID:  job.ID,
		Status: job.Status,
		Total:  job.Total,
		Sent:   job.Sent,
		Failed: job.Failed,
		Errors: errs,
	}
}
