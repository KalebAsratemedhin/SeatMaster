ALTER TABLE event_invites
    ADD COLUMN IF NOT EXISTS guest_seat_id BIGINT REFERENCES event_seats(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_event_invites_guest_seat_id ON event_invites(guest_seat_id);
