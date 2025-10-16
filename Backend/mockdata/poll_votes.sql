-- Mock Poll Votes Data
-- User votes on poll options

INSERT INTO poll_votes (poll_id, option_id, user_id, created_at) VALUES
-- Poll 1: Favorite Programming Language (single choice)
(1, 1, 1, datetime('now', '-44 days')), -- John votes JS/TS
(1, 2, 2, datetime('now', '-43 days')), -- Sarah votes Python
(1, 3, 3, datetime('now', '-42 days')), -- Mike votes Go
(1, 1, 5, datetime('now', '-41 days')), -- David votes JS/TS
(1, 2, 7, datetime('now', '-40 days')), -- James votes Python
(1, 4, 13, datetime('now', '-39 days')), -- Ethan votes Rust
(1, 1, 16, datetime('now', '-38 days')), -- Alex votes JS/TS
(1, 5, 24, datetime('now', '-37 days')), -- William votes Java
(1, 1, 29, datetime('now', '-36 days')), -- Alex votes JS/TS
(1, 3, 31, datetime('now', '-35 days')), -- Nathan votes Go

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
(2, 1, 13, datetime('now', '-25 days')), -- Ethan votes Slack
(2, 3, 13, datetime('now', '-25 days')), -- Ethan votes Zoom

-- Poll 3: AI Development Frameworks (multiple choice)
(3, 2, 5, datetime('now', '-19 days')), -- David votes PyTorch
(3, 4, 5, datetime('now', '-19 days')), -- David votes Hugging Face
(3, 1, 13, datetime('now', '-18 days')), -- Ethan votes TensorFlow
(3, 3, 13, datetime('now', '-18 days')), -- Ethan votes Scikit-learn
(3, 2, 31, datetime('now', '-17 days')), -- Nathan votes PyTorch
(3, 4, 31, datetime('now', '-17 days')), -- Nathan votes Hugging Face
(3, 5, 31, datetime('now', '-17 days')), -- Nathan votes Keras

-- Poll 4: Design Software Preferences (single choice)
(4, 1, 2, datetime('now', '-39 days')), -- Sarah votes Figma
(4, 2, 4, datetime('now', '-38 days')), -- Alice votes Adobe
(4, 1, 6, datetime('now', '-37 days')), -- Emma votes Figma
(4, 4, 14, datetime('now', '-36 days')), -- Chloe votes Canva
(4, 1, 25, datetime('now', '-35 days')), -- Olivia votes Figma
(4, 3, 32, datetime('now', '-34 days')), -- Zoe votes Sketch

-- Poll 5: Color Palette Trends (single choice)
(5, 1, 2, datetime('now', '-24 days')), -- Sarah votes Earthy
(5, 3, 4, datetime('now', '-23 days')), -- Alice votes Pastel
(5, 2, 6, datetime('now', '-22 days')), -- Emma votes Bold
(5, 1, 14, datetime('now', '-21 days')), -- Chloe votes Earthy
(5, 4, 25, datetime('now', '-20 days')), -- Olivia votes Monochromatic

-- Poll 6: Workout Frequency (single choice)
(6, 3, 3, datetime('now', '-34 days')), -- Mike votes 5-6 days
(6, 2, 8, datetime('now', '-33 days')), -- Lisa votes 3-4 days
(6, 4, 13, datetime('now', '-32 days')), -- Ethan votes Every day
(6, 2, 16, datetime('now', '-31 days')), -- Alex votes 3-4 days
(6, 3, 19, datetime('now', '-30 days')), -- Ava votes 5-6 days
(6, 2, 33, datetime('now', '-29 days')), -- Carter votes 3-4 days

-- Poll 7: Favorite Exercise Types (single choice)
(7, 1, 3, datetime('now', '-17 days')), -- Mike votes Cardio
(7, 2, 8, datetime('now', '-16 days')), -- Lisa votes Strength
(7, 3, 13, datetime('now', '-15 days')), -- Ethan votes Yoga
(7, 4, 16, datetime('now', '-14 days')), -- Alex votes Sports
(7, 1, 19, datetime('now', '-13 days')), -- Ava votes Cardio
(7, 5, 33, datetime('now', '-12 days')), -- Carter votes HIIT

-- Poll 8: Gaming Platforms (single choice)
(8, 1, 5, datetime('now', '-49 days')), -- David votes PC
(8, 3, 7, datetime('now', '-48 days')), -- James votes Xbox
(8, 4, 11, datetime('now', '-47 days')), -- Oliver votes Switch
(8, 1, 15, datetime('now', '-46 days')), -- Noah votes PC
(8, 2, 17, datetime('now', '-45 days')), -- Isabella votes PS
(8, 5, 35, datetime('now', '-44 days')), -- Aria votes Mobile

-- Poll 9: Game Genres (single choice)
(9, 2, 5, datetime('now', '-14 days')), -- David votes RPG
(9, 1, 7, datetime('now', '-13 days')), -- James votes Action
(9, 3, 11, datetime('now', '-12 days')), -- Oliver votes Strategy
(9, 4, 15, datetime('now', '-11 days')), -- Noah votes Sports
(9, 6, 17, datetime('now', '-10 days')), -- Isabella votes Horror
(9, 1, 35, datetime('now', '-9 days')), -- Aria votes Action

-- Poll 10: Weekend Plans (single choice)
(10, 1, 7, datetime('now', '-9 days')), -- James votes Relaxing
(10, 2, 10, datetime('now', '-8 days')), -- Sophia votes Outdoor
(10, 3, 15, datetime('now', '-7 days')), -- Noah votes Socializing
(10, 4, 20, datetime('now', '-6 days')), -- Logan votes Projects
(10, 1, 25, datetime('now', '-5 days')), -- Olivia votes Relaxing
(10, 2, 30, datetime('now', '-4 days')), -- Liam votes Outdoor

-- Poll 11: Coffee vs Tea (single choice)
(11, 1, 10, datetime('now', '-7 days')), -- Sophia votes Coffee
(11, 2, 6, datetime('now', '-6 days')), -- Emma votes Tea
(11, 1, 14, datetime('now', '-5 days')), -- Chloe votes Coffee
(11, 3, 18, datetime('now', '-4 days')), -- Jacob votes Both
(11, 1, 21, datetime('now', '-3 days')), -- Samantha votes Coffee
(11, 2, 27, datetime('now', '-2 days')), -- Victoria votes Tea

-- Poll 12: Music Streaming Service (single choice)
(12, 1, 15, datetime('now', '-11 days')), -- Noah votes Spotify
(12, 2, 20, datetime('now', '-10 days')), -- Logan votes Apple Music
(12, 1, 25, datetime('now', '-9 days')), -- Olivia votes Spotify
(12, 3, 30, datetime('now', '-8 days')), -- Liam votes YouTube Music
(12, 1, 35, datetime('now', '-7 days')), -- Aria votes Spotify
(12, 4, 40, datetime('now', '-6 days')); -- Aiden votes Amazon Music