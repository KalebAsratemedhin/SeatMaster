package usecases

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/dto"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/repositories"
)

type DashboardUseCase struct {
	eventRepo       repositories.EventRepository
	eventInviteRepo repositories.EventInviteRepository
	userRepo        repositories.UserRepository
}

func NewDashboardUseCase(
	eventRepo repositories.EventRepository,
	eventInviteRepo repositories.EventInviteRepository,
	userRepo repositories.UserRepository,
) *DashboardUseCase {
	return &DashboardUseCase{
		eventRepo:       eventRepo,
		eventInviteRepo: eventInviteRepo,
		userRepo:        userRepo,
	}
}

func (uc *DashboardUseCase) GetDashboard(ctx context.Context, ownerID string) (*dto.DashboardResponse, error) {
	user, err := uc.userRepo.FindByID(ctx, ownerID)
	if err != nil {
		return nil, err
	}
	userEmail := ""
	if user != nil {
		userEmail = user.Email
	}

	events, err := uc.eventRepo.FindByOwnerID(ctx, ownerID)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	var activeEvents int64
	for _, e := range events {
		ed := time.Date(e.EventDate.Year(), e.EventDate.Month(), e.EventDate.Day(), 0, 0, 0, 0, time.UTC)
		if !ed.Before(today) {
			activeEvents++
		}
	}

	totalInvited, confirmed, declined, pending, err := uc.eventInviteRepo.CountByOwnerIDGroupByStatus(ctx, ownerID)
	if err != nil {
		return nil, err
	}

	recentInvites, err := uc.eventInviteRepo.ListRecentByOwnerID(ctx, ownerID, 10)
	if err != nil {
		return nil, err
	}
	recentRSVPs := make([]*dto.RecentRSVPItem, 0, len(recentInvites))
	for _, inv := range recentInvites {
		event, _ := uc.eventRepo.FindByID(ctx, inv.EventID)
		eventName := ""
		if event != nil {
			eventName = event.Name
		}
		guestName := inv.Email
		if inv.UserID != nil && *inv.UserID != "" {
			if u, err := uc.userRepo.FindByID(ctx, *inv.UserID); err == nil {
				guestName = strings.TrimSpace(u.FirstName + " " + u.LastName)
				if guestName == "" {
					guestName = u.Email
				}
			}
		} else {
			guestName = strings.Split(inv.Email, "@")[0]
		}
		plusOne := "No"
		if inv.GuestSeatID != nil && *inv.GuestSeatID != "" {
			plusOne = "Yes (1)"
		} else if inv.Status != "confirmed" && inv.Status != "declined" {
			plusOne = "-"
		}
		responseTime := formatRelativeTime(inv.CreatedAt)
		recentRSVPs = append(recentRSVPs, &dto.RecentRSVPItem{
			GuestName:    guestName,
			EventName:    eventName,
			EventID:      inv.EventID,
			Status:       inv.Status,
			PlusOne:      plusOne,
			ResponseTime: responseTime,
		})
	}

	var upcomingEvent *dto.DashboardEventSummary
	var nextDate *time.Time
	for _, e := range events {
		ed := time.Date(e.EventDate.Year(), e.EventDate.Month(), e.EventDate.Day(), 0, 0, 0, 0, time.UTC)
		if !ed.Before(today) {
			if nextDate == nil || e.EventDate.Before(*nextDate) {
				t := e.EventDate
				nextDate = &t
				upcomingEvent = &dto.DashboardEventSummary{
					ID:        e.ID,
					Name:      e.Name,
					EventDate: e.EventDate.Format("2006-01-02"),
				}
			}
		}
	}

	// Guest stats and "my recent RSVPs" (events the current user responded to)
	var guestStats *dto.GuestStatsResponse
	var myRecentRSVPs []*dto.MyRecentRSVPItem
	myInvites, err := uc.eventInviteRepo.ListByUserIDOrEmail(ctx, ownerID, userEmail)
	if err == nil && len(myInvites) > 0 {
		var gTotal, gConfirmed, gDeclined, gPending int64
		for _, inv := range myInvites {
			gTotal++
			switch inv.Status {
			case "confirmed":
				gConfirmed++
			case "declined":
				gDeclined++
			default:
				gPending++
			}
		}
		guestStats = &dto.GuestStatsResponse{
			Total:    gTotal,
			Confirmed: gConfirmed,
			Pending:   gPending,
			Declined:  gDeclined,
		}
		// Sort by UpdatedAt desc and take 10 for "events I recently RSVP'd to"
		sortInvitesByUpdatedAtDesc(myInvites)
		limit := 10
		if len(myInvites) < limit {
			limit = len(myInvites)
		}
		for i := 0; i < limit; i++ {
			inv := myInvites[i]
			event, _ := uc.eventRepo.FindByID(ctx, inv.EventID)
			eventName := ""
			eventDate := ""
			if event != nil {
				eventName = event.Name
				eventDate = event.EventDate.Format("2006-01-02")
			}
			myRecentRSVPs = append(myRecentRSVPs, &dto.MyRecentRSVPItem{
				EventID:      inv.EventID,
				EventName:    eventName,
				EventDate:    eventDate,
				Status:       inv.Status,
				ResponseTime: formatRelativeTime(inv.UpdatedAt),
			})
		}
	}

	return &dto.DashboardResponse{
		ActiveEvents:   activeEvents,
		TotalInvited:   totalInvited,
		Confirmed:      confirmed,
		Pending:        pending,
		Declined:       declined,
		RecentRSVPs:    recentRSVPs,
		UpcomingEvent:  upcomingEvent,
		GuestStats:     guestStats,
		MyRecentRSVPs:  myRecentRSVPs,
	}, nil
}

func sortInvitesByUpdatedAtDesc(invites []*entities.EventInvite) {
	// Sort by UpdatedAt descending (most recent first)
	for i := 0; i < len(invites); i++ {
		for j := i + 1; j < len(invites); j++ {
			if invites[j].UpdatedAt.After(invites[i].UpdatedAt) {
				invites[i], invites[j] = invites[j], invites[i]
			}
		}
	}
}

func formatRelativeTime(t time.Time) string {
	diff := time.Since(t)
	if diff < time.Minute {
		return "Just now"
	}
	if diff < time.Hour {
		m := int(diff.Minutes())
		if m == 1 {
			return "1 min ago"
		}
		return fmt.Sprintf("%d mins ago", m)
	}
	if diff < 24*time.Hour {
		h := int(diff.Hours())
		if h == 1 {
			return "1 hour ago"
		}
		return fmt.Sprintf("%d hours ago", h)
	}
	d := int(diff.Hours() / 24)
	if d == 1 {
		return "1 day ago"
	}
	if d < 7 {
		return fmt.Sprintf("%d days ago", d)
	}
	return t.Format("Jan 2")
}
