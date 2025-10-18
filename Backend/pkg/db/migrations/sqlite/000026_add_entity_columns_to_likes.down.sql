-- Rollback: Remove entity columns from likes table

-- Step 1: Create old likes table structure
CREATE TABLE IF NOT EXISTS likes_old (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER,
    comment_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    UNIQUE(user_id, post_id, comment_id),
    CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
);

-- Step 2: Copy data back (only post_id and comment_id likes)
INSERT INTO likes_old (id, user_id, post_id, comment_id, created_at)
SELECT id, user_id, post_id, comment_id, created_at 
FROM likes 
WHERE entity_type IS NULL OR entity_type = '';

-- Step 3: Drop current table
DROP TABLE likes;

-- Step 4: Rename old table back
ALTER TABLE likes_old RENAME TO likes;
