CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    privacy TEXT NOT NULL DEFAULT 'public',
    avatar TEXT,
    content_creation TEXT NOT NULL DEFAULT 'all_members',
    create_posts TEXT NOT NULL DEFAULT 'all_members',
    create_polls TEXT NOT NULL DEFAULT 'all_members',
    create_events TEXT NOT NULL DEFAULT 'all_members',
    send_messages TEXT NOT NULL DEFAULT 'all_members',
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);