package repositories

import (
	"context"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
)

type InviteJobRepository interface {
	Create(ctx context.Context, job *entities.InviteJob) error
	FindByID(ctx context.Context, id string) (*entities.InviteJob, error)
	Update(ctx context.Context, job *entities.InviteJob) error
	// ListIncomplete returns invite_jobs still queued or running (for boot recovery).
	ListIncomplete(ctx context.Context) ([]*entities.InviteJob, error)
}
