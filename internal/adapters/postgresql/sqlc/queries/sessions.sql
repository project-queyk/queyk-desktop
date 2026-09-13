-- name: GetSessionByToken :one
SELECT * FROM session
WHERE token = $1 AND expires_at > now()
LIMIT 1;

-- name: GetAuthContextByToken :one
SELECT
    s.id AS session_id,
    s.user_id,
    s.expires_at,
    u.role AS user_role
FROM session s
INNER JOIN "user" u ON u.id = s.user_id
WHERE s.token = $1 AND s.expires_at > now()
LIMIT 1;
