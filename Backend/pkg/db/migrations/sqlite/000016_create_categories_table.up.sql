CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#10B981', -- hex color code for UI
    icon VARCHAR(50) DEFAULT 'folder', -- icon name for UI
    is_active BOOLEAN DEFAULT true,
    post_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO categories (name, description, color, icon) VALUES
('General', 'General discussion and miscellaneous posts', '#6B7280', 'message-circle'),
('Technology', 'Tech news, programming, and innovation', '#3B82F6', 'cpu'),
('Sports', 'Sports news, events, and discussions', '#EF4444', 'trophy'),
('Entertainment', 'Movies, music, games, and fun content', '#8B5CF6', 'film'),
('News', 'Current events and news updates', '#F59E0B', 'newspaper'),
('Travel', 'Travel experiences and destination guides', '#06B6D4', 'map-pin'),
('Food', 'Recipes, restaurants, and culinary experiences', '#F97316', 'utensils'),
('Health', 'Health tips, fitness, and wellness', '#10B981', 'heart'),
('Education', 'Learning resources and educational content', '#7C3AED', 'book-open'),
('Art', 'Creative works, photography, and artistic content', '#EC4899', 'palette');