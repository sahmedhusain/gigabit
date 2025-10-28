CREATE TABLE IF NOT EXISTS group_post_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_post_id) REFERENCES group_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_group_post_comments_group_post_id ON group_post_comments(group_post_id);
CREATE INDEX IF NOT EXISTS idx_group_post_comments_user_id ON group_post_comments(user_id);

