package main

import (
	"context"
	"embed"
	postgres "queyk/internal/adapters/postgresql/sqlc"
	"queyk/internal/auth"
	"queyk/internal/dashboard"
	"queyk/internal/envutil"
	"queyk/internal/users"

	"log"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

func init() {
	application.RegisterEvent[string]("time")
	application.RegisterEvent[string]("auth-window-closed")
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("failed to load .env file: %v", err)
	}

	dbUrl := envutil.GetRequired("DATABASE_URL")

	ctx := context.Background()

	config, err := pgxpool.ParseConfig(dbUrl)
	if err != nil {
		log.Fatalf("failed to parse db config: %v", err)
	}
	config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeExec

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		log.Fatalf("failed to create db pool: %v", err)
	}
	defer pool.Close()

	queries := postgres.New(pool)

	userSvc := users.NewService(queries)
	dashboardSvc := dashboard.NewService(queries)

	app := application.New(application.Options{
		Name:        "Queyk",
		Description: "Desktop client for Queyk",
		Services: []application.Service{
			application.NewService(&auth.Service{}),
			application.NewService(userSvc),
			application.NewService(dashboardSvc),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Linux: application.LinuxOptions{
			ProgramName: "queyk",
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:  "Queyk",
		Width:  1000,
		Height: 618,
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGB(6, 7, 15),
		URL:              "/",
	})

	go func() {
		for {
			now := time.Now().Format(time.RFC1123)
			app.Event.Emit("time", now)
			time.Sleep(time.Second)
		}
	}()

	err = app.Run()

	if err != nil {
		log.Fatal(err)
	}
}
