package validator

import (
	"errors"
	"regexp"
)

var phMobileRegex = regexp.MustCompile(`^(?:\+63|0)9\d{9}$`)

var ErrInvalidPHPhone = errors.New("invalid mobile phone number for en-PH locale")

func ValidatePHMobile(phone string) error {
	if !phMobileRegex.MatchString(phone) {
		return ErrInvalidPHPhone
	}

	return nil
}
