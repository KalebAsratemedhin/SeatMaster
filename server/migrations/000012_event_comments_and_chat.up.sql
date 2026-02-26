-- Public comments on an event (visible to anyone with event access).
CREATE TABLE IF NOT EXISTS event_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_event_comments_event_id ON event_comments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_created_at ON event_comments(created_at);

-- 1:1 chat thread between event owner and one guest (per event).
CREATE TABLE IF NOT EXISTS event_chat_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, guest_id)
);
CREATE INDEX IF NOT EXISTS idx_event_chat_threads_event_id ON event_chat_threads(event_id);
CREATE INDEX IF NOT EXISTS idx_event_chat_threads_owner_id ON event_chat_threads(owner_id);
CREATE INDEX IF NOT EXISTS idx_event_chat_threads_guest_id ON event_chat_threads(guest_id);

-- Messages in a chat thread (private 1:1).
CREATE TABLE IF NOT EXISTS event_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES event_chat_threads(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_event_chat_messages_thread_id ON event_chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_event_chat_messages_created_at ON event_chat_messages(created_at);
