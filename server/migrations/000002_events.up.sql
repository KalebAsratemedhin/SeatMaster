CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    banner_url TEXT NOT NULL DEFAULT '',
    visibility VARCHAR(50) NOT NULL DEFAULT 'public',
    location VARCHAR(500) NOT NULL DEFAULT '',
    latitude DOUBLE PRECISION NOT NULL DEFAULT 0,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 0,
    event_type VARCHAR(100) NOT NULL DEFAULT 'other',
    message TEXT NOT NULL DEFAULT '',
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_owner_id ON events(owner_id);
CREATE INDEX IF NOT EXISTS idx_events_visibility ON events(visibility);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_name ON events(name);

CREATE TABLE IF NOT EXISTS event_invites (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_invites_user_id ON event_invites(user_id);
CREATE INDEX IF NOT EXISTS idx_event_invites_event_id ON event_invites(event_id);
