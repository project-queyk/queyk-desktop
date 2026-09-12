-- +goose Up
CREATE TABLE IF NOT EXISTS public."user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oauth_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    profile_image TEXT NOT NULL,
    is_in_school BOOLEAN,
    expo_push_token TEXT,
    web_push_subscription JSONB,
    alert_notification BOOLEAN NOT NULL DEFAULT true,
    push_notification BOOLEAN NOT NULL DEFAULT false,
    sms_notification BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE IF EXISTS public."user";
