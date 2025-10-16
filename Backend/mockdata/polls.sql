-- Mock Polls Data
-- Interactive polls for groups and general discussions

INSERT INTO polls (user_id, group_id, title, description, allow_multiple_choices, expires_at, created_at, updated_at) VALUES
-- Tech Enthusiasts polls
(1, 1, 'Favorite Programming Language 2024', 'What''s your go-to programming language this year?', 0, '2025-11-15 10:00:00', '2025-09-01 10:00:00', '2025-09-01 10:00:00'),
(1, 1, 'Remote Work Tools', 'Which tools do you use for remote collaboration?', 1, '2025-10-31 10:00:00', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(5, 1, 'AI Development Frameworks', 'Which AI/ML frameworks are you most excited about?', 1, '2025-11-05 10:00:00', '2025-09-26 10:00:00', '2025-09-26 10:00:00'),

-- Design & Creativity polls
(2, 2, 'Design Software Preferences', 'What design software do you use most often?', 0, '2025-11-10 10:00:00', '2025-09-06 10:00:00', '2025-09-06 10:00:00'),
(2, 2, 'Color Palette Trends', 'Which color palette trend are you following this season?', 0, '2025-11-20 10:00:00', '2025-09-21 10:00:00', '2025-09-21 10:00:00'),

-- Fitness & Wellness polls
(3, 3, 'Workout Frequency', 'How many days per week do you work out?', 0, '2025-11-25 10:00:00', '2025-09-11 10:00:00', '2025-09-11 10:00:00'),
(3, 3, 'Favorite Exercise Types', 'What type of exercise do you enjoy most?', 0, '2025-11-13 10:00:00', '2025-09-28 10:00:00', '2025-09-28 10:00:00'),

-- Gaming Community polls
(5, 5, 'Gaming Platforms', 'Which gaming platform do you play on most?', 0, '2025-11-30 10:00:00', '2025-08-27 10:00:00', '2025-08-27 10:00:00'),
(5, 5, 'Game Genres', 'What''s your favorite game genre?', 0, '2025-11-07 10:00:00', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),

-- General polls (no group_id)
(7, NULL, 'Weekend Plans', 'What are you doing this weekend?', 0, '2025-10-23 10:00:00', '2025-10-06 10:00:00', '2025-10-06 10:00:00'),
(10, NULL, 'Coffee vs Tea', 'Which do you prefer: coffee or tea?', 0, '2025-10-30 10:00:00', '2025-10-08 10:00:00', '2025-10-08 10:00:00'),
(15, NULL, 'Music Streaming Service', 'Which music streaming service do you use?', 0, '2025-11-06 10:00:00', '2025-10-04 10:00:00', '2025-10-04 10:00:00');