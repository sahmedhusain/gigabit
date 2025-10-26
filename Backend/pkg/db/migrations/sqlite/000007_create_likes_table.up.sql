CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER,
    comment_id INTEGER,
    entity_type TEXT,
    entity_id INTEGER,
    reaction_type TEXT DEFAULT 'like',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    UNIQUE(user_id, post_id, comment_id),
    UNIQUE(user_id, entity_type, entity_id),
    CHECK ((post_id IS NOT NULL AND comment_id IS NULL AND entity_type IS NULL AND entity_id IS NULL) OR 
           (post_id IS NULL AND comment_id IS NOT NULL AND entity_type IS NULL AND entity_id IS NULL) OR
           (post_id IS NULL AND comment_id IS NULL AND entity_type IS NOT NULL AND entity_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_likes_user_post ON likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_comment ON likes(user_id, comment_id);
CREATE INDEX IF NOT EXISTS idx_likes_entity ON likes(entity_type, entity_id, user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_entity_id ON likes(entity_id);
CREATE INDEX IF NOT EXISTS idx_likes_reaction_type ON likes(reaction_type);
CREATE INDEX IF NOT EXISTS idx_likes_entity_reaction ON likes(entity_type, entity_id, reaction_type);