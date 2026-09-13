package auth

import (
	"context"
	"errors"
	"fmt"
	postgres "queyk/internal/adapters/postgresql/sqlc"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

func NewService(q *postgres.Queries) *Service {
	return &Service{queries: q}
}

func (s *Service) OpenAuthWindow(url string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.authWindow != nil {
		win := s.authWindow
		s.authWindow = nil
		time.AfterFunc(100*time.Millisecond, func() {
			win.Close()
		})
	}

	app := application.Get()
	if app == nil {
		return
	}

	win := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:       "Sign in with Google",
		Width:       500,
		Height:      650,
		AlwaysOnTop: true,
		URL:         url,
	})

	s.authWindow = win

	win.OnWindowEvent(events.Common.WindowClosing, func(e *application.WindowEvent) {
		s.mu.Lock()
		s.authWindow = nil
		s.mu.Unlock()
		app.Event.Emit("auth-window-closed", "closed")
	})

	win.Center()
	win.Focus()
}

func (s *Service) CloseAuthWindow() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.authWindow != nil {
		win := s.authWindow
		s.authWindow = nil
		time.AfterFunc(100*time.Millisecond, func() {
			win.Close()
		})
	}
}

func (s *Service) GetAuthContext(ctx context.Context, token string) (postgres.GetAuthContextByTokenRow, error) {
	if token == "" {
		return postgres.GetAuthContextByTokenRow{}, errors.New("missing token")
	}

	authCtx, err := s.queries.GetAuthContextByToken(ctx, token)
	if err != nil {
		return postgres.GetAuthContextByTokenRow{}, fmt.Errorf("invalid or expired session: %w", err)
	}

	return authCtx, nil
}
