-- Drop poll_options table
DROP INDEX IF EXISTS idx_poll_options_order;
DROP INDEX IF EXISTS idx_poll_options_poll_id;
DROP TABLE IF EXISTS poll_options;
