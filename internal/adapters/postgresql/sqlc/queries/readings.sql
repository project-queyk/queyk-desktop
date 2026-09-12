-- name: CreateReading :one
INSERT INTO public."reading" (
    si_average, si_minimum, si_maximum, battery, signal_strength
) VALUES (
    $1, $2, $3, $4, $5
)
RETURNING *;

-- name: GetReading :one
SELECT * FROM public."reading"
WHERE id = $1;

-- name: ListReadings :many
SELECT * FROM public."reading";

-- name: ListReadingsByDateRange :many
SELECT * FROM public."reading"
WHERE created_at >= $1 AND created_at <= $2
ORDER BY created_at ASC;

-- name: GetFirstReadingDate :one
SELECT created_at AS first_date FROM public."reading"
ORDER BY created_at ASC
LIMIT 1;

-- name: GetLastReadingDate :one
SELECT created_at AS last_date FROM public."reading"
ORDER BY created_at DESC
LIMIT 1;

-- name: GetLatestBatteryLevel :one
SELECT battery, created_at FROM public."reading"
ORDER BY created_at DESC
LIMIT 1;
