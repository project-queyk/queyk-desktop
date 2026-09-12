-- name: CreateEarthquake :one
INSERT INTO public."earthquake" (
    magnitude, duration
) VALUES (
    $1, $2
)
RETURNING *;

-- name: GetEarthquake :one
SELECT * FROM public."earthquake"
WHERE id = $1;

-- name: ListEarthquakes :many
SELECT id, magnitude, duration, created_at,
    CASE
        WHEN magnitude < 4.0 THEN 'minor'
        WHEN magnitude < 6.0 THEN 'moderate'
        WHEN magnitude < 8.0 THEN 'major'
        ELSE 'severe'
    END AS risk_level
FROM public."earthquake"
ORDER BY created_at ASC;

-- name: ListEarthquakesByDateRange :many
SELECT * FROM public."earthquake"
WHERE created_at >= $1 AND created_at <= $2;
