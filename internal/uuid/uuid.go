package uuid

import (
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
)

func Parse(s string) (pgtype.UUID, error) {
	var u pgtype.UUID
	err := u.Scan(s)
	if err != nil {
		return u, fmt.Errorf("failed to parse string to uuid: %w", err)
	}

	return u, nil
}
