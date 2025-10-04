-- +migrate Up
CREATE TABLE IF NOT EXISTS private_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant1_id INTEGER NOT NULL,
    participant2_id INTEGER NOT NULL,
    last_message_id INTEGER,
    unread_count1 INTEGER DEFAULT 0,
    unread_count2 INTEGER DEFAULT 0,
    participant1_deleted BOOLEAN DEFAULT FALSE,
    participant2_deleted BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (participant2_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_private_conversations_participants ON private_conversations(participant1_id, participant2_id);
CREATE INDEX IF NOT EXISTS idx_private_conversations_updated_at ON private_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_conversations_last_message ON private_conversations(last_message_id);