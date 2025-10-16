-- Mock data for events table
INSERT INTO events (title, description, group_id, creator_id, event_date, location, created_at, updated_at) VALUES
-- Tech Enthusiasts events
('AI & Machine Learning Workshop', 'Hands-on workshop covering the latest in AI and ML technologies', 1, 1, '2025-01-01 10:00:00', 'Virtual - Zoom', '2024-03-20 09:00:00', '2024-03-20 09:00:00'),
('Tech Meetup: Future of Web Development', 'Discuss emerging trends in web development and networking', 1, 2, '2025-01-08 14:00:00', 'Tech Hub Downtown', '2024-03-30 11:00:00', '2024-03-30 11:00:00'),

-- Design & Creativity events
('Design Critique Session', 'Bring your latest designs for constructive feedback from the community', 2, 2, '2024-12-30 15:00:00', 'Design Studio', '2024-04-09 10:00:00', '2024-04-09 10:00:00'),
('Creative Portfolio Review', 'One-on-one portfolio reviews with experienced designers', 2, 6, '2025-01-04 13:00:00', 'Virtual - Google Meet', '2024-04-19 12:00:00', '2024-04-19 12:00:00'),

-- Fitness & Wellness events
('Morning Yoga Session', 'Start your day with energizing yoga and meditation', 3, 3, '2024-12-28 08:00:00', 'Central Park', '2024-05-01 07:00:00', '2024-05-01 07:00:00'),

-- Book Club events
('Monthly Book Discussion: "The Midnight Library"', 'Discuss Matt Haig''s latest novel and its themes', 4, 4, '2024-12-31 18:00:00', 'Virtual - Discord', '2024-05-11 16:00:00', '2024-05-11 16:00:00'),

-- Gaming Community events
('LAN Party Tournament', 'Competitive gaming tournament with prizes', 5, 5, '2025-01-03 19:00:00', 'Gaming Arena', '2024-05-21 17:00:00', '2024-05-21 17:00:00'),

-- Entrepreneurship Hub events
('Startup Pitch Night', 'Present your business ideas and get feedback from investors', 7, 7, '2025-01-05 17:00:00', 'Innovation Center', '2024-06-01 15:00:00', '2024-06-01 15:00:00'),

-- Music & Arts events
('Open Mic Night', 'Showcase your musical talents and enjoy live performances', 8, 8, '2025-01-07 20:00:00', 'The Music Room', '2024-06-11 18:00:00', '2024-06-11 18:00:00');
