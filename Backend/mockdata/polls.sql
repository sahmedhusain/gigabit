-- Mock Polls Data
-- Interactive polls for groups and general discussions

INSERT INTO polls (user_id, group_id, title, description, allow_multiple_choices, expires_at, created_at, updated_at) VALUES
-- Tech Enthusiasts polls (group_id = 1)
(1, 1, 'Favorite Programming Language 2024', 'What''s your go-to programming language this year?', 0, '2024-12-15 10:00:00', '2024-09-01 10:00:00', '2024-09-01 10:00:00'),
(1, 1, 'Remote Work Tools', 'Which tools do you use for remote collaboration?', 1, '2024-11-15 10:00:00', '2024-09-16 10:00:00', '2024-09-16 10:00:00'),
(5, 1, 'AI Development Frameworks', 'Which AI/ML frameworks are you most excited about?', 1, '2024-11-20 10:00:00', '2024-09-26 10:00:00', '2024-09-26 10:00:00'),

-- Design & Creativity polls (group_id = 2)
(2, 2, 'Design Software Preferences', 'What design software do you use most often?', 0, '2024-11-25 10:00:00', '2024-09-06 10:00:00', '2024-09-06 10:00:00'),
(2, 2, 'Color Palette Trends', 'Which color palette trend are you following this season?', 0, '2024-12-01 10:00:00', '2024-09-21 10:00:00', '2024-09-21 10:00:00'),
(4, 2, 'UI/UX Design Tools', 'Which tools are essential for your UI/UX workflow?', 1, '2024-11-30 10:00:00', '2024-10-01 10:00:00', '2024-10-01 10:00:00'),

-- Fitness & Wellness polls (group_id = 3)
(3, 3, 'Workout Frequency', 'How many days per week do you work out?', 0, '2024-12-05 10:00:00', '2024-09-11 10:00:00', '2024-09-11 10:00:00'),
(3, 3, 'Favorite Exercise Types', 'What type of exercise do you enjoy most?', 0, '2024-11-28 10:00:00', '2024-09-28 10:00:00', '2024-09-28 10:00:00'),

-- Gaming Community polls (group_id = 5)
(5, 5, 'Gaming Platforms', 'Which gaming platform do you play on most?', 0, '2024-12-15 10:00:00', '2024-08-27 10:00:00', '2024-08-27 10:00:00'),
(5, 5, 'Game Genres', 'What''s your favorite game genre?', 0, '2024-11-22 10:00:00', '2024-10-01 10:00:00', '2024-10-01 10:00:00');