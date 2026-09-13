package auth

import (
	postgres "queyk/internal/adapters/postgresql/sqlc"
	"sync"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type Service struct {
	mu         sync.Mutex
	queries    *postgres.Queries
	authWindow *application.WebviewWindow
}
