package users

import (
	"context"
	"errors"
	postgres "queyk/internal/adapters/postgresql/sqlc"
	"queyk/internal/uuid"
	"queyk/internal/validator"

	"github.com/jackc/pgx/v5/pgtype"
)

func NewService(q *postgres.Queries) *Service {
	return &Service{queries: q}
}

func (s *Service) GetUser(id string) (postgres.User, error) {
	u, err := uuid.Parse(id)
	if err != nil {
		return postgres.User{}, err
	}

	return s.queries.GetUser(context.Background(), u)
}

func (s *Service) ListUsers(name string, page, pageSize int) (ListUsersResult, error) {
	if page < 1 {
		page = 1
	}

	if pageSize < 1 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize

	rows, err := s.queries.ListUsers(context.Background(), postgres.ListUsersParams{
		Column1: name,
		Limit:   int32(pageSize),
		Offset:  int32(offset),
	})
	if err != nil {
		return ListUsersResult{}, err
	}

	var total int64
	if len(rows) > 0 {
		total = rows[0].TotalCount
	}

	totalPages := 0
	if total > 0 {
		totalPages = int((total + int64(pageSize) - 1) / int64(pageSize))
	}

	return ListUsersResult{
		Data: rows,
		Pagination: Pagination{
			Page:            page,
			PageSize:        pageSize,
			Total:           total,
			TotalPages:      totalPages,
			HasNextPage:     page < totalPages,
			HasPreviousPage: page > 1,
		},
	}, nil
}

func (s *Service) UpdateUserRole(id, role string) (postgres.User, error) {
	u, err := uuid.Parse(id)
	if err != nil {
		return postgres.User{}, err
	}

	if !(role == "admin" || role == "user") {
		return postgres.User{}, errors.New("invalid role parameter")
	}

	return s.queries.UpdateUserRole(context.Background(), postgres.UpdateUserRoleParams{ID: u, Role: role})
}

func (s *Service) UpdateUserAlertNotification(id string, enabled bool) (postgres.User, error) {
	u, err := uuid.Parse(id)
	if err != nil {
		return postgres.User{}, err
	}

	return s.queries.UpdateUserAlertNotification(context.Background(), postgres.UpdateUserAlertNotificationParams{ID: u, AlertNotification: enabled})
}

func (s *Service) UpdateUserSMSNotification(id string, enabled bool) (postgres.User, error) {
	u, err := uuid.Parse(id)
	if err != nil {
		return postgres.User{}, err
	}

	return s.queries.UpdateUserSMSNotification(context.Background(), postgres.UpdateUserSMSNotificationParams{ID: u, SmsNotification: enabled})
}

func (s *Service) UpdateUserPhoneNumber(id, phone string) (postgres.User, error) {
	if err := validator.ValidatePHMobile(phone); err != nil {
		return postgres.User{}, err
	}

	u, err := uuid.Parse(id)
	if err != nil {
		return postgres.User{}, err
	}

	return s.queries.UpdateUserPhoneNumber(context.Background(), postgres.UpdateUserPhoneNumberParams{ID: u, PhoneNumber: pgtype.Text{String: phone, Valid: true}})
}

func (s *Service) RemoveUserPhoneNumber(id string) (postgres.User, error) {
	u, err := uuid.Parse(id)
	if err != nil {
		return postgres.User{}, err
	}

	return s.queries.RemoveUserPhoneNumber(context.Background(), u)
}

func (s *Service) DeleteUser(id string) (postgres.User, error) {
	u, err := uuid.Parse(id)
	if err != nil {
		return postgres.User{}, err
	}

	return s.queries.DeleteUser(context.Background(), u)
}
