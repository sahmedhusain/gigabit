-- +migrate Up
-- Add per-participant deleted_at timestamps to support soft-delete boundaries
ALTER TABLE private_conversations ADD COLUMN participant1_deleted_at DATETIME;
ALTER TABLE private_conversations ADD COLUMN participant2_deleted_at DATETIME;

-- Backfill existing rows with NULL (no deletion boundary)
UPDATE private_conversations
SET participant1_deleted_at = CASE WHEN participant1_deleted = 1 AND participant1_deleted_at IS NULL THEN CURRENT_TIMESTAMP ELSE participant1_deleted_at END,
    participant2_deleted_at = CASE WHEN participant2_deleted = 1 AND participant2_deleted_at IS NULL THEN CURRENT_TIMESTAMP ELSE participant2_deleted_at END;

-- Indexes to speed up queries filtering by deleted_at
CREATE INDEX idx_private_conversations_p1_deleted_at ON private_conversations(participant1_deleted_at);
CREATE INDEX idx_private_conversations_p2_deleted_at ON private_conversations(participant2_deleted_at);
