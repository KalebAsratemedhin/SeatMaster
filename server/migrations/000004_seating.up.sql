-- Event tables (e.g. "Table 01") with capacity
CREATE TABLE IF NOT EXISTS event_tables (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL DEFAULT 4,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_tables_event_id ON event_tables(event_id);

-- Individual seats per table (e.g. "Seat 1" at Table 01)
CREATE TABLE IF NOT EXISTS event_seats (
    id BIGSERIAL PRIMARY KEY,
    event_table_id BIGINT NOT NULL REFERENCES event_tables(id) ON DELETE CASCADE,
    label VARCHAR(50) NOT NULL DEFAULT '1',
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_seats_event_table_id ON event_seats(event_table_id);

-- Allow invite to reference a chosen seat (guest picks seat when RSVPing)
ALTER TABLE event_invites
    ADD COLUMN IF NOT EXISTS seat_id BIGINT REFERENCES event_seats(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_event_invites_seat_id ON event_invites(seat_id);
