-- Mock data for messages table (group messages that match our groups_mock.sql)
INSERT INTO messages (sender_id, group_id, content, created_at) VALUES
-- Tech Enthusiasts group messages (group_id: 1)
(1, 1, 'Welcome to the Tech Enthusiasts group! Feel free to share your latest projects and tech discoveries.', datetime('now', '-5 days')),
(2, 1, 'Just finished a great article on quantum computing. The future is exciting!', datetime('now', '-4 days')),
(3, 1, 'Anyone working with React Native? I have some questions about performance optimization.', datetime('now', '-3 days')),
(4, 1, 'Check out this new AI framework I discovered. It''s game-changing!', datetime('now', '-2 days')),
(5, 1, 'Great discussion everyone! Let''s organize a virtual meetup next week.', datetime('now', '-1 day')),

-- Design & Creativity group messages (group_id: 2)
(2, 2, 'Hello designers! Share your latest work and let''s inspire each other.', datetime('now', '-4 days')),
(6, 2, 'Just completed a new logo design. Would love some feedback!', datetime('now', '-3 days')),
(7, 2, 'The color theory workshop was amazing. Thanks to everyone who participated!', datetime('now', '-2 days')),
(1, 2, 'Anyone interested in a collaborative design project?', datetime('now', '-1 day')),

-- Fitness & Wellness group messages (group_id: 3)
(3, 3, 'Good morning fitness enthusiasts! Ready for today''s workout?', datetime('now', '-3 days')),
(8, 3, 'Just tried a new HIIT routine. My muscles are screaming but it feels great!', datetime('now', '-2 days')),
(1, 3, 'Remember to stay hydrated everyone! 💧', datetime('now', '-1 day')),

-- Book Club group messages (group_id: 4)
(4, 4, 'Book club members, don''t forget our discussion tomorrow at 7 PM!', datetime('now', '-6 days')),
(7, 4, 'I''m loving the current book. The plot twists are incredible!', datetime('now', '-5 days')),
(5, 4, 'Has anyone finished reading yet? I''d love to hear your thoughts.', datetime('now', '-4 days')),
(6, 4, 'The character development in this book is phenomenal.', datetime('now', '-3 days')),
(2, 4, 'Can''t wait for tomorrow''s discussion. Prepare your favorite quotes!', datetime('now', '-2 days')),

-- Gaming Community group messages (group_id: 5)
(5, 5, 'Who''s up for some gaming tonight? Let''s team up!', datetime('now', '-2 days')),
(3, 5, 'Just beat the final boss in the new RPG. What a journey!', datetime('now', '-1 day')),
(8, 5, 'Anyone interested in a strategy game tournament?', datetime('now', '-3 hours')),

-- Photography Lovers group messages (group_id: 6)
(6, 6, 'Beautiful sunset shots everyone! Share your best captures.', datetime('now', '-4 days')),
(4, 6, 'The golden hour lighting today was perfect for portraits.', datetime('now', '-3 days')),
(2, 6, 'Check out this new photography technique I learned!', datetime('now', '-2 days')),

-- Entrepreneurship Hub group messages (group_id: 7)
(7, 7, 'Entrepreneurs, let''s share our biggest challenges this week.', datetime('now', '-5 days')),
(1, 7, 'Just secured funding for my startup! Celebrating with the community 🎉', datetime('now', '-4 days')),
(2, 7, 'Networking tip: Always follow up within 24 hours of meeting someone.', datetime('now', '-3 days')),
(3, 7, 'The startup pitch event next week is going to be amazing!', datetime('now', '-2 days')),
(4, 7, 'Remember to validate your business idea before investing too much time.', datetime('now', '-1 day')),

-- Music & Arts group messages (group_id: 8)
(8, 8, 'Artists and musicians, what inspires your creativity today?', datetime('now', '-3 days')),
(2, 8, 'Just finished a new painting. The colors turned out better than expected!', datetime('now', '-2 days')),
(6, 8, 'The open mic night was incredible. Thanks to all performers!', datetime('now', '-1 day'));
