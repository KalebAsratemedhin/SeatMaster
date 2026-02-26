DROP INDEX IF EXISTS idx_event_invites_event_id_email;

ALTER TABLE event_invites
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE event_invites
    ADD CONSTRAINT event_invites_event_id_user_id_key UNIQUE (event_id, user_id);
