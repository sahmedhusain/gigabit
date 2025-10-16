-- Mock Polls Data
-- Interactive polls for groups and general discussions

INSERT INTO polls (user_id, group_id, title, description, allow_multiple_choices, expires_at, created_at, updated_at) VALUES
-- Tech Enthusiasts polls
(1, 1, 'Favorite Programming Language 2024', 'What''s your go-to programming language this year?', 0, datetime('now', '+30 days'), datetime('now', '-45 days'), datetime('now', '-45 days')),
(1, 1, 'Remote Work Tools', 'Which tools do you use for remote collaboration?', 1, datetime('now', '+15 days'), datetime('now', '-30 days'), datetime('now', '-30 days')),
(5, 1, 'AI Development Frameworks', 'Which AI/ML frameworks are you most excited about?', 1, datetime('now', '+20 days'), datetime('now', '-20 days'), datetime('now', '-20 days')),

-- Design & Creativity polls
(2, 2, 'Design Software Preferences', 'What design software do you use most often?', 0, datetime('now', '+25 days'), datetime('now', '-40 days'), datetime('now', '-40 days')),
(2, 2, 'Color Palette Trends', 'Which color palette trend are you following this season?', 0, datetime('now', '+35 days'), datetime('now', '-25 days'), datetime('now', '-25 days')),

-- Fitness & Wellness polls
(3, 3, 'Workout Frequency', 'How many days per week do you work out?', 0, datetime('now', '+40 days'), datetime('now', '-35 days'), datetime('now', '-35 days')),
(3, 3, 'Favorite Exercise Types', 'What type of exercise do you enjoy most?', 0, datetime('now', '+28 days'), datetime('now', '-18 days'), datetime('now', '-18 days')),

-- Gaming Community polls
(5, 5, 'Gaming Platforms', 'Which gaming platform do you play on most?', 0, datetime('now', '+45 days'), datetime('now', '-50 days'), datetime('now', '-50 days')),
(5, 5, 'Game Genres', 'What''s your favorite game genre?', 0, datetime('now', '+22 days'), datetime('now', '-15 days'), datetime('now', '-15 days')),

-- General polls (no group_id)
(7, NULL, 'Weekend Plans', 'What are you doing this weekend?', 0, datetime('now', '+7 days'), datetime('now', '-10 days'), datetime('now', '-10 days')),
(10, NULL, 'Coffee vs Tea', 'Which do you prefer: coffee or tea?', 0, datetime('now', '+14 days'), datetime('now', '-8 days'), datetime('now', '-8 days')),
(15, NULL, 'Music Streaming Service', 'Which music streaming service do you use?', 0, datetime('now', '+21 days'), datetime('now', '-12 days'), datetime('now', '-12 days'));