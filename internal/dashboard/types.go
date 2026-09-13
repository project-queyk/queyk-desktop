package dashboard

import (
	postgres "queyk/internal/adapters/postgresql/sqlc"
	"queyk/internal/auth"
	"time"
)

type ReadingItem struct {
	ID             string    `json:"id"`
	SiAverage      float64   `json:"siAverage"`
	SiMinimum      float64   `json:"siMinimum"`
	SiMaximum      float64   `json:"siMaximum"`
	Battery        float64   `json:"battery"`
	SignalStrength string    `json:"signalStrength"`
	CreatedAt      time.Time `json:"createdAt"`
	RiskLevel      string    `json:"riskLevel"`
	IsSafe         bool      `json:"isSafe"`
}

type ReadingsOverviewResult struct {
	Data         []ReadingItem `json:"data"`
	FirstDate    *time.Time    `json:"firstDate"`
	BatteryLevel float64       `json:"batteryLevel"`
}

type EarthquakeItem struct {
	ID        string    `json:"id"`
	Magnitude float64   `json:"magnitude"`
	Duration  int16     `json:"duration"`
	CreatedAt time.Time `json:"createdAt"`
	RiskLevel string    `json:"riskLevel"`
}

type Service struct {
	queries *postgres.Queries
	authSvc *auth.Service
}
