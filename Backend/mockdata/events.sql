-- Mock data for events table
INSERT INTO events (title, description, group_id, creator_id, event_date, location, created_at, updated_at) VALUES
-- Tech Enthusiasts events
('AI & Machine Learning Workshop', 'Hands-on workshop covering the latest in AI and ML technologies', 1, 1, datetime('now', '+7 days'), 'Virtual - Zoom', datetime('now', '-280 days'), datetime('now', '-280 days')),
('Tech Meetup: Future of Web Development', 'Discuss emerging trends in web development and networking', 1, 2, datetime('now', '+14 days'), 'Tech Hub Downtown', datetime('now', '-270 days'), datetime('now', '-270 days')),

-- Design & Creativity events
('Design Critique Session', 'Bring your latest designs for constructive feedback from the community', 2, 2, datetime('now', '+5 days'), 'Design Studio', datetime('now', '-260 days'), datetime('now', '-260 days')),
('Creative Portfolio Review', 'One-on-one portfolio reviews with experienced designers', 2, 6, datetime('now', '+10 days'), 'Virtual - Google Meet', datetime('now', '-250 days'), datetime('now', '-250 days')),

-- Fitness & Wellness events
('Morning Yoga Session', 'Start your day with energizing yoga and meditation', 3, 3, datetime('now', '+3 days'), 'Central Park', datetime('now', '-240 days'), datetime('now', '-240 days')),

-- Book Club events
('Monthly Book Discussion: "The Midnight Library"', 'Discuss Matt Haig''s latest novel and its themes', 4, 4, datetime('now', '+6 days'), 'Virtual - Discord', datetime('now', '-230 days'), datetime('now', '-230 days')),

-- Gaming Community events
('LAN Party Tournament', 'Competitive gaming tournament with prizes', 5, 5, datetime('now', '+9 days'), 'Gaming Arena', datetime('now', '-220 days'), datetime('now', '-220 days')),

-- Entrepreneurship Hub events
('Startup Pitch Night', 'Present your business ideas and get feedback from investors', 7, 7, datetime('now', '+11 days'), 'Innovation Center', datetime('now', '-210 days'), datetime('now', '-210 days')),

-- Music & Arts events
('Open Mic Night', 'Showcase your musical talents and enjoy live performances', 8, 8, datetime('now', '+13 days'), 'The Music Room', datetime('now', '-200 days'), datetime('now', '-200 days'));
