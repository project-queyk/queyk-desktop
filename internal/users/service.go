package users

import (
	"context"
	"errors"
	postgres "queyk/internal/adapters/postgresql/sqlc"
	"queyk/internal/auth"
	"queyk/internal/uuid"
	"queyk/internal/validator"

	"github.com/jackc/pgx/v5/pgtype"
)

func NewService(q *postgres.Queries, authSvc *auth.Service) *Service {
	return &Service{queries: q, authSvc: authSvc}
}

func (s *Service) GetUser(token, id string) (postgres.User, error) {
	ctx := context.Background()

	authCtx, err := s.authSvc.GetAuthContext(ctx, token)
	if err != nil {
		return postgres.User{}, err
	}

	u, err := uuid.Parse(id)
	if err != nil {
		return postgres.User{}, err
	}

	isSelf := (authCtx.UserID == u)
	isAdmin := (authCtx.UserRole == "admin")

	if !isSelf && !isAdmin {
		return postgres.User{}, errors.New("forbidden: insufficient permissions")
	}

	return s.queries.GetUser(ctx, u)
}

func (s *Service) ListUsers(token, name string, page, pageSize int) (ListUsersResult, error) {
	ctx := context.Background()

	authCtx, err := s.authSvc.GetAuthContext(ctx, token)
	if err != nil {
		return ListUsersResult{}, err
	}

	if authCtx.UserRole != "admin" {
		return ListUsersResult{}, errors.New("forbidden: insufficient permissions")
	}

	if page < 1 {
		page = 1
	}

	if pageSize < 1 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize

	rows, err := s.queries.ListUsers(ctx, postgres.ListUsersParams{
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

func (s *Service) UpdateUserRole(token, id, role string) (postgres.User, error) {
	ctx := context.Background()

	authCtx, err := s.authSvc.GetAuthContext(ctx, token)
	if err != nil {
		return postgres.User{}, err
	}

	if authCtx.UserRole != "admin" {
		return postgres.User{}, errors.New("forbidden: insufficient permissions")
	}

	u, err := uuid.Parse(id)
	if err != nil {
		return postgres.User{}, err
	}

	if !(role == "admin" || role == "user") {
		return postgres.User{}, errors.New("invalid role parameter")
	}

	return s.queries.UpdateUserRole(ctx, postgres.UpdateUserRoleParams{ID: u, Role: role})
}

func (s *Service) UpdateUserAlertNotification(token, id string, enabled bool) (postgres.User, error) {
	ctx := context.Background()

	authCtx, err := s.authSvc.GetAuthContext(ctx, token)
	if err != nil {
		return postgres.User{}, err
	}

	userUUID, err := uuid.Parse(id)
	if err != nil {
		return postgres.User{}, err
	}

	isSelf := (authCtx.UserID == userUUID)
	isAdmin := (authCtx.UserRole == "admin")

	if !isSelf && !isAdmin {
		return postgres.User{}, errors.New("forbidden: insufficient permissions")
	}

	return s.queries.UpdateUserAlertNotification(ctx, postgres.UpdateUserAlertNotificationParams{ID: userUUID, AlertNotification: enabled})
}

func (s *Service) UpdateUserSMSNotification(token, id string, enabled bool) (postgres.User, error) {
	ctx := context.Background()

	authCtx, err := s.authSvc.GetAuthContext(ctx, token)
	if err != nil {
		return postgres.User{}, err
	}

	userUUID, err := uuid.Parse(id)
	if err != nil {
		return postgres.User{}, err
	}

	isSelf := (authCtx.UserID == userUUID)
	isAdmin := (authCtx.UserRole == "admin")

	if !isSelf && !isAdmin {
		return postgres.User{}, errors.New("forbidden: insufficient permissions")
	}

	return s.queries.UpdateUserSMSNotification(ctx, postgres.UpdateUserSMSNotificationParams{ID: userUUID, SmsNotification: enabled})
}

func (s *Service) UpdateUserPhoneNumber(token, id, phone string) (postgres.User, error) {
	if err := validator.ValidatePHMobile(phone); err != nil {
		return postgres.User{}, err
	}

	ctx := context.Background()

	authCtx, err := s.authSvc.GetAuthContext(ctx, token)
	if err != nil {
		return postgres.User{}, err
	}

	userUUID, err := uuid.Parse(id)
	if err != nil {
		return postgres.User{}, err
	}

	isSelf := (authCtx.UserID == userUUID)
	isAdmin := (authCtx.UserRole == "admin")

	if !isSelf && !isAdmin {
		return postgres.User{}, errors.New("forbidden: insufficient permissions")
	}

	return s.queries.UpdateUserPhoneNumber(ctx, postgres.UpdateUserPhoneNumberParams{ID: userUUID, PhoneNumber: pgtype.Text{String: phone, Valid: true}})
}

func (s *Service) RemoveUserPhoneNumber(token, id string) (postgres.User, error) {
	ctx := context.Background()

	authCtx, err := s.authSvc.GetAuthContext(ctx, token)
	if err != nil {
		return postgres.User{}, err
	}

	userUUID, err := uuid.Parse(id)
	if err != nil {
		return postgres.User{}, err
	}

	isSelf := (authCtx.UserID == userUUID)
	isAdmin := (authCtx.UserRole == "admin")

	if !isSelf && !isAdmin {
		return postgres.User{}, errors.New("forbidden: insufficient permissions")
	}

	return s.queries.RemoveUserPhoneNumber(ctx, userUUID)
}

func (s *Service) DeleteUser(token, id string) (postgres.User, error) {
	ctx := context.Background()

	authCtx, err := s.authSvc.GetAuthContext(ctx, token)
	if err != nil {
		return postgres.User{}, err
	}

	if authCtx.UserRole != "admin" {
		return postgres.User{}, errors.New("forbidden: insufficient permissions")
	}

	u, err := uuid.Parse(id)
	if err != nil {
		return postgres.User{}, err
	}

	return s.queries.DeleteUser(ctx, u)
}
