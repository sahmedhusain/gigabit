-- Mock data for private_messages table
INSERT INTO private_messages (conversation_id, sender_id, content, created_at, is_read) VALUES
-- Conversation 1: John (1) and Sarah (2)
(1, 1, 'Hey Sarah, how have you been?', datetime('now', '-10 days'), true),
(1, 2, 'Hi John! I''ve been great, just busy with work. How about you?', datetime('now', '-10 days'), true),
(1, 1, 'Same here, working on some exciting projects. We should catch up soon!', datetime('now', '-9 days'), true),
(1, 2, 'Definitely! Let''s plan a coffee meetup this weekend.', datetime('now', '-9 days'), true),

-- Conversation 2: John (1) and Mike (3)
(2, 1, 'Mike, saw your post about fitness. Any tips for beginners?', datetime('now', '-8 days'), true),
(2, 3, 'Hey John! Start with consistency and proper form. I can share a beginner routine if you want.', datetime('now', '-8 days'), true),
(2, 1, 'That would be awesome! I''ve been wanting to get back into shape.', datetime('now', '-7 days'), true),

-- Conversation 3: Sarah (2) and Alice (4)
(3, 2, 'Alice, your design work is amazing! How do you come up with such creative ideas?', datetime('now', '-7 days'), true),
(3, 4, 'Thanks Sarah! I draw inspiration from nature and everyday life. What kind of design are you interested in?', datetime('now', '-7 days'), true),
(3, 2, 'I''m thinking about rebranding my blog. Any advice?', datetime('now', '-6 days'), true),

-- Conversation 4: Mike (3) and David (5)
(4, 3, 'David, as a product manager, how do you prioritize features?', datetime('now', '-6 days'), true),
(4, 5, 'Great question Mike! I use a combination of user feedback, business value, and technical feasibility. Tools like RICE scoring help a lot.', datetime('now', '-6 days'), true),

-- Conversation 5: Alice (4) and Emma (6)
(5, 4, 'Emma, your UX designs are so intuitive. What''s your process?', datetime('now', '-5 days'), true),
(5, 6, 'Thanks Alice! I start with user research, then wireframes, and lots of iteration. Accessibility is always a priority.', datetime('now', '-5 days'), true),

-- Conversation 6: David (5) and James (7)
(6, 5, 'James, what frameworks are you using for your latest project?', datetime('now', '-4 days'), true),
(6, 7, 'Hey David! I''m using React with TypeScript and Node.js backend. Loving the type safety!', datetime('now', '-4 days'), true),

-- Conversation 7: Emma (6) and Lisa (8)
(7, 6, 'Lisa, how do you approach machine learning model training?', datetime('now', '-3 days'), true),
(7, 8, 'Emma, I focus on data quality first, then experiment with different algorithms. Validation is crucial!', datetime('now', '-3 days'), true),

-- Conversation 8: James (7) and Ryan (9)
(8, 7, 'Ryan, your photography is stunning! What camera do you use?', datetime('now', '-2 days'), true),
(8, 9, 'Thanks James! I use a Canon EOS R5. Lighting and composition are more important than the gear though.', datetime('now', '-2 days'), true),

-- Conversation 9: Lisa (8) and Sophia (10)
(9, 8, 'Sophia, how do you create engaging social media content?', datetime('now', '-1 day'), true),
(9, 10, 'Lisa, I focus on storytelling and understanding my audience. Consistency and authenticity are key!', datetime('now', '-1 day'), true),

-- Conversation 10: Ryan (9) and Oliver (11)
(10, 9, 'Oliver, any investment tips for beginners?', datetime('now', '-12 hours'), true),
(10, 11, 'Ryan, start with index funds and dollar-cost averaging. Long-term thinking beats trying to time the market.', datetime('now', '-12 hours'), true),

-- Conversation 11: Sophia (10) and Mia (12)
(11, 10, 'Mia, how do you handle pet emergencies?', datetime('now', '-6 hours'), true),
(11, 12, 'Sophia, stay calm and get to a vet immediately. I can give you the number of a 24/7 emergency clinic.', datetime('now', '-6 hours'), true),

-- Conversation 12: Oliver (11) and Ethan (13)
(12, 11, 'Ethan, how do you make science accessible to everyone?', datetime('now', '-3 hours'), true),
(12, 13, 'Oliver, I use simple analogies and avoid jargon. Visual aids and storytelling help a lot!', datetime('now', '-3 hours'), true),

-- Conversation 13: Mia (12) and Chloe (14)
(13, 12, 'Chloe, your fashion sense is impeccable! Where do you find inspiration?', datetime('now', '-2 hours'), true),
(13, 14, 'Thanks Mia! I look at art, nature, and street style. Mixing vintage with modern pieces creates unique looks.', datetime('now', '-2 hours'), true),

-- Conversation 14: Ethan (13) and Noah (15)
(14, 13, 'Noah, what games are you playing lately?', datetime('now', '-1 hour'), true),
(14, 15, 'Ethan, I''ve been into competitive FPS games. The strategy and reflexes keep it exciting!', datetime('now', '-1 hour'), true),

-- Conversation 15: Chloe (14) and John (1)
(15, 14, 'John, want to collaborate on a fashion-tech project?', datetime('now', '-30 minutes'), true),
(15, 1, 'Chloe, that sounds interesting! I''d love to hear more about your ideas.', datetime('now', '-30 minutes'), true),

-- Conversation 16: Noah (15) and Sarah (2)
(16, 15, 'Sarah, how do you balance work and travel?', datetime('now', '-15 minutes'), true),
(16, 2, 'Noah, it''s challenging but rewarding! I work remotely and plan trips around my schedule.', datetime('now', '-15 minutes'), true);

-- Update last_message_id in private_conversations
UPDATE private_conversations SET last_message_id = (SELECT MAX(id) FROM private_messages WHERE conversation_id = private_conversations.id) WHERE EXISTS (SELECT 1 FROM private_messages WHERE conversation_id = private_conversations.id);