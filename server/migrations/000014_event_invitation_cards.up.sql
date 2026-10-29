-- One invitation card design per event (owner-edited; public when published).
CREATE TABLE IF NOT EXISTS event_invitation_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
    template_id VARCHAR(64) NOT NULL,
    headline VARCHAR(200),
    host_line VARCHAR(200),
    body_message TEXT,
    accent_key VARCHAR(32),
    show_banner BOOLEAN NOT NULL DEFAULT TRUE,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_invitation_cards_event_id ON event_invitation_cards(event_id);
