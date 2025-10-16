-- Mock data for group_messages table (group messages that match our groups_mock.sql)
INSERT INTO group_messages (conversation_id, sender_id, content, created_at) VALUES
-- Tech Enthusiasts group messages (conversation_id: 1)
(1, 1, 'Welcome to the Tech Enthusiasts group! Feel free to share your latest projects and tech discoveries.', '2025-10-11 10:00:00'),
(1, 2, 'Just finished a great article on quantum computing. The future is exciting!', '2025-10-12 10:00:00'),
(1, 3, 'Anyone working with React Native? I have some questions about performance optimization.', '2025-10-13 10:00:00'),
(1, 4, 'Check out this new AI framework I discovered. It''s game-changing!', '2025-10-14 10:00:00'),
(1, 5, 'Great discussion everyone! Let''s organize a virtual meetup next week.', '2025-10-15 10:00:00'),

-- Design & Creativity group messages (conversation_id: 2)
(2, 2, 'Hello designers! Share your latest work and let''s inspire each other.', '2025-10-12 10:00:00'),
(2, 6, 'Just completed a new logo design. Would love some feedback!', '2025-10-13 10:00:00'),
(2, 7, 'The color theory workshop was amazing. Thanks to everyone who participated!', '2025-10-14 10:00:00'),
(2, 1, 'Anyone interested in a collaborative design project?', '2025-10-15 10:00:00'),

-- Fitness & Wellness group messages (conversation_id: 3)
(3, 3, 'Good morning fitness enthusiasts! Ready for today''s workout?', '2025-10-13 10:00:00'),
(3, 8, 'Just tried a new HIIT routine. My muscles are screaming but it feels great!', '2025-10-14 10:00:00'),
(3, 1, 'Remember to stay hydrated everyone! 💧', '2025-10-15 10:00:00'),

-- Book Club group messages (conversation_id: 4)
(4, 4, 'Book club members, don''t forget our discussion tomorrow at 7 PM!', '2025-10-10 10:00:00'),
(4, 7, 'I''m loving the current book. The plot twists are incredible!', '2025-10-11 10:00:00'),
(4, 5, 'Has anyone finished reading yet? I''d love to hear your thoughts.', '2025-10-12 10:00:00'),
(4, 6, 'The character development in this book is phenomenal.', '2025-10-13 10:00:00'),
(4, 2, 'Can''t wait for tomorrow''s discussion. Prepare your favorite quotes!', '2025-10-14 10:00:00'),

-- Gaming Community group messages (conversation_id: 5)
(5, 5, 'Who''s up for some gaming tonight? Let''s team up!', '2025-10-14 10:00:00'),
(5, 3, 'Just beat the final boss in the new RPG. What a journey!', '2025-10-15 10:00:00'),
(5, 8, 'Anyone interested in a strategy game tournament?', '2025-10-16 07:00:00'),

-- Photography Lovers group messages (conversation_id: 6)
(6, 6, 'Beautiful sunset shots everyone! Share your best captures.', '2025-10-12 10:00:00'),
(6, 4, 'The golden hour lighting today was perfect for portraits.', '2025-10-13 10:00:00'),
(6, 2, 'Check out this new photography technique I learned!', '2025-10-14 10:00:00'),

-- Entrepreneurship Hub group messages (conversation_id: 7)
(7, 7, 'Entrepreneurs, let''s share our biggest challenges this week.', '2025-10-11 10:00:00'),
(7, 1, 'Just secured funding for my startup! Celebrating with the community 🎉', '2025-10-12 10:00:00'),
(7, 2, 'Networking tip: Always follow up within 24 hours of meeting someone.', '2025-10-13 10:00:00'),
(7, 3, 'The startup pitch event next week is going to be amazing!', '2025-10-14 10:00:00'),
(7, 4, 'Remember to validate your business idea before investing too much time.', '2025-10-15 10:00:00'),

-- Music & Arts group messages (conversation_id: 8)
(8, 8, 'Artists and musicians, what inspires your creativity today?', '2025-10-13 10:00:00'),
(8, 2, 'Just finished a new painting. The colors turned out better than expected!', '2025-10-14 10:00:00'),
(8, 6, 'The open mic night was incredible. Thanks to all performers!', '2025-10-15 10:00:00'),
(8, 31, 'AI-generated art is fascinating! How do you feel about it in the creative community?', '2025-10-15 22:00:00'),
(8, 35, 'Just released my indie game soundtrack. Check it out on Spotify! 🎵', '2025-10-16 04:00:00'),
(8, 32, 'UX design and art have so much in common. Visual storytelling is key 🎨', '2025-10-16 08:00:00'),

-- Recent messages for existing groups
(1, 31, 'Anyone experimenting with AI-assisted coding? The productivity boost is real! 🤖', '2025-10-16 02:00:00'),
(1, 33, 'DevOps question: What''s your favorite CI/CD tool? Jenkins, GitHub Actions, or something else?', '2025-10-16 06:00:00'),
(1, 34, 'Biotech breakthrough: CRISPR advancements are accelerating drug discovery 🧬', '2025-10-16 08:00:00'),
(2, 32, 'User research shows that micro-interactions can significantly improve UX ✨', '2025-10-16 00:00:00'),
(2, 36, 'Climate action through design: How can designers promote sustainability? 🌱', '2025-10-16 05:00:00'),
(2, 37, 'Mobile-first design is crucial. 60% of users are on mobile devices 📱', '2025-10-16 09:00:00'),
(3, 38, 'Social entrepreneurship: Building businesses that create positive impact 🤝', '2025-10-16 01:00:00'),
(3, 39, 'Data visualization tip: Use color psychology to enhance comprehension 📊', '2025-10-16 07:00:00'),
(3, 40, 'Cybersecurity in the age of AI: New challenges and solutions 🔐', '2025-10-16 09:30:00'),
(4, 31, 'AI research update: Transformer models are revolutionizing NLP 🧠', '2025-10-16 03:00:00'),
(4, 32, 'Human-centered AI design: Making technology more intuitive and accessible 👥', '2025-10-16 04:00:00'),
(4, 33, 'Cloud-native development: Benefits of serverless architectures ☁️', '2025-10-16 05:00:00'),
(5, 34, 'Genetic research breakthrough: New insights into personalized medicine 🧬', '2025-10-16 06:00:00'),
(5, 35, 'Game development: Procedural generation creates infinite possibilities 🎮', '2025-10-16 07:00:00'),
(5, 36, 'Environmental activism: Youth-led climate initiatives are gaining momentum 🌍', '2025-10-16 08:00:00'),
(6, 37, 'Mobile development: Cross-platform frameworks are maturing fast 📱', '2025-10-16 09:00:00'),
(6, 38, 'Social impact measurement: Quantifying positive change in communities 📈', '2025-10-16 09:15:00'),
(6, 39, 'Real-time data processing: Streaming analytics for instant insights ⚡', '2025-10-16 09:30:00'),
(7, 40, 'Blockchain beyond crypto: Supply chain transparency applications ⛓️', '2025-10-16 09:45:00');