-- +goose Up
CREATE TABLE IF NOT EXISTS public."token" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL UNIQUE,
    token text NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- +goose Down
DROP TABLE IF EXISTS public."token";
