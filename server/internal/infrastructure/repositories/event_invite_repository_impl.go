package repositories

import (
	"context"

	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/repositories"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type eventInviteRepositoryImpl struct {
	db *gorm.DB
}

// NewEventInviteRepository returns an implementation of EventInviteRepository.
func NewEventInviteRepository(db *gorm.DB) repositories.EventInviteRepository {
	return &eventInviteRepositoryImpl{db: db}
}

func (r *eventInviteRepositoryImpl) Create(ctx context.Context, invite *entities.EventInvite) error {
	if invite.ID == "" {
		invite.ID = uuid.New().String()
	}
	return r.db.WithContext(ctx).Create(invite).Error
}

func (r *eventInviteRepositoryImpl) ListByEventID(ctx context.Context, eventID string) ([]*entities.EventInvite, error) {
	var invites []*entities.EventInvite
	err := r.db.WithContext(ctx).Where("event_id = ?", eventID).Order("created_at DESC").Find(&invites).Error
	if err != nil {
		return nil, err
	}
	return invites, nil
}

func (r *eventInviteRepositoryImpl) ListByEventIDPaginated(ctx context.Context, eventID string, limit, offset int) ([]*entities.EventInvite, int64, error) {
	var total int64
	if err := r.db.WithContext(ctx).Model(&entities.EventInvite{}).Where("event_id = ?", eventID).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	var invites []*entities.EventInvite
	err := r.db.WithContext(ctx).Where("event_id = ?", eventID).Order("created_at DESC").Limit(limit).Offset(offset).Find(&invites).Error
	if err != nil {
		return nil, 0, err
	}
	return invites, total, nil
}

func (r *eventInviteRepositoryImpl) ExistsByEventAndUser(ctx context.Context, eventID, userID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&entities.EventInvite{}).
		Where("event_id = ? AND user_id = ?", eventID, userID).Count(&count).Error
	return count > 0, err
}

func (r *eventInviteRepositoryImpl) ListByUserID(ctx context.Context, userID string) ([]*entities.EventInvite, error) {
	var invites []*entities.EventInvite
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at DESC").Find(&invites).Error
	if err != nil {
		return nil, err
	}
	return invites, nil
}

func (r *eventInviteRepositoryImpl) ListByUserIDPaginated(ctx context.Context, userID string, limit, offset int) ([]*entities.EventInvite, int64, error) {
	var total int64
	if err := r.db.WithContext(ctx).Model(&entities.EventInvite{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	var invites []*entities.EventInvite
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at DESC").Limit(limit).Offset(offset).Find(&invites).Error
	if err != nil {
		return nil, 0, err
	}
	return invites, total, nil
}

func (r *eventInviteRepositoryImpl) FindByEventAndUser(ctx context.Context, eventID, userID string) (*entities.EventInvite, error) {
	var invite entities.EventInvite
	err := r.db.WithContext(ctx).Where("event_id = ? AND user_id = ?", eventID, userID).First(&invite).Error
	if err != nil {
		return nil, err
	}
	return &invite, nil
}

func (r *eventInviteRepositoryImpl) FindByEventAndEmail(ctx context.Context, eventID string, email string) (*entities.EventInvite, error) {
	var invite entities.EventInvite
	err := r.db.WithContext(ctx).Where("event_id = ? AND LOWER(email) = LOWER(?)", eventID, email).First(&invite).Error
	if err != nil {
		return nil, err
	}
	return &invite, nil
}

func (r *eventInviteRepositoryImpl) Update(ctx context.Context, invite *entities.EventInvite) error {
	return r.db.WithContext(ctx).Save(invite).Error
}

func (r *eventInviteRepositoryImpl) ExistsByEventAndEmail(ctx context.Context, eventID string, email string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&entities.EventInvite{}).
		Where("event_id = ? AND LOWER(email) = LOWER(?)", eventID, email).Count(&count).Error
	return count > 0, err
}

func (r *eventInviteRepositoryImpl) ListByUserIDOrEmail(ctx context.Context, userID string, email string) ([]*entities.EventInvite, error) {
	var invites []*entities.EventInvite
	err := r.db.WithContext(ctx).Where("user_id = ? OR (user_id IS NULL AND LOWER(email) = LOWER(?))", userID, email).
		Order("created_at DESC").Find(&invites).Error
	if err != nil {
		return nil, err
	}
	return invites, nil
}

func (r *eventInviteRepositoryImpl) ListByUserIDOrEmailPaginated(ctx context.Context, userID string, email string, limit, offset int) ([]*entities.EventInvite, int64, error) {
	where := "user_id = ? OR (user_id IS NULL AND LOWER(email) = LOWER(?))"
	var total int64
	if err := r.db.WithContext(ctx).Model(&entities.EventInvite{}).Where(where, userID, email).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	var invites []*entities.EventInvite
	err := r.db.WithContext(ctx).Where(where, userID, email).Order("created_at DESC").Limit(limit).Offset(offset).Find(&invites).Error
	if err != nil {
		return nil, 0, err
	}
	return invites, total, nil
}

func (r *eventInviteRepositoryImpl) ListRecentByOwnerID(ctx context.Context, ownerID string, limit int) ([]*entities.EventInvite, error) {
	if limit <= 0 {
		limit = 20
	}
	var invites []*entities.EventInvite
	err := r.db.WithContext(ctx).Table("event_invites").
		Joins("INNER JOIN events ON events.id = event_invites.event_id AND events.owner_id = ?", ownerID).
		Select("event_invites.*").
		Order("event_invites.created_at DESC").
		Limit(limit).
		Find(&invites).Error
	return invites, err
}

func (r *eventInviteRepositoryImpl) CountByOwnerIDGroupByStatus(ctx context.Context, ownerID string) (total int64, confirmed int64, declined int64, pending int64, err error) {
	type row struct {
		Status string `gorm:"column:status"`
		Count  int64  `gorm:"column:count"`
	}
	var rows []row
	err = r.db.WithContext(ctx).Table("event_invites").
		Joins("INNER JOIN events ON events.id = event_invites.event_id AND events.owner_id = ?", ownerID).
		Select("event_invites.status AS status, COUNT(*) AS count").
		Group("event_invites.status").
		Scan(&rows).Error
	if err != nil {
		return 0, 0, 0, 0, err
	}
	for _, rw := range rows {
		total += rw.Count
		switch rw.Status {
		case "confirmed":
			confirmed += rw.Count
		case "declined":
			declined += rw.Count
		default:
			pending += rw.Count
		}
	}
	return total, confirmed, declined, pending, nil
}
