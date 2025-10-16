-- +migrate Down
-- Remove indexes and columns added in the up migration
DROP INDEX IF EXISTS idx_private_conversations_p1_deleted_at;
DROP INDEX IF EXISTS idx_private_conversations_p2_deleted_at;

-- SQLite doesn't support dropping columns prior to 3.35; migrations framework may not handle it.
-- If supported in your environment, you could recreate the table without these columns.
-- For simplicity, we leave the columns in place on down migration.
