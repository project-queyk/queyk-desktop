-- name: CreateUser :one
INSERT INTO public."user" (
    name, email, oauth_id, profile_image
) VALUES (
    $1, $2, $3, $4
)
RETURNING *;

-- name: GetUser :one
SELECT * FROM public."user"
WHERE id = $1;

-- name: GetUserByEmailAndOAuthID :one
SELECT * FROM public."user"
WHERE email = $1 AND oauth_id = $2;

-- name: ListUsers :many
SELECT
    *,
    count(*) OVER() AS total_count
FROM public."user"
WHERE ($1::text = '' OR name ILIKE '%' || $1 || '%')
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: ListSMSPhoneNumbers :many
SELECT DISTINCT phone_number::text AS phone_number
FROM public."user"
WHERE sms_notification = true AND phone_number IS NOT NULL;

-- name: ListActivePushTokens :many
SELECT expo_push_token::text AS token, name
FROM public."user"
WHERE push_notification = true AND expo_push_token IS NOT NULL;

-- name: ListAdminActivePushTokens :many
SELECT expo_push_token::text AS token, name
FROM public."user"
WHERE push_notification = true AND role = 'admin' AND expo_push_token IS NOT NULL;

-- name: ListAlertNotificationEmails :many
SELECT email, name FROM public."user"
WHERE alert_notification = true;

-- name: UpdateUserRole :one
UPDATE public."user"
SET role = $2
WHERE id = $1
RETURNING *;

-- name: UpdateUserIsInSchool :one
UPDATE public."user"
SET is_in_school = $2
WHERE id = $1
RETURNING *;

-- name: UpdateUserPhoneNumber :one
UPDATE public."user"
SET phone_number = $2
WHERE id = $1
RETURNING *;

-- name: RemoveUserPhoneNumber :one
UPDATE public."user"
SET phone_number = NULL, sms_notification = false
WHERE id = $1
RETURNING *;

-- name: UpdateUserWebPushSubscription :one
UPDATE public."user"
SET web_push_subscription = $2
WHERE id = $1
RETURNING *;

-- name: RemoveUserWebPushSubscription :one
UPDATE public."user"
SET web_push_subscription = NULL
WHERE id = $1
RETURNING *;

-- name: UpdateUserSMSNotification :one
UPDATE public."user"
SET sms_notification = $2
WHERE id = $1
RETURNING *;

-- name: UpdateUserAlertNotification :one
UPDATE public."user"
SET alert_notification = $2
WHERE id = $1
RETURNING *;

-- name: UpdateUserPushNotification :one
UPDATE public."user"
SET push_notification = $2
WHERE id = $1
RETURNING *;

-- name: UpdateUserExpoPushToken :one
UPDATE public."user"
SET expo_push_token = $2
WHERE id = $1
RETURNING *;

-- name: DeleteUser :one
DELETE FROM public."user"
WHERE id = $1
RETURNING *;
