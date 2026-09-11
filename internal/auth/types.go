package auth

import (
	"sync"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type Service struct {
	mu         sync.Mutex
	authWindow *application.WebviewWindow
}
