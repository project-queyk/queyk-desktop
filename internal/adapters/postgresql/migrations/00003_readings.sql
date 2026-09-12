-- +goose Up
CREATE TABLE IF NOT EXISTS public."reading" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    si_average DOUBLE PRECISION NOT NULL,
    si_minimum DOUBLE PRECISION NOT NULL,
    si_maximum DOUBLE PRECISION NOT NULL,
    battery DOUBLE PRECISION NOT NULL,
    signal_strength TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE IF EXISTS public."reading";
