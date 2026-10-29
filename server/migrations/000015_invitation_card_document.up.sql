ALTER TABLE event_invitation_cards
    ADD COLUMN IF NOT EXISTS document JSONB;
