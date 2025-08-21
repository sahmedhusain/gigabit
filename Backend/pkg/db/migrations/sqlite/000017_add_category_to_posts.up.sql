-- Add category_id column to posts table
ALTER TABLE posts ADD COLUMN category_id INTEGER DEFAULT 1;

-- Add foreign key constraint (SQLite doesn't support adding constraints to existing tables easily, so we'll handle this in the service layer)
-- FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET DEFAULT

-- Update post_count for categories based on existing posts
UPDATE categories SET post_count = (
    SELECT COUNT(*) FROM posts WHERE posts.category_id = categories.id
) WHERE categories.id IN (SELECT DISTINCT category_id FROM posts);