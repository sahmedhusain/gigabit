-- Add reaction_type column to likes table to support likes and dislikes
-- reaction_type can be 'like' or 'dislike'

-- Step 1: Add the reaction_type column with default value 'like' for existing records
ALTER TABLE likes ADD COLUMN reaction_type TEXT DEFAULT 'like';

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_likes_reaction_type ON likes(reaction_type);
CREATE INDEX IF NOT EXISTS idx_likes_entity_reaction ON likes(entity_type, entity_id, reaction_type);
