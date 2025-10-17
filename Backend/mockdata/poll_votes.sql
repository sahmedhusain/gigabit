-- Mock Poll Votes Data
-- User votes on poll options

INSERT INTO poll_votes (poll_id, option_id, user_id, created_at) VALUES
-- Poll 1: Favorite Programming Language (single choice)
(1, 1, 1, datetime('now', '-44 days')), -- John votes JS/TS
(1, 2, 2, datetime('now', '-43 days')), -- Sarah votes Python
(1, 3, 3, datetime('now', '-42 days')), -- Mike votes Go
(1, 1, 5, datetime('now', '-41 days')), -- David votes JS/TS
(1, 2, 7, datetime('now', '-40 days')), -- James votes Python
(1, 4, 9, datetime('now', '-39 days')), -- Ethan votes Rust
(1, 1, 11, datetime('now', '-38 days')), -- Alex votes JS/TS
(1, 5, 4, datetime('now', '-37 days')), -- William votes Java
(1, 1, 2, datetime('now', '-36 days')), -- Alex votes JS/TS
(1, 3, 1, datetime('now', '-35 days')), -- Nathan votes Go

-- Poll 2: Remote Work Tools (multiple choice)
(2, 1, 1, datetime('now', '-29 days')), -- John votes Slack
(2, 3, 1, datetime('now', '-29 days')), -- John votes Zoom
(2, 6, 1, datetime('now', '-29 days')), -- John votes Figma
(2, 2, 2, datetime('now', '-28 days')), -- Sarah votes Teams
(2, 3, 2, datetime('now', '-28 days')), -- Sarah votes Zoom
(2, 1, 5, datetime('now', '-27 days')), -- David votes Slack
(2, 4, 5, datetime('now', '-27 days')), -- David votes Discord
(2, 3, 7, datetime('now', '-26 days')), -- James votes Zoom
(2, 5, 7, datetime('now', '-26 days')), -- James votes Google Meet
(2, 1, 9, datetime('now', '-25 days')), -- Ethan votes Slack
(2, 3, 9, datetime('now', '-25 days')), -- Ethan votes Zoom

-- Poll 3: AI Development Frameworks (multiple choice)
(3, 2, 5, datetime('now', '-19 days')), -- David votes PyTorch
(3, 4, 5, datetime('now', '-19 days')), -- David votes Hugging Face
(3, 1, 9, datetime('now', '-18 days')), -- Ethan votes TensorFlow
(3, 3, 9, datetime('now', '-18 days')), -- Ethan votes Scikit-learn
(3, 2, 11, datetime('now', '-17 days')), -- Nathan votes PyTorch
(3, 4, 11, datetime('now', '-17 days')), -- Nathan votes Hugging Face
(3, 5, 11, datetime('now', '-17 days')), -- Nathan votes Keras

-- Poll 4: Design Software Preferences (single choice)
(4, 1, 2, datetime('now', '-39 days')), -- Sarah votes Figma
(4, 2, 4, datetime('now', '-38 days')), -- Alice votes Adobe
(4, 1, 6, datetime('now', '-37 days')), -- Emma votes Figma
(4, 4, 15, datetime('now', '-36 days')), -- Chloe votes Canva
(4, 1, 12, datetime('now', '-35 days')), -- Olivia votes Figma
(4, 3, 8, datetime('now', '-34 days')), -- Zoe votes Sketch

-- Poll 5: Color Palette Trends (single choice)
(5, 1, 2, datetime('now', '-24 days')), -- Sarah votes Earthy
(5, 3, 4, datetime('now', '-23 days')), -- Alice votes Pastel
(5, 2, 6, datetime('now', '-22 days')), -- Emma votes Bold
(5, 1, 15, datetime('now', '-21 days')), -- Chloe votes Earthy
(5, 4, 12, datetime('now', '-20 days')), -- Olivia votes Monochromatic

-- Poll 6: UI/UX Design Tools (multiple choice)
(6, 1, 2, datetime('now', '-34 days')), -- Sarah votes Figma
(6, 3, 2, datetime('now', '-34 days')), -- Sarah votes Sketch
(6, 2, 4, datetime('now', '-33 days')), -- Alice votes Adobe XD
(6, 4, 4, datetime('now', '-33 days')), -- Alice votes InVision
(6, 1, 6, datetime('now', '-32 days')), -- Emma votes Figma
(6, 5, 6, datetime('now', '-32 days')), -- Emma votes Principle
(6, 1, 15, datetime('now', '-31 days')), -- Chloe votes Figma
(6, 3, 15, datetime('now', '-31 days')), -- Chloe votes Sketch

-- Poll 7: Workout Frequency (single choice)
(7, 3, 3, datetime('now', '-34 days')), -- Mike votes 5-6 days
(7, 2, 8, datetime('now', '-33 days')), -- Lisa votes 3-4 days
(7, 4, 13, datetime('now', '-32 days')), -- Ethan votes Every day
(7, 2, 16, datetime('now', '-31 days')), -- Alex votes 3-4 days
(7, 3, 19, datetime('now', '-30 days')), -- Ava votes 5-6 days
(7, 2, 10, datetime('now', '-29 days')), -- Carter votes 3-4 days

-- Poll 8: Favorite Exercise Types (single choice)
(8, 1, 3, datetime('now', '-17 days')), -- Mike votes Cardio
(8, 2, 8, datetime('now', '-16 days')), -- Lisa votes Strength
(8, 3, 13, datetime('now', '-15 days')), -- Ethan votes Yoga
(8, 4, 16, datetime('now', '-14 days')), -- Alex votes Sports
(8, 1, 19, datetime('now', '-13 days')), -- Ava votes Cardio
(8, 5, 10, datetime('now', '-12 days')), -- Carter votes HIIT

-- Poll 9: Gaming Platforms (single choice)
(9, 1, 5, '2024-08-28 10:00:00'), -- David votes PC
(9, 3, 7, '2024-08-29 10:00:00'), -- James votes Xbox
(9, 4, 11, '2024-08-30 10:00:00'), -- Oliver votes Switch
(9, 1, 20, '2024-08-31 10:00:00'), -- Noah votes PC
(9, 2, 17, '2024-09-01 10:00:00'), -- Isabella votes PS
(9, 5, 8, '2024-09-02 10:00:00'), -- Aria votes Mobile

-- Poll 10: Game Genres (single choice)
(10, 2, 5, '2024-10-02 10:00:00'), -- David votes RPG
(10, 1, 7, '2024-10-03 10:00:00'), -- James votes Action
(10, 3, 11, '2024-10-04 10:00:00'), -- Oliver votes Strategy
(10, 4, 20, '2024-10-05 10:00:00'), -- Noah votes Sports
(10, 6, 17, '2024-10-06 10:00:00'), -- Isabella votes Horror
(10, 1, 8, '2024-10-07 10:00:00'); -- Aria votes Action