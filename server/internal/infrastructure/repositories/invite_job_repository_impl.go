package repositories

import (
	"context"
	"errors"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/repositories"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type inviteJobRepositoryImpl struct {
	db *gorm.DB
}

func NewInviteJobRepository(db *gorm.DB) repositories.InviteJobRepository {
	return &inviteJobRepositoryImpl{db: db}
}

func (r *inviteJobRepositoryImpl) Create(ctx context.Context, job *entities.InviteJob) error {
	if job.ID == "" {
		job.ID = uuid.New().String()
	}
	return r.db.WithContext(ctx).Create(job).Error
}

func (r *inviteJobRepositoryImpl) FindByID(ctx context.Context, id string) (*entities.InviteJob, error) {
	var job entities.InviteJob
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&job).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &job, nil
}

func (r *inviteJobRepositoryImpl) Update(ctx context.Context, job *entities.InviteJob) error {
	return r.db.WithContext(ctx).Save(job).Error
}

func (r *inviteJobRepositoryImpl) ListIncomplete(ctx context.Context) ([]*entities.InviteJob, error) {
	var jobs []*entities.InviteJob
	err := r.db.WithContext(ctx).
		Where("status IN ?", []string{entities.InviteJobStatusQueued, entities.InviteJobStatusRunning}).
		Order("created_at ASC").
		Find(&jobs).Error
	return jobs, err
}
