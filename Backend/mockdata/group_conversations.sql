-- Mock data for group_conversations table
-- Each group gets one conversation record
INSERT INTO group_conversations (id, group_id, created_at, updated_at) VALUES
(1, 1, '2025-10-11 10:00:00', '2025-10-15 14:00:00'), -- Tech Enthusiasts
(2, 2, '2025-10-12 11:00:00', '2025-10-15 15:00:00'), -- Design & Creativity
(3, 3, '2025-10-13 12:00:00', '2025-10-15 16:00:00'), -- Fitness & Wellness
(4, 4, '2025-10-10 09:00:00', '2025-10-14 13:00:00'), -- Book Club
(5, 5, '2025-10-14 08:00:00', '2025-10-16 11:00:00'), -- Gaming Community
(6, 6, '2025-10-12 13:00:00', '2025-10-14 17:00:00'), -- Photography Lovers
(7, 7, '2025-10-11 15:00:00', '2025-10-15 18:00:00'), -- Entrepreneurship Hub
(8, 8, '2025-10-13 16:00:00', '2025-10-15 19:00:00'); -- Music & Arts

UPDATE group_conversations SET last_message_id = (SELECT MAX(id) FROM group_messages WHERE conversation_id = group_conversations.id) WHERE EXISTS (SELECT 1 FROM group_messages WHERE conversation_id = group_conversations.id);