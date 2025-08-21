-- Mock Messages Data
-- Creating realistic private messages and group chats

-- Private Messages
INSERT INTO messages (sender_id, receiver_id, content, created_at) VALUES
-- Conversation between John and Sarah
(1, 2, 'Hey Sarah! How did the Barcelona trip go?', datetime('now', '-2 days', '+10:30')),
(2, 1, 'It was amazing! The architecture there is incredible. I took so many photos 📸', datetime('now', '-2 days', '+10:45')),
(1, 2, 'That sounds awesome! I saw your post about Gaudí. Would love to see more photos sometime', datetime('now', '-2 days', '+11:00')),
(2, 1, 'Definitely! I''ll share them with you. Are you free for coffee this weekend?', datetime('now', '-2 days', '+11:15')),
(1, 2, 'Sure! How about Saturday afternoon at that new café downtown?', datetime('now', '-2 days', '+11:20')),

-- Conversation between Mike and David
(3, 5, 'Hey David! Saw your post about product roadmaps. Could use some advice on my fitness app idea', datetime('now', '-1 day', '+14:00')),
(5, 3, 'Hey Mike! I''d be happy to help. What specific areas are you struggling with?', datetime('now', '-1 day', '+14:30')),
(3, 5, 'Mainly user research and feature prioritization. How do you decide what to build first?', datetime('now', '-1 day', '+14:45')),
(5, 3, 'Great question! Start with core user problems. What pain point does your app solve?', datetime('now', '-1 day', '+15:00')),

-- Conversation between Emma and Alice
(6, 4, 'Alice! Your new logo design is stunning. The color palette is perfect 🎨', datetime('now', '-3 days', '+16:20')),
(4, 6, 'Thank you Emma! Your feedback means a lot. The client loved it too', datetime('now', '-3 days', '+16:35')),
(6, 4, 'That''s wonderful! Are you available for a collaboration project next month?', datetime('now', '-3 days', '+16:50')),
(4, 6, 'I''d love to! What kind of project are you thinking?', datetime('now', '-3 days', '+17:05')),

-- Conversation between James and Ryan
(7, 9, 'Ryan! Those beach photos are incredible. What camera settings did you use?', datetime('now', '-12 hours')),
(9, 7, 'Thanks! ISO 100, f/8, 1/250s. Golden hour lighting made all the difference', datetime('now', '-11 hours')),
(7, 9, 'Makes sense! I''m trying to get better at photography. Any tips for a beginner?', datetime('now', '-10 hours')),
(9, 7, 'Start with composition rules like rule of thirds. And practice every day, even with your phone!', datetime('now', '-9 hours')),

-- Conversation between Sophia and Lisa
(10, 8, 'Lisa! Congratulations on your ML model accuracy! 94% is impressive 🎉', datetime('now', '-6 hours')),
(8, 10, 'Thank you Sophia! It took weeks of hyperparameter tuning but finally got there', datetime('now', '-5 hours')),
(10, 8, 'I''d love to learn more about your approach. Could you share some insights?', datetime('now', '-4 hours')),
(8, 10, 'Of course! The key was feature engineering and ensemble methods. Happy to discuss more', datetime('now', '-3 hours'));

-- Group Messages (using group_id in messages table)
INSERT INTO messages (sender_id, group_id, content, created_at) VALUES
-- React Developers Community chat (Group 1)
(1, 1, 'Welcome everyone to our React developers community! Feel free to share your projects and ask questions 🚀', datetime('now', '-15 days')),
(5, 1, 'Thanks for creating this space John! Looking forward to learning from everyone', datetime('now', '-15 days', '+1 hour')),
(7, 1, 'Just pushed a new React component library to GitHub. Would love feedback!', datetime('now', '-10 days')),
(6, 1, 'James, could you share the link? Always interested in new component libraries', datetime('now', '-10 days', '+30 minutes')),
(2, 1, 'Reminder: We have the React 18 workshop next week! Don''t forget to register', datetime('now', '-3 days')),

-- Go Language Enthusiasts chat (Group 2)
(7, 2, 'Welcome to Go Language Enthusiasts! Let''s share knowledge and build amazing things with Go', datetime('now', '-16 days')),
(1, 2, 'Excited to be here! Just started learning Go and loving its simplicity', datetime('now', '-14 days')),
(5, 2, 'John, if you need any resources, I can recommend some excellent Go books and tutorials', datetime('now', '-14 days', '+2 hours')),
(3, 2, 'Has anyone tried the new generics feature in Go 1.18? Game changer!', datetime('now', '-8 days')),

-- UI/UX Designers Network chat (Group 3)
(6, 3, 'Welcome designers! This is our space to share work, get feedback, and discuss design trends', datetime('now', '-13 days')),
(4, 3, 'Excited to be part of this community! Just finished a rebrand project', datetime('now', '-12 days')),
(10, 3, 'Alice, would love to see your rebrand work! Always learning from other designers', datetime('now', '-11 days')),
(8, 3, 'Has anyone experimented with AI tools for design? Curious about the workflow', datetime('now', '-5 days')),

-- Fitness Motivation Squad chat (Group 4)
(3, 4, 'Welcome to Fitness Motivation Squad! Let''s support each other on our fitness journeys 💪', datetime('now', '-10 days')),
(1, 4, 'Thanks Mike! Looking forward to getting back in shape with this supportive community', datetime('now', '-9 days')),
(2, 4, 'Count me in! Need accountability partners for my morning runs', datetime('now', '-8 days')),
(9, 4, 'Morning runs are the best! What time do you usually start Sarah?', datetime('now', '-7 days')),

-- Photography Masters chat (Group 6)
(9, 6, 'Welcome to Photography Masters! Share your work and let''s learn from each other 📸', datetime('now', '-6 days')),
(2, 6, 'Excited to improve my photography skills! Your beach photos are inspirational Ryan', datetime('now', '-5 days')),
(4, 6, 'Looking forward to the golden hour photo walk! Perfect timing for some new shots', datetime('now', '-2 days')),

-- Marketing Professionals chat (Group 9)
(10, 9, 'Welcome marketing professionals! Let''s share insights and grow together 📈', datetime('now', '-3 days')),
(2, 9, 'Great to connect with fellow marketers! Excited to discuss the latest trends', datetime('now', '-2 days')),
(6, 9, 'Looking forward to learning about social media strategies from you all', datetime('now', '-1 day'));