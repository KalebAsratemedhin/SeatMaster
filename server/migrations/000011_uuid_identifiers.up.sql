-- Use UUID as primary keys and foreign keys instead of bigint/serial.

-- 1. Add new UUID columns to all tables
ALTER TABLE users ADD COLUMN id_new UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE events ADD COLUMN id_new UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE events ADD COLUMN owner_id_new UUID;
UPDATE events SET owner_id_new = (SELECT id_new FROM users WHERE users.id = events.owner_id);

ALTER TABLE event_tables ADD COLUMN id_new UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE event_tables ADD COLUMN event_id_new UUID;
UPDATE event_tables SET event_id_new = (SELECT id_new FROM events WHERE events.id = event_tables.event_id);

ALTER TABLE event_seats ADD COLUMN id_new UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE event_seats ADD COLUMN event_table_id_new UUID;
UPDATE event_seats SET event_table_id_new = (SELECT id_new FROM event_tables WHERE event_tables.id = event_seats.event_table_id);

ALTER TABLE event_invites ADD COLUMN id_new UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE event_invites ADD COLUMN event_id_new UUID;
ALTER TABLE event_invites ADD COLUMN user_id_new UUID;
ALTER TABLE event_invites ADD COLUMN seat_id_new UUID;
ALTER TABLE event_invites ADD COLUMN guest_seat_id_new UUID;
UPDATE event_invites SET event_id_new = (SELECT id_new FROM events WHERE events.id = event_invites.event_id);
UPDATE event_invites SET user_id_new = (SELECT id_new FROM users WHERE users.id = event_invites.user_id) WHERE event_invites.user_id IS NOT NULL;
UPDATE event_invites SET seat_id_new = (SELECT id_new FROM event_seats WHERE event_seats.id = event_invites.seat_id) WHERE event_invites.seat_id IS NOT NULL;
UPDATE event_invites SET guest_seat_id_new = (SELECT id_new FROM event_seats WHERE event_seats.id = event_invites.guest_seat_id) WHERE event_invites.guest_seat_id IS NOT NULL;

-- 2. Drop all foreign key constraints
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_owner_id_fkey;
ALTER TABLE event_tables DROP CONSTRAINT IF EXISTS event_tables_event_id_fkey;
ALTER TABLE event_seats DROP CONSTRAINT IF EXISTS event_seats_event_table_id_fkey;
ALTER TABLE event_invites DROP CONSTRAINT IF EXISTS event_invites_event_id_fkey;
ALTER TABLE event_invites DROP CONSTRAINT IF EXISTS event_invites_user_id_fkey;
ALTER TABLE event_invites DROP CONSTRAINT IF EXISTS event_invites_seat_id_fkey;
ALTER TABLE event_invites DROP CONSTRAINT IF EXISTS event_invites_guest_seat_id_fkey;

-- 3. Drop old id / FK columns and rename new ones (child tables first for id)
ALTER TABLE event_invites DROP COLUMN event_id;
ALTER TABLE event_invites RENAME COLUMN event_id_new TO event_id;
ALTER TABLE event_invites DROP COLUMN user_id;
ALTER TABLE event_invites RENAME COLUMN user_id_new TO user_id;
ALTER TABLE event_invites DROP COLUMN seat_id;
ALTER TABLE event_invites RENAME COLUMN seat_id_new TO seat_id;
ALTER TABLE event_invites DROP COLUMN guest_seat_id;
ALTER TABLE event_invites RENAME COLUMN guest_seat_id_new TO guest_seat_id;
ALTER TABLE event_invites DROP CONSTRAINT event_invites_pkey;
ALTER TABLE event_invites DROP COLUMN id;
ALTER TABLE event_invites RENAME COLUMN id_new TO id;
ALTER TABLE event_invites ADD PRIMARY KEY (id);
ALTER TABLE event_invites ALTER COLUMN event_id SET NOT NULL;

ALTER TABLE event_seats DROP COLUMN event_table_id;
ALTER TABLE event_seats RENAME COLUMN event_table_id_new TO event_table_id;
ALTER TABLE event_seats DROP CONSTRAINT event_seats_pkey;
ALTER TABLE event_seats DROP COLUMN id;
ALTER TABLE event_seats RENAME COLUMN id_new TO id;
ALTER TABLE event_seats ADD PRIMARY KEY (id);
ALTER TABLE event_seats ALTER COLUMN event_table_id SET NOT NULL;

ALTER TABLE event_tables DROP COLUMN event_id;
ALTER TABLE event_tables RENAME COLUMN event_id_new TO event_id;
ALTER TABLE event_tables DROP CONSTRAINT event_tables_pkey;
ALTER TABLE event_tables DROP COLUMN id;
ALTER TABLE event_tables RENAME COLUMN id_new TO id;
ALTER TABLE event_tables ADD PRIMARY KEY (id);
ALTER TABLE event_tables ALTER COLUMN event_id SET NOT NULL;

ALTER TABLE events DROP COLUMN owner_id;
ALTER TABLE events RENAME COLUMN owner_id_new TO owner_id;
ALTER TABLE events DROP CONSTRAINT events_pkey;
ALTER TABLE events DROP COLUMN id;
ALTER TABLE events RENAME COLUMN id_new TO id;
ALTER TABLE events ADD PRIMARY KEY (id);
ALTER TABLE events ALTER COLUMN owner_id SET NOT NULL;

ALTER TABLE users DROP CONSTRAINT users_pkey;
ALTER TABLE users DROP COLUMN id;
ALTER TABLE users RENAME COLUMN id_new TO id;
ALTER TABLE users ADD PRIMARY KEY (id);

-- 4. Re-add foreign keys
ALTER TABLE events ADD CONSTRAINT events_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE event_tables ADD CONSTRAINT event_tables_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
ALTER TABLE event_seats ADD CONSTRAINT event_seats_event_table_id_fkey FOREIGN KEY (event_table_id) REFERENCES event_tables(id) ON DELETE CASCADE;
ALTER TABLE event_invites ADD CONSTRAINT event_invites_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
ALTER TABLE event_invites ADD CONSTRAINT event_invites_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE event_invites ADD CONSTRAINT event_invites_seat_id_fkey FOREIGN KEY (seat_id) REFERENCES event_seats(id) ON DELETE SET NULL;
ALTER TABLE event_invites ADD CONSTRAINT event_invites_guest_seat_id_fkey FOREIGN KEY (guest_seat_id) REFERENCES event_seats(id) ON DELETE SET NULL;

-- 5. Recreate indexes that referenced old id (indexes on PK are automatic; these are for FKs)
CREATE INDEX IF NOT EXISTS idx_events_owner_id ON events(owner_id);
CREATE INDEX IF NOT EXISTS idx_event_tables_event_id ON event_tables(event_id);
CREATE INDEX IF NOT EXISTS idx_event_seats_event_table_id ON event_seats(event_table_id);
CREATE INDEX IF NOT EXISTS idx_event_invites_event_id ON event_invites(event_id);
CREATE INDEX IF NOT EXISTS idx_event_invites_user_id ON event_invites(user_id);
CREATE INDEX IF NOT EXISTS idx_event_invites_seat_id ON event_invites(seat_id);
CREATE INDEX IF NOT EXISTS idx_event_invites_guest_seat_id ON event_invites(guest_seat_id);
