-- Remove category_id column from posts table
-- SQLite doesn't support DROP COLUMN, so we need to recreate the table
CREATE TABLE posts_backup AS SELECT 
    id, user_id, content, image_url, privacy, created_at, updated_at
FROM posts;

DROP TABLE posts;

CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    privacy VARCHAR(20) DEFAULT 'public',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO posts (id, user_id, content, image_url, privacy, created_at, updated_at)
SELECT id, user_id, content, image_url, privacy, created_at, updated_at
FROM posts_backup;

DROP TABLE posts_backup;