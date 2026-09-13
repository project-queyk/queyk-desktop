-- +goose Up
CREATE TABLE IF NOT EXISTS public."session" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  token text UNIQUE NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  ip_address TEXT null,
  user_agent TEXT null,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- +goose Down
DROP TABLE IF EXISTS public."session";
