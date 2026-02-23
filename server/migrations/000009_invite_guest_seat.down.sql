DROP INDEX IF EXISTS idx_event_invites_guest_seat_id;
ALTER TABLE event_invites DROP COLUMN IF EXISTS guest_seat_id;
