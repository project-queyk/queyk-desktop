package users

import (
	postgres "queyk/internal/adapters/postgresql/sqlc"
	"queyk/internal/auth"
)

type Service struct {
	queries *postgres.Queries
	authSvc *auth.Service
}

type Pagination struct {
	Page            int   `json:"page"`
	PageSize        int   `json:"pageSize"`
	Total           int64 `json:"total"`
	TotalPages      int   `json:"totalPages"`
	HasNextPage     bool  `json:"hasNextPage"`
	HasPreviousPage bool  `json:"hasPreviousPage"`
}

type ListUsersResult struct {
	Data       []postgres.ListUsersRow `json:"data"`
	Pagination Pagination              `json:"pagination"`
}
