-- Mock data for group_conversations table
-- Each group gets one conversation record
INSERT INTO group_conversations (id, group_id, created_at, updated_at) VALUES
(1, 1, datetime('now', '-5 days'), datetime('now', '-1 day')), -- Tech Enthusiasts
(2, 2, datetime('now', '-4 days'), datetime('now', '-1 day')), -- Design & Creativity
(3, 3, datetime('now', '-3 days'), datetime('now', '-1 day')), -- Fitness & Wellness
(4, 4, datetime('now', '-6 days'), datetime('now', '-2 days')), -- Book Club
(5, 5, datetime('now', '-2 days'), datetime('now', '-3 hours')), -- Gaming Community
(6, 6, datetime('now', '-4 days'), datetime('now', '-2 days')), -- Photography Lovers
(7, 7, datetime('now', '-5 days'), datetime('now', '-1 day')), -- Entrepreneurship Hub
(8, 8, datetime('now', '-3 days'), datetime('now', '-1 day')); -- Music & Arts

UPDATE group_conversations SET last_message_id = (SELECT MAX(id) FROM group_messages WHERE conversation_id = group_conversations.id) WHERE EXISTS (SELECT 1 FROM group_messages WHERE conversation_id = group_conversations.id);