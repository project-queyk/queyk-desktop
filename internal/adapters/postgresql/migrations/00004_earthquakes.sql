-- +goose Up
CREATE TABLE IF NOT EXISTS public."earthquake" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    magnitude DOUBLE PRECISION NOT NULL,
    duration SMALLINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL default now()
);

-- +goose Down
DROP TABLE IF EXISTS public."earthquake";
