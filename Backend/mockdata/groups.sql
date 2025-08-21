-- Mock Groups Data
-- Creating diverse groups with different topics and privacy settings

INSERT INTO groups (name, description, creator_id, created_at, updated_at) VALUES
-- Tech-focused groups
('React Developers Community', 'A community for React developers to share knowledge, discuss best practices, and collaborate on projects. Welcome beginners and experts alike!', 1, datetime('now', '-20 days'), datetime('now', '-1 day')),
('Go Language Enthusiasts', 'Dedicated to the Go programming language. Share tips, tricks, and projects. Let''s build the future with Go!', 7, datetime('now', '-18 days'), datetime('now', '-2 days')),
('UI/UX Designers Network', 'A space for designers to showcase their work, get feedback, and discuss design trends. Creativity meets functionality.', 6, datetime('now', '-15 days'), datetime('now', '-1 day')),

-- Fitness and health groups
('Fitness Motivation Squad', 'Stay motivated on your fitness journey! Share workouts, nutrition tips, and celebrate achievements together.', 3, datetime('now', '-12 days'), datetime('now', '-6 hours')),
('Healthy Living Community', 'Holistic approach to health and wellness. Nutrition, mental health, fitness, and lifestyle discussions welcome.', 2, datetime('now', '-10 days'), datetime('now', '-12 hours')),

-- Creative and hobby groups
('Photography Masters', 'Share your best shots, get constructive feedback, and learn new techniques from fellow photographers.', 9, datetime('now', '-8 days'), datetime('now', '-3 hours')),
('Digital Art Collective', 'A private group for serious digital artists. Share work-in-progress, get professional feedback, and network.', 4, datetime('now', '-7 days'), datetime('now', '-2 hours')),

-- Professional networking
('Startup Founders Network', 'Connect with fellow entrepreneurs, share experiences, and find potential co-founders or mentors.', 5, datetime('now', '-6 days'), datetime('now', '-4 hours')),
('Marketing Professionals', 'Latest trends in digital marketing, case studies, and networking opportunities for marketing professionals.', 10, datetime('now', '-5 days'), datetime('now', '-1 hour')),

-- Study and learning groups
('Machine Learning Study Group', 'Advanced discussions on ML algorithms, research papers, and practical implementations. PhD level preferred.', 8, datetime('now', '-4 days'), datetime('now', '-30 minutes'));

-- Mock Group Members Data
INSERT INTO group_members (group_id, user_id, role, status, created_at) VALUES
-- React Developers Community (Group 1) - Public group, many members
(1, 1, 'admin', 'accepted', datetime('now', '-20 days')), -- John (creator)
(1, 2, 'member', 'accepted', datetime('now', '-18 days')), -- Sarah
(1, 5, 'moderator', 'accepted', datetime('now', '-15 days')), -- David
(1, 6, 'member', 'accepted', datetime('now', '-12 days')), -- Emma
(1, 7, 'member', 'accepted', datetime('now', '-10 days')), -- James
(1, 10, 'member', 'accepted', datetime('now', '-8 days')), -- Sophia

-- Go Language Enthusiasts (Group 2) - James's group
(2, 7, 'admin', 'accepted', datetime('now', '-18 days')), -- James (creator)
(2, 1, 'member', 'accepted', datetime('now', '-16 days')), -- John
(2, 3, 'member', 'accepted', datetime('now', '-14 days')), -- Mike
(2, 5, 'member', 'accepted', datetime('now', '-12 days')), -- David
(2, 2, 'member', 'pending', datetime('now', '-5 days')), -- Sarah (pending)

-- UI/UX Designers Network (Group 3) - Emma's group
(3, 6, 'admin', 'accepted', datetime('now', '-15 days')), -- Emma (creator)
(3, 4, 'member', 'accepted', datetime('now', '-13 days')), -- Alice
(3, 8, 'member', 'accepted', datetime('now', '-11 days')), -- Lisa
(3, 10, 'member', 'accepted', datetime('now', '-9 days')), -- Sophia
(3, 2, 'member', 'accepted', datetime('now', '-7 days')), -- Sarah

-- Fitness Motivation Squad (Group 4) - Mike's group
(4, 3, 'admin', 'accepted', datetime('now', '-12 days')), -- Mike (creator)
(4, 1, 'member', 'accepted', datetime('now', '-10 days')), -- John
(4, 2, 'member', 'accepted', datetime('now', '-9 days')), -- Sarah
(4, 5, 'member', 'accepted', datetime('now', '-8 days')), -- David
(4, 9, 'member', 'accepted', datetime('now', '-6 days')), -- Ryan

-- Healthy Living Community (Group 5) - Sarah's group
(5, 2, 'admin', 'accepted', datetime('now', '-10 days')), -- Sarah (creator)
(5, 3, 'member', 'accepted', datetime('now', '-9 days')), -- Mike
(5, 6, 'member', 'accepted', datetime('now', '-8 days')), -- Emma
(5, 10, 'member', 'accepted', datetime('now', '-7 days')), -- Sophia

-- Photography Masters (Group 6) - Ryan's group
(6, 9, 'admin', 'accepted', datetime('now', '-8 days')), -- Ryan (creator)
(6, 2, 'member', 'accepted', datetime('now', '-7 days')), -- Sarah
(6, 4, 'member', 'accepted', datetime('now', '-6 days')), -- Alice
(6, 10, 'member', 'accepted', datetime('now', '-5 days')), -- Sophia

-- Digital Art Collective (Group 7) - Alice's private group
(7, 4, 'admin', 'accepted', datetime('now', '-7 days')), -- Alice (creator)
(7, 6, 'member', 'accepted', datetime('now', '-6 days')), -- Emma
(7, 8, 'member', 'accepted', datetime('now', '-5 days')), -- Lisa
(7, 9, 'member', 'pending', datetime('now', '-3 days')), -- Ryan (pending approval)

-- Startup Founders Network (Group 8) - David's private group
(8, 5, 'admin', 'accepted', datetime('now', '-6 days')), -- David (creator)
(8, 1, 'member', 'accepted', datetime('now', '-5 days')), -- John
(8, 7, 'member', 'accepted', datetime('now', '-4 days')), -- James
(8, 2, 'member', 'pending', datetime('now', '-2 days')), -- Sarah (pending approval)

-- Marketing Professionals (Group 9) - Sophia's group
(9, 10, 'admin', 'accepted', datetime('now', '-5 days')), -- Sophia (creator)
(9, 2, 'member', 'accepted', datetime('now', '-4 days')), -- Sarah
(9, 6, 'member', 'accepted', datetime('now', '-3 days')), -- Emma
(9, 9, 'member', 'accepted', datetime('now', '-2 days')), -- Ryan

-- Machine Learning Study Group (Group 10) - Lisa's private group
(10, 8, 'admin', 'accepted', datetime('now', '-4 days')), -- Lisa (creator)
(10, 5, 'member', 'accepted', datetime('now', '-3 days')), -- David
(10, 7, 'member', 'pending', datetime('now', '-1 day')), -- James (pending approval)
(10, 1, 'member', 'pending', datetime('now', '-12 hours')); -- John (pending approval)