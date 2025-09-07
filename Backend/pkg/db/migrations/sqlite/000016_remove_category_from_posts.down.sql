-- Re-add category_id column to posts table
ALTER TABLE posts ADD COLUMN category_id INTEGER DEFAULT 1;
