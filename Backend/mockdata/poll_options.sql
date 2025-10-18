-- Mock Poll Options Data
-- Options for each poll

INSERT INTO poll_options (poll_id, option_text, option_order, created_at) VALUES
-- Poll 1: Favorite Programming Language 2024
(1, 'JavaScript/TypeScript', 1, datetime('now', '-45 days')),
(1, 'Python', 2, datetime('now', '-45 days')),
(1, 'Go', 3, datetime('now', '-45 days')),
(1, 'Rust', 4, datetime('now', '-45 days')),
(1, 'Java', 5, datetime('now', '-45 days')),
(1, 'C#', 6, datetime('now', '-45 days')),

-- Poll 2: Remote Work Tools (multiple choice)
(2, 'Slack', 1, datetime('now', '-30 days')),
(2, 'Microsoft Teams', 2, datetime('now', '-30 days')),
(2, 'Zoom', 3, datetime('now', '-30 days')),
(2, 'Discord', 4, datetime('now', '-30 days')),
(2, 'Google Meet', 5, datetime('now', '-30 days')),
(2, 'Figma', 6, datetime('now', '-30 days')),

-- Poll 3: AI Development Frameworks (multiple choice)
(3, 'TensorFlow', 1, datetime('now', '-20 days')),
(3, 'PyTorch', 2, datetime('now', '-20 days')),
(3, 'Scikit-learn', 3, datetime('now', '-20 days')),
(3, 'Hugging Face Transformers', 4, datetime('now', '-20 days')),
(3, 'Keras', 5, datetime('now', '-20 days')),
(3, 'JAX', 6, datetime('now', '-20 days')),

-- Poll 4: Design Software Preferences
(4, 'Figma', 1, datetime('now', '-40 days')),
(4, 'Adobe Creative Suite', 2, datetime('now', '-40 days')),
(4, 'Sketch', 3, datetime('now', '-40 days')),
(4, 'Canva', 4, datetime('now', '-40 days')),
(4, 'Affinity Designer', 5, datetime('now', '-40 days')),

-- Poll 5: Color Palette Trends
(5, 'Earthy and Natural', 1, datetime('now', '-25 days')),
(5, 'Bold and Vibrant', 2, datetime('now', '-25 days')),
(5, 'Pastel and Soft', 3, datetime('now', '-25 days')),
(5, 'Monochromatic', 4, datetime('now', '-25 days')),
(5, 'Retro/Nostalgic', 5, datetime('now', '-25 days')),

-- Poll 6: UI/UX Design Tools (multiple choice)
(6, 'Figma', 1, datetime('now', '-35 days')),
(6, 'Adobe XD', 2, datetime('now', '-35 days')),
(6, 'Sketch', 3, datetime('now', '-35 days')),
(6, 'InVision', 4, datetime('now', '-35 days')),
(6, 'Principle', 5, datetime('now', '-35 days')),
(6, 'Framer', 6, datetime('now', '-35 days')),

-- Poll 7: Workout Frequency (single choice)
(7, '1-2 days per week', 1, datetime('now', '-18 days')),
(7, '3-4 days per week', 2, datetime('now', '-18 days')),
(7, '5-6 days per week', 3, datetime('now', '-18 days')),
(7, 'Every day', 4, datetime('now', '-18 days')),
(7, 'It varies', 5, datetime('now', '-18 days')),

-- Poll 8: Favorite Exercise Types (single choice)
(8, 'Cardio (running, cycling)', 1, datetime('now', '-18 days')),
(8, 'Strength training', 2, datetime('now', '-18 days')),
(8, 'Yoga/Pilates', 3, datetime('now', '-18 days')),
(8, 'Sports (basketball, soccer)', 4, datetime('now', '-18 days')),
(8, 'HIIT', 5, datetime('now', '-18 days')),
(8, 'Swimming', 6, datetime('now', '-18 days')),

-- Poll 9: Gaming Platforms
(9, 'PC', 1, '2024-08-27 10:00:00'),
(9, 'PlayStation', 2, '2024-08-27 10:00:00'),
(9, 'Xbox', 3, '2024-08-27 10:00:00'),
(9, 'Nintendo Switch', 4, '2024-08-27 10:00:00'),
(9, 'Mobile', 5, '2024-08-27 10:00:00'),

-- Poll 10: Game Genres
(10, 'Action/Adventure', 1, '2024-10-01 10:00:00'),
(10, 'RPG', 2, '2024-10-01 10:00:00'),
(10, 'Strategy', 3, '2024-10-01 10:00:00'),
(10, 'Sports', 4, '2024-10-01 10:00:00'),
(10, 'Puzzle', 5, '2024-10-01 10:00:00'),
(10, 'Horror', 6, '2024-10-01 10:00:00');