package dashboard

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"
	postgres "queyk/internal/adapters/postgresql/sqlc"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

func NewService(q *postgres.Queries) *Service {
	return &Service{queries: q}
}

func GetSeismicRiskLevel(si float64) string {
	if si < 0.5 {
		return "normal"
	}
	if si <= 1.0 {
		return "elevated"
	}
	return "concerning"
}

func IsSeismicSafe(si float64) bool {
	return si < 1.0
}

func GetEarthquakeRiskLevel(magnitude float64) string {
	if magnitude < 4.0 {
		return "minor"
	}
	if magnitude < 6.0 {
		return "moderate"
	}
	if magnitude < 8.0 {
		return "major"
	}
	return "severe"
}

func (s *Service) GetReadingsOverview(startDate, endDate string) (ReadingsOverviewResult, error) {
	ctx := context.Background()

	startTime, err := time.Parse(time.RFC3339, startDate)
	if err != nil {
		return ReadingsOverviewResult{}, fmt.Errorf("invalid start date: %w", err)
	}

	endTime, err := time.Parse(time.RFC3339, endDate)
	if err != nil {
		return ReadingsOverviewResult{}, fmt.Errorf("invalid end date: %w", err)
	}

	startTz := pgtype.Timestamptz{Time: startTime, Valid: true}
	endTz := pgtype.Timestamptz{Time: endTime, Valid: true}

	rawReadings, err := s.queries.ListReadingsByDateRange(ctx, postgres.ListReadingsByDateRangeParams{
		CreatedAt:   startTz,
		CreatedAt_2: endTz,
	})
	if err != nil {
		return ReadingsOverviewResult{}, fmt.Errorf("failed to fetch readings: %w", err)
	}

	items := make([]ReadingItem, len(rawReadings))
	for i, r := range rawReadings {
		items[i] = ReadingItem{
			ID:             r.ID.String(),
			SiAverage:      r.SiAverage,
			SiMinimum:      r.SiMinimum,
			SiMaximum:      r.SiMaximum,
			Battery:        r.Battery,
			SignalStrength: r.SignalStrength,
			CreatedAt:      r.CreatedAt.Time,
			RiskLevel:      GetSeismicRiskLevel(r.SiMaximum),
			IsSafe:         IsSeismicSafe(r.SiMaximum),
		}
	}

	var firstDate *time.Time
	if firstTz, err := s.queries.GetFirstReadingDate(ctx); err == nil && firstTz.Valid {
		firstDate = &firstTz.Time
	}

	var batteryLevel float64
	if latestBattery, err := s.queries.GetLatestBatteryLevel(ctx); err == nil {
		if time.Since(latestBattery.CreatedAt.Time) <= 6*time.Minute {
			batteryLevel = latestBattery.Battery
		}
	}

	return ReadingsOverviewResult{
		Data:         items,
		FirstDate:    firstDate,
		BatteryLevel: batteryLevel,
	}, nil
}

func (s *Service) ListEarthquakes() ([]postgres.ListEarthquakesRow, error) {
	return s.queries.ListEarthquakes(context.Background())
}

func (s *Service) SavePDFReport(filePath string, base64Content string) error {
	data, err := base64.StdEncoding.DecodeString(base64Content)
	if err != nil {
		return fmt.Errorf("failed to decode base64: %w", err)
	}
	return os.WriteFile(filePath, data, 0644)
}
