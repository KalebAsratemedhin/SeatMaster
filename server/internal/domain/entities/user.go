package entities

import (
	"time"

	"github.com/KalebAsratemedhin/seatmaster/pkg/errors"
)

type User struct {
	ID        int64     `json:"id"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (u *User) Validate() error {
	if u.Email == "" {
		return errors.ErrInvalidEmail
	}
	if len(u.Password) < 8 {
		return errors.ErrPasswordTooShort
	}
	return nil
	
}