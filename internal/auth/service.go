package auth

import (
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

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

	win.OnWindowEvent(events.Common.WindowClosing, func(event *application.WindowEvent) {
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
