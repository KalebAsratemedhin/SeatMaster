-- Allow inviting by email without a platform account (user_id nullable).
-- One invite per event per email; link user_id when they sign up / log in.
ALTER TABLE event_invites
    DROP CONSTRAINT IF EXISTS event_invites_event_id_user_id_key;

ALTER TABLE event_invites
    ALTER COLUMN user_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_invites_event_id_email
    ON event_invites(event_id, LOWER(email));
