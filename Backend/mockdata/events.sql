-- Mock Events Data
-- Creating diverse events within different groups

INSERT INTO events (group_id, creator_id, title, description, event_date, location, created_at, updated_at) VALUES
-- React Developers Community Events (Group 1)
(1, 1, 'React 18 Workshop', 'Hands-on workshop covering the new features in React 18 including concurrent rendering, automatic batching, and Suspense improvements. Bring your laptop!', datetime('now', '+7 days', '+19:00'), 'Tech Hub Downtown, Conference Room A', datetime('now', '-5 days'), datetime('now', '-1 day')),
(1, 5, 'Code Review Session', 'Weekly code review session where we analyze real React projects and discuss best practices, performance optimizations, and code quality.', datetime('now', '+3 days', '+18:30'), 'Online via Zoom', datetime('now', '-3 days'), datetime('now', '-3 days')),

-- Go Language Enthusiasts Events (Group 2)
(2, 7, 'Go Concurrency Deep Dive', 'Advanced session on Go concurrency patterns, goroutines, channels, and the sync package. For intermediate to advanced Go developers.', datetime('now', '+10 days', '+20:00'), 'Innovation Center, Lab 3', datetime('now', '-4 days'), datetime('now', '-2 days')),

-- UI/UX Designers Network Events (Group 3)
(3, 6, 'Design System Workshop', 'Learn how to create and maintain effective design systems. We''ll build a complete design system from scratch using Figma.', datetime('now', '+5 days', '+14:00'), 'Design Studio Co-working Space', datetime('now', '-2 days'), datetime('now', '-1 day')),
(3, 6, 'Accessibility in Design Panel', 'Panel discussion with accessibility experts on creating inclusive designs. Learn about WCAG guidelines and practical implementation.', datetime('now', '+12 days', '+16:00'), 'University Auditorium', datetime('now', '-1 day'), datetime('now', '-1 day')),

-- Fitness Motivation Squad Events (Group 4)
(4, 3, 'Group Training Session', 'High-intensity interval training session in the park. All fitness levels welcome! Bring water and a towel.', datetime('now', '+2 days', '+07:00'), 'Central Park, North Meadow', datetime('now', '-3 days'), datetime('now', '-1 day')),
(4, 3, 'Nutrition Workshop', 'Learn about macro and micronutrients, meal planning, and healthy eating habits. Light healthy snacks will be provided.', datetime('now', '+8 days', '+18:00'), 'Community Center, Room 201', datetime('now', '-2 days'), datetime('now', '-2 days')),

-- Healthy Living Community Events (Group 5)
(5, 2, 'Mindfulness Meditation Session', 'Guided meditation session focused on stress reduction and mental clarity. Perfect for beginners and experienced practitioners.', datetime('now', '+4 days', '+19:00'), 'Wellness Center, Meditation Room', datetime('now', '-4 days'), datetime('now', '-2 days')),

-- Photography Masters Events (Group 6)
(6, 9, 'Golden Hour Photo Walk', 'Join us for a photo walk during golden hour. We''ll explore urban landscapes and practice composition techniques.', datetime('now', '+6 days', '+17:30'), 'Meet at City Bridge', datetime('now', '-3 days'), datetime('now', '-1 day')),
(6, 9, 'Studio Lighting Workshop', 'Professional studio lighting techniques for portrait photography. Equipment will be provided for hands-on practice.', datetime('now', '+14 days', '+15:00'), 'Professional Photo Studio', datetime('now', '-1 day'), datetime('now', '-1 day')),

-- Digital Art Collective Events (Group 7) - Private group
(7, 4, 'Concept Art Critique', 'Private session for reviewing and critiquing concept art pieces. Constructive feedback in a supportive environment.', datetime('now', '+9 days', '+20:00'), 'Alice''s Studio', datetime('now', '-2 days'), datetime('now', '-2 days')),

-- Startup Founders Network Events (Group 8) - Private group
(8, 5, 'Pitch Practice Session', 'Practice your startup pitch in front of fellow founders. Get valuable feedback before your next investor meeting.', datetime('now', '+11 days', '+19:30'), 'Business Incubator, Conference Room', datetime('now', '-1 day'), datetime('now', '-1 day')),

-- Marketing Professionals Events (Group 9)
(9, 10, 'Social Media Trends 2024', 'Discussion on emerging social media trends and how to leverage them for business growth. Case studies included.', datetime('now', '+13 days', '+18:00'), 'Marketing Hub, Seminar Room', datetime('now', '-1 day'), datetime('now', '-1 day')),

-- Machine Learning Study Group Events (Group 10) - Private group
(10, 8, 'Research Paper Discussion', 'Weekly discussion on latest ML research papers. This week: "Attention Is All You Need" revisited with modern implementations.', datetime('now', '+15 days', '+19:00'), 'University ML Lab', datetime('now', '-12 hours'), datetime('now', '-12 hours'));

-- Mock Event Responses Data
INSERT INTO event_responses (event_id, user_id, response, created_at) VALUES
-- React 18 Workshop attendees (Event 1)
(1, 1, 'going', datetime('now', '-4 days')), -- John
(1, 2, 'going', datetime('now', '-3 days')), -- Sarah
(1, 5, 'going', datetime('now', '-3 days')), -- David
(1, 6, 'going', datetime('now', '-2 days')), -- Emma
(1, 7, 'not_going', datetime('now', '-1 day')), -- James

-- Code Review Session attendees (Event 2)
(2, 1, 'going', datetime('now', '-2 days')), -- John
(2, 5, 'going', datetime('now', '-2 days')), -- David
(2, 7, 'going', datetime('now', '-1 day')), -- James

-- Go Concurrency Deep Dive attendees (Event 3)
(3, 7, 'going', datetime('now', '-3 days')), -- James
(3, 1, 'going', datetime('now', '-2 days')), -- John
(3, 5, 'not_going', datetime('now', '-1 day')), -- David

-- Design System Workshop attendees (Event 4)
(4, 6, 'going', datetime('now', '-1 day')), -- Emma
(4, 4, 'going', datetime('now', '-1 day')), -- Alice
(4, 10, 'going', datetime('now', '-12 hours')), -- Sophia

-- Group Training Session attendees (Event 6)
(6, 3, 'going', datetime('now', '-2 days')), -- Mike
(6, 1, 'going', datetime('now', '-1 day')), -- John
(6, 2, 'going', datetime('now', '-1 day')), -- Sarah
(6, 9, 'not_going', datetime('now', '-12 hours')), -- Ryan

-- Golden Hour Photo Walk attendees (Event 9)
(9, 9, 'going', datetime('now', '-2 days')), -- Ryan
(9, 2, 'going', datetime('now', '-1 day')), -- Sarah
(9, 4, 'going', datetime('now', '-1 day')), -- Alice

-- Mindfulness Meditation Session attendees (Event 8)
(8, 2, 'going', datetime('now', '-3 days')), -- Sarah
(8, 6, 'going', datetime('now', '-2 days')), -- Emma
(8, 10, 'not_going', datetime('now', '-1 day')); -- Sophia