DROP INDEX IF EXISTS idx_event_comments_parent_id;
ALTER TABLE event_comments DROP COLUMN IF EXISTS parent_id;
