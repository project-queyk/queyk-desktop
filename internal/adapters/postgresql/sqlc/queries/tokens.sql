-- name: CreateToken :one
INSERT INTO public."token" (
    token, type
) VALUES (
    $1, $2
)
RETURNING *;

-- name: GetToken :one
SELECT * FROM public."token"
WHERE id = $1;

-- name: GetTokenByType :one
SELECT * FROM public."token"
WHERE type = $1;
