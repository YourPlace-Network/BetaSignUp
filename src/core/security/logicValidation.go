package security

import (
	"github.com/algorand/go-algorand-sdk/v2/types"
	"net/mail"
)

func ValidateEmail(address string) bool {
	_, err := mail.ParseAddress(address)
	return err == nil
}

func ValidateAlgoAddress(address string) bool {
	_, err := types.DecodeAddress(address)
	if err != nil {
		return false
	}
	return true
}
