-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    group_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    allow_multiple_choices BOOLEAN DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_polls_user_id ON polls(user_id);

-- Create index on group_id for faster queries
CREATE INDEX IF NOT EXISTS idx_polls_group_id ON polls(group_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);
