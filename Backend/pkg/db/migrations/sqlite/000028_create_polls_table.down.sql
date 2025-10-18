-- Drop polls table
DROP INDEX IF EXISTS idx_polls_created_at;
DROP INDEX IF EXISTS idx_polls_group_id;
DROP INDEX IF EXISTS idx_polls_user_id;
DROP TABLE IF EXISTS polls;
