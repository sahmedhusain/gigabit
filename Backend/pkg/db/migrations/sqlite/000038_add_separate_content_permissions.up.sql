ALTER TABLE groups ADD COLUMN create_posts TEXT NOT NULL DEFAULT 'all_members';
ALTER TABLE groups ADD COLUMN create_polls TEXT NOT NULL DEFAULT 'all_members';
ALTER TABLE groups ADD COLUMN create_events TEXT NOT NULL DEFAULT 'all_members';
ALTER TABLE groups ADD COLUMN send_messages TEXT NOT NULL DEFAULT 'all_members';