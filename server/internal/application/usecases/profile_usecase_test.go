package usecases

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/dto"
	"github.com/KalebAsratemedhin/seatmaster/internal/domain/entities"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/security"
	pkgerrors "github.com/KalebAsratemedhin/seatmaster/pkg/errors"
)

type fakeUserRepo struct {
	users map[string]*entities.User
}

func newFakeUserRepo(u *entities.User) *fakeUserRepo {
	r := &fakeUserRepo{users: map[string]*entities.User{}}
	if u != nil {
		cp := *u
		r.users[u.ID] = &cp
	}
	return r
}

func (f *fakeUserRepo) Create(ctx context.Context, user *entities.User) error { return nil }
func (f *fakeUserRepo) FindByEmail(ctx context.Context, email string) (*entities.User, error) {
	return nil, errors.New("not found")
}
func (f *fakeUserRepo) FindByID(ctx context.Context, id string) (*entities.User, error) {
	u, ok := f.users[id]
	if !ok {
		return nil, errors.New("record not found")
	}
	cp := *u
	return &cp, nil
}
func (f *fakeUserRepo) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	return false, nil
}
func (f *fakeUserRepo) ExistsByID(ctx context.Context, id string) (bool, error) {
	_, ok := f.users[id]
	return ok, nil
}
func (f *fakeUserRepo) Update(ctx context.Context, user *entities.User) error { return nil }
func (f *fakeUserRepo) UpdatePassword(ctx context.Context, userID string, hashedPassword string) error {
	u, ok := f.users[userID]
	if !ok {
		return errors.New("not found")
	}
	u.Password = hashedPassword
	u.UpdatedAt = time.Now()
	return nil
}
func (f *fakeUserRepo) Delete(ctx context.Context, id string) error {
	if _, ok := f.users[id]; !ok {
		return errors.New("not found")
	}
	delete(f.users, id)
	return nil
}

type profileFakeEventRepo struct {
	owns bool
}

func (f *profileFakeEventRepo) Create(ctx context.Context, event *entities.Event) error { return nil }
func (f *profileFakeEventRepo) FindByID(ctx context.Context, id string) (*entities.Event, error) {
	return nil, errors.New("not found")
}
func (f *profileFakeEventRepo) FindByOwnerID(ctx context.Context, ownerID string) ([]*entities.Event, error) {
	return nil, nil
}
func (f *profileFakeEventRepo) FindByOwnerIDPaginated(ctx context.Context, ownerID string, limit, offset int) ([]*entities.Event, int64, error) {
	return nil, 0, nil
}
func (f *profileFakeEventRepo) FindByUserID(ctx context.Context, userID string) ([]*entities.Event, error) {
	return nil, nil
}
func (f *profileFakeEventRepo) FindByUserIDPaginated(ctx context.Context, userID string, limit, offset int) ([]*entities.Event, int64, error) {
	return nil, 0, nil
}
func (f *profileFakeEventRepo) FindByEmail(ctx context.Context, email string) (*entities.Event, error) {
	return nil, nil
}
func (f *profileFakeEventRepo) ExistsByID(ctx context.Context, id string) (bool, error) {
	return false, nil
}
func (f *profileFakeEventRepo) ExistsByOwnerID(ctx context.Context, ownerID string) (bool, error) {
	return f.owns, nil
}
func (f *profileFakeEventRepo) ExistsByUserID(ctx context.Context, userID string) (bool, error) {
	return false, nil
}
func (f *profileFakeEventRepo) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	return false, nil
}
func (f *profileFakeEventRepo) ExistsByName(ctx context.Context, name string) (bool, error) {
	return false, nil
}
func (f *profileFakeEventRepo) Delete(ctx context.Context, event *entities.Event) error { return nil }
func (f *profileFakeEventRepo) Update(ctx context.Context, event *entities.Event) error  { return nil }
func (f *profileFakeEventRepo) ListPublic(ctx context.Context, search string, limit, offset int) ([]*entities.Event, error) {
	return nil, nil
}

func testProfileUC(user *entities.User, ownsEvents bool) (*ProfileUseCase, *fakeUserRepo, *security.PasswordManager) {
	pm := security.NewPasswordManager()
	hash, _ := pm.Hash("oldpassword")
	user.Password = hash
	users := newFakeUserRepo(user)
	auth := NewAuthUseCase(users, nil, pm)
	uc := NewProfileUseCase(users, &profileFakeEventRepo{owns: ownsEvents}, auth, pm)
	return uc, users, pm
}

func TestChangePassword_SuccessAndValidation(t *testing.T) {
	user := &entities.User{ID: "u1", Email: "a@b.com", FirstName: "A", LastName: "B"}
	uc, users, pm := testProfileUC(user, false)

	err := uc.ChangePassword(context.Background(), "u1", dto.ChangePasswordRequest{
		CurrentPassword: "wrong",
		NewPassword:     "newpassword",
	})
	if !errors.Is(err, ErrInvalidCurrentPassword) {
		t.Fatalf("want invalid_current_password, got %v", err)
	}

	err = uc.ChangePassword(context.Background(), "u1", dto.ChangePasswordRequest{
		CurrentPassword: "oldpassword",
		NewPassword:     "short",
	})
	if !errors.Is(err, pkgerrors.ErrPasswordTooShort) {
		t.Fatalf("want too short, got %v", err)
	}

	err = uc.ChangePassword(context.Background(), "u1", dto.ChangePasswordRequest{
		CurrentPassword: "oldpassword",
		NewPassword:     "oldpassword",
	})
	if !errors.Is(err, ErrNewPasswordSameAsCurrent) {
		t.Fatalf("want same as current, got %v", err)
	}

	err = uc.ChangePassword(context.Background(), "u1", dto.ChangePasswordRequest{
		CurrentPassword: "oldpassword",
		NewPassword:     "newpassword",
	})
	if err != nil {
		t.Fatalf("change: %v", err)
	}
	if !pm.Verify("newpassword", users.users["u1"].Password) {
		t.Fatal("password not updated")
	}
}

func TestDeleteAccount_BlockOwnedEventsAndSuccess(t *testing.T) {
	user := &entities.User{ID: "u1", Email: "a@b.com", FirstName: "A", LastName: "B"}
	uc, _, _ := testProfileUC(user, true)

	err := uc.DeleteAccount(context.Background(), "u1", dto.DeleteAccountRequest{
		Password: "oldpassword", Confirmation: "DELETE",
	})
	if !errors.Is(err, ErrHasOwnedEvents) {
		t.Fatalf("want has_owned_events, got %v", err)
	}

	uc2, users, _ := testProfileUC(user, false)
	err = uc2.DeleteAccount(context.Background(), "u1", dto.DeleteAccountRequest{
		Password: "oldpassword", Confirmation: "delete",
	})
	if !errors.Is(err, ErrConfirmationRequired) {
		t.Fatalf("want confirmation_required, got %v", err)
	}

	err = uc2.DeleteAccount(context.Background(), "u1", dto.DeleteAccountRequest{
		Password: "wrong", Confirmation: "DELETE",
	})
	if !errors.Is(err, ErrInvalidPassword) {
		t.Fatalf("want invalid_password, got %v", err)
	}

	err = uc2.DeleteAccount(context.Background(), "u1", dto.DeleteAccountRequest{
		Password: "oldpassword", Confirmation: "DELETE",
	})
	if err != nil {
		t.Fatalf("delete: %v", err)
	}
	if _, ok := users.users["u1"]; ok {
		t.Fatal("user should be deleted")
	}
}
