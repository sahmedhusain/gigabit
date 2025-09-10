-- +migrate Up
CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('private', 'group')),
    participant1_id INTEGER,
    participant2_id INTEGER,
    group_id INTEGER,
    last_message_id INTEGER,
    unread_count1 INTEGER DEFAULT 0,
    unread_count2 INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (participant2_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL,
    CHECK (
        (type = 'private' AND participant1_id IS NOT NULL AND participant2_id IS NOT NULL AND group_id IS NULL) OR
        (type = 'group' AND group_id IS NOT NULL AND participant1_id IS NULL AND participant2_id IS NULL)
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant1_id, participant2_id) WHERE type = 'private';
CREATE INDEX IF NOT EXISTS idx_conversations_group ON conversations(group_id) WHERE type = 'group';
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_id);
