-- Add optional parent_id to event_comments for nested replies.
ALTER TABLE event_comments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES event_comments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_event_comments_parent_id ON event_comments(parent_id);
