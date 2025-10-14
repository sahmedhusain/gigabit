-- Add entity_type and entity_id columns to likes table to support likes on different entity types
-- This allows us to like group_posts, regular posts, comments, etc. using a polymorphic relationship

-- Step 1: Create new likes table with entity columns
CREATE TABLE IF NOT EXISTS likes_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER,
    comment_id INTEGER,
    entity_type TEXT,
    entity_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Step 2: Copy existing data from old table
INSERT INTO likes_new (id, user_id, post_id, comment_id, created_at)
SELECT id, user_id, post_id, comment_id, created_at FROM likes;

-- Step 3: Drop old table
DROP TABLE likes;

-- Step 4: Rename new table to likes
ALTER TABLE likes_new RENAME TO likes;

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_likes_user_post ON likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_comment ON likes(user_id, comment_id);
CREATE INDEX IF NOT EXISTS idx_likes_entity ON likes(entity_type, entity_id, user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_entity_id ON likes(entity_id);
