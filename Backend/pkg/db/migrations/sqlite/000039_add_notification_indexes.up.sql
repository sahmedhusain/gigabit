-- Add indexes for notifications table to improve query performance

-- Index for getting user's notifications (most common query)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at 
ON notifications(user_id, created_at DESC);

-- Index for getting unread count
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read 
ON notifications(user_id, is_read);

-- Index for actor_id lookups
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id 
ON notifications(actor_id);

-- Index for entity lookups (e.g., finding all notifications for a post)
CREATE INDEX IF NOT EXISTS idx_notifications_entity 
ON notifications(entity_type, entity_id);

