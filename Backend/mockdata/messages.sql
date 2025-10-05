-- Mock data for group_messages table (group messages that match our groups_mock.sql)
INSERT INTO group_messages (conversation_id, sender_id, content, created_at) VALUES
-- Tech Enthusiasts group messages (conversation_id: 1)
(1, 1, 'Welcome to the Tech Enthusiasts group! Feel free to share your latest projects and tech discoveries.', datetime('now', '-5 days')),
(1, 2, 'Just finished a great article on quantum computing. The future is exciting!', datetime('now', '-4 days')),
(1, 3, 'Anyone working with React Native? I have some questions about performance optimization.', datetime('now', '-3 days')),
(1, 4, 'Check out this new AI framework I discovered. It''s game-changing!', datetime('now', '-2 days')),
(1, 5, 'Great discussion everyone! Let''s organize a virtual meetup next week.', datetime('now', '-1 day')),

-- Design & Creativity group messages (conversation_id: 2)
(2, 2, 'Hello designers! Share your latest work and let''s inspire each other.', datetime('now', '-4 days')),
(2, 6, 'Just completed a new logo design. Would love some feedback!', datetime('now', '-3 days')),
(2, 7, 'The color theory workshop was amazing. Thanks to everyone who participated!', datetime('now', '-2 days')),
(2, 1, 'Anyone interested in a collaborative design project?', datetime('now', '-1 day')),

-- Fitness & Wellness group messages (conversation_id: 3)
(3, 3, 'Good morning fitness enthusiasts! Ready for today''s workout?', datetime('now', '-3 days')),
(3, 8, 'Just tried a new HIIT routine. My muscles are screaming but it feels great!', datetime('now', '-2 days')),
(3, 1, 'Remember to stay hydrated everyone! 💧', datetime('now', '-1 day')),

-- Book Club group messages (conversation_id: 4)
(4, 4, 'Book club members, don''t forget our discussion tomorrow at 7 PM!', datetime('now', '-6 days')),
(4, 7, 'I''m loving the current book. The plot twists are incredible!', datetime('now', '-5 days')),
(4, 5, 'Has anyone finished reading yet? I''d love to hear your thoughts.', datetime('now', '-4 days')),
(4, 6, 'The character development in this book is phenomenal.', datetime('now', '-3 days')),
(4, 2, 'Can''t wait for tomorrow''s discussion. Prepare your favorite quotes!', datetime('now', '-2 days')),

-- Gaming Community group messages (conversation_id: 5)
(5, 5, 'Who''s up for some gaming tonight? Let''s team up!', datetime('now', '-2 days')),
(5, 3, 'Just beat the final boss in the new RPG. What a journey!', datetime('now', '-1 day')),
(5, 8, 'Anyone interested in a strategy game tournament?', datetime('now', '-3 hours')),

-- Photography Lovers group messages (conversation_id: 6)
(6, 6, 'Beautiful sunset shots everyone! Share your best captures.', datetime('now', '-4 days')),
(6, 4, 'The golden hour lighting today was perfect for portraits.', datetime('now', '-3 days')),
(6, 2, 'Check out this new photography technique I learned!', datetime('now', '-2 days')),

-- Entrepreneurship Hub group messages (conversation_id: 7)
(7, 7, 'Entrepreneurs, let''s share our biggest challenges this week.', datetime('now', '-5 days')),
(7, 1, 'Just secured funding for my startup! Celebrating with the community 🎉', datetime('now', '-4 days')),
(7, 2, 'Networking tip: Always follow up within 24 hours of meeting someone.', datetime('now', '-3 days')),
(7, 3, 'The startup pitch event next week is going to be amazing!', datetime('now', '-2 days')),
(7, 4, 'Remember to validate your business idea before investing too much time.', datetime('now', '-1 day')),

-- Music & Arts group messages (conversation_id: 8)
(8, 8, 'Artists and musicians, what inspires your creativity today?', datetime('now', '-3 days')),
(8, 2, 'Just finished a new painting. The colors turned out better than expected!', datetime('now', '-2 days')),
(8, 6, 'The open mic night was incredible. Thanks to all performers!', datetime('now', '-1 day')),
(8, 31, 'AI-generated art is fascinating! How do you feel about it in the creative community?', datetime('now', '-12 hours')),
(8, 35, 'Just released my indie game soundtrack. Check it out on Spotify! 🎵', datetime('now', '-6 hours')),
(8, 32, 'UX design and art have so much in common. Visual storytelling is key 🎨', datetime('now', '-2 hours')),

-- Recent messages for existing groups
(1, 31, 'Anyone experimenting with AI-assisted coding? The productivity boost is real! 🤖', datetime('now', '-8 hours')),
(1, 33, 'DevOps question: What''s your favorite CI/CD tool? Jenkins, GitHub Actions, or something else?', datetime('now', '-4 hours')),
(1, 34, 'Biotech breakthrough: CRISPR advancements are accelerating drug discovery 🧬', datetime('now', '-2 hours')),
(2, 32, 'User research shows that micro-interactions can significantly improve UX ✨', datetime('now', '-10 hours')),
(2, 36, 'Climate action through design: How can designers promote sustainability? 🌱', datetime('now', '-5 hours')),
(2, 37, 'Mobile-first design is crucial. 60% of users are on mobile devices 📱', datetime('now', '-1 hour')),
(3, 38, 'Social entrepreneurship: Building businesses that create positive impact 🤝', datetime('now', '-9 hours')),
(3, 39, 'Data visualization tip: Use color psychology to enhance comprehension 📊', datetime('now', '-3 hours')),
(3, 40, 'Cybersecurity in the age of AI: New challenges and solutions 🔐', datetime('now', '-30 minutes')),
(4, 31, 'AI research update: Transformer models are revolutionizing NLP 🧠', datetime('now', '-7 hours')),
(4, 32, 'Human-centered AI design: Making technology more intuitive and accessible 👥', datetime('now', '-6 hours')),
(4, 33, 'Cloud-native development: Benefits of serverless architectures ☁️', datetime('now', '-5 hours')),
(5, 34, 'Genetic research breakthrough: New insights into personalized medicine 🧬', datetime('now', '-4 hours')),
(5, 35, 'Game development: Procedural generation creates infinite possibilities 🎮', datetime('now', '-3 hours')),
(5, 36, 'Environmental activism: Youth-led climate initiatives are gaining momentum 🌍', datetime('now', '-2 hours')),
(6, 37, 'Mobile development: Cross-platform frameworks are maturing fast 📱', datetime('now', '-1 hour')),
(6, 38, 'Social impact measurement: Quantifying positive change in communities 📈', datetime('now', '-45 minutes')),
(6, 39, 'Real-time data processing: Streaming analytics for instant insights ⚡', datetime('now', '-30 minutes')),
(7, 40, 'Blockchain beyond crypto: Supply chain transparency applications ⛓️', datetime('now', '-15 minutes'));

-- Update group conversations with last message IDs
-- UPDATE group_conversations SET last_message_id = (SELECT MAX(id) FROM group_messages WHERE conversation_id = group_conversations.id) WHERE EXISTS (SELECT 1 FROM group_messages WHERE conversation_id = group_conversations.id);
