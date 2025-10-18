-- Rollback: Remove reaction_type column from likes table

-- Step 1: Drop indexes
DROP INDEX IF EXISTS idx_likes_reaction_type;
DROP INDEX IF EXISTS idx_likes_entity_reaction;

-- Step 2: Create new table without reaction_type
CREATE TABLE IF NOT EXISTS likes_temp (
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

-- Step 3: Copy data (only likes, remove dislikes)
INSERT INTO likes_temp (id, user_id, post_id, comment_id, entity_type, entity_id, created_at)
SELECT id, user_id, post_id, comment_id, entity_type, entity_id, created_at 
FROM likes 
WHERE reaction_type = 'like' OR reaction_type IS NULL;

-- Step 4: Drop current table
DROP TABLE likes;

-- Step 5: Rename temp table
ALTER TABLE likes_temp RENAME TO likes;

-- Step 6: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_likes_user_post ON likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_comment ON likes(user_id, comment_id);
CREATE INDEX IF NOT EXISTS idx_likes_entity ON likes(entity_type, entity_id, user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_entity_id ON likes(entity_id);
