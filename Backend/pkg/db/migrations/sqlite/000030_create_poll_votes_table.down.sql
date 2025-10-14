-- Drop poll_votes table
DROP INDEX IF EXISTS idx_poll_votes_poll_option;
DROP INDEX IF EXISTS idx_poll_votes_user_id;
DROP INDEX IF EXISTS idx_poll_votes_poll_id;
DROP TABLE IF EXISTS poll_votes;
