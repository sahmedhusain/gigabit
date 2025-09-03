-- Create new posts table without category_id
CREATE TABLE posts_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    privacy VARCHAR(20) DEFAULT 'public', -- 'public', 'followers', 'private'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Copy data from old table to new table (excluding category_id)
INSERT INTO posts_new (id, user_id, content, image_url, privacy, created_at, updated_at)
SELECT id, user_id, content, image_url, privacy, created_at, updated_at FROM posts;

-- Drop old table
DROP TABLE posts;

-- Rename new table
ALTER TABLE posts_new RENAME TO posts;
