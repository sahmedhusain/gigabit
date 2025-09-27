-- +migrate Up
CREATE TABLE IF NOT EXISTS group_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    last_message_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_conversations_group ON group_conversations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_conversations_updated_at ON group_conversations(updated_at DESC);
