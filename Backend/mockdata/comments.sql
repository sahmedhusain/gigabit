-- Mock Comments Data
-- Creating realistic comments on posts from various users

INSERT INTO comments (post_id, user_id, content, created_at, updated_at) VALUES
-- Comments on John's React post (Post 1)
(1, 2, 'Great insights on React 18! The concurrent rendering examples really helped me understand the concept better.', datetime('now', '-2 days', '+2 hours'), datetime('now', '-2 days', '+2 hours')),
(1, 6, 'Thanks for sharing this John! Have you tried the new automatic batching feature yet?', datetime('now', '-2 days', '+3 hours'), datetime('now', '-2 days', '+3 hours')),
(1, 7, 'Excellent post! I''ve been experimenting with Suspense and it''s amazing how it simplifies loading states.', datetime('now', '-1 day'), datetime('now', '-1 day')),
(1, 5, 'This convinced me to upgrade our production app to React 18. Thanks for the detailed breakdown!', datetime('now', '-1 day', '+2 hours'), datetime('now', '-1 day', '+2 hours')),

-- Comments on John's sunset post (Post 2)
(2, 2, 'Beautiful shot! Sometimes we get so caught up in work that we forget to appreciate these moments.', datetime('now', '-5 days', '+1 hour'), datetime('now', '-5 days', '+1 hour')),
(2, 6, 'This is stunning! The colors are perfect. Nature is the best artist 🎨', datetime('now', '-4 days'), datetime('now', '-4 days')),

-- Comments on Sarah's marketing post (Post 4)
(4, 1, 'Congratulations Sarah! 150% engagement increase is incredible. What was your secret sauce?', datetime('now', '-1 day', '+1 hour'), datetime('now', '-1 day', '+1 hour')),
(4, 6, 'Amazing results! Would love to hear more about your campaign strategy at the next marketing meetup.', datetime('now', '-1 day', '+2 hours'), datetime('now', '-1 day', '+2 hours')),
(4, 10, 'This is exactly the kind of performance we should all strive for! Inspiring work Sarah 🚀', datetime('now', '-1 day', '+4 hours'), datetime('now', '-1 day', '+4 hours')),

-- Comments on Sarah's Barcelona post (Post 5)
(5, 1, 'Barcelona looks amazing! Gaudí''s architecture is on my bucket list. Did you visit Sagrada Familia?', datetime('now', '-3 days', '+2 hours'), datetime('now', '-3 days', '+2 hours')),
(5, 9, 'As a photographer, I can tell you captured the essence of the city perfectly! The lighting in these shots is gorgeous.', datetime('now', '-2 days', '+1 hour'), datetime('now', '-2 days', '+1 hour')),

-- Comments on Mike's running post (Post 7)
(7, 1, 'Congrats on the PR! 42 minutes for 10K is impressive. What''s your training routine like?', datetime('now', '-1 day', '+2 hours'), datetime('now', '-1 day', '+2 hours')),
(7, 2, 'Amazing time Mike! You''re inspiring me to get back into running. Any tips for someone getting back into it?', datetime('now', '-1 day', '+3 hours'), datetime('now', '-1 day', '+3 hours')),
(7, 9, 'Beast mode! Your dedication to fitness is motivating. Keep crushing those goals! 💪', datetime('now', '-1 day', '+5 hours'), datetime('now', '-1 day', '+5 hours')),

-- Comments on Alice's design post (Post 10) - only followers can see/comment
(10, 2, 'Your design aesthetic is incredible Alice! The sustainable fashion angle makes it even more meaningful.', datetime('now', '-2 days', '+1 hour'), datetime('now', '-2 days', '+1 hour')),
(10, 6, 'Love how you incorporated the eco-friendly theme into the visual elements. The green accents work perfectly!', datetime('now', '-1 day', '+1 hour'), datetime('now', '-1 day', '+1 hour')),

-- Comments on David's product roadmap post (Post 13)
(13, 1, 'This approach to roadmap planning is spot on! The user-centric prioritization framework is brilliant.', datetime('now', '-1 day', '+2 hours'), datetime('now', '-1 day', '+2 hours')),
(13, 7, 'David, your product management insights are always valuable. Could you share more about stakeholder alignment?', datetime('now', '-1 day', '+3 hours'), datetime('now', '-1 day', '+3 hours')),
(13, 6, 'As a designer, I appreciate how you emphasize user research in your process. Collaboration makes better products!', datetime('now', '-1 day', '+4 hours'), datetime('now', '-1 day', '+4 hours')),

-- Comments on Emma's accessibility post (Post 16)
(16, 1, '98% WCAG compliance is outstanding! Accessibility is so important and often overlooked. Thanks for prioritizing it.', datetime('now', '-2 days', '+2 hours'), datetime('now', '-2 days', '+2 hours')),
(16, 2, 'This is why I love working with great designers like you Emma. Making the web inclusive should be everyone''s priority.', datetime('now', '-1 day', '+1 hour'), datetime('now', '-1 day', '+1 hour')),
(16, 7, 'Excellent work! As developers, we need to implement these accessibility features properly. Any resources you''d recommend?', datetime('now', '-1 day', '+4 hours'), datetime('now', '-1 day', '+4 hours')),

-- Comments on James's open source post (Post 19)
(19, 2, 'Open source contributions are so valuable! Which project did you contribute to?', datetime('now', '-1 day', '+1 hour'), datetime('now', '-1 day', '+1 hour')),
(19, 5, 'Authentication middleware bugs can be tricky. Great job on the fix James!', datetime('now', '-1 day', '+3 hours'), datetime('now', '-1 day', '+3 hours')),
(19, 6, 'Community collaboration is the heart of open source. Thanks for making the ecosystem better!', datetime('now', '-1 day', '+4 hours'), datetime('now', '-1 day', '+4 hours')),

-- Comments on Ryan's beach photography post (Post 25)
(25, 3, 'Incredible shot Ryan! The composition and lighting are perfect. You''ve got real talent!', datetime('now', '-1 day', '+3 hours'), datetime('now', '-1 day', '+3 hours')),
(25, 7, 'This makes me want to take up photography! Do you have any camera recommendations for beginners?', datetime('now', '-1 day', '+5 hours'), datetime('now', '-1 day', '+5 hours')),
(25, 10, 'These photos would be perfect for a travel marketing campaign! The mood you captured is amazing.', datetime('now', '-1 day', '+6 hours'), datetime('now', '-1 day', '+6 hours')),

-- Comments on Sophia's social media campaign post (Post 28)
(28, 2, 'Sophia, 150% engagement increase is phenomenal! I''d love to learn about your content strategy.', datetime('now', '-1 day', '+2 hours'), datetime('now', '-1 day', '+2 hours')),
(28, 6, 'Sustainability + great marketing = perfect combination! Your campaigns always resonate with audiences.', datetime('now', '-1 day', '+3 hours'), datetime('now', '-1 day', '+3 hours')),
(28, 9, 'These numbers are inspiring! Could you share some insights about what worked best?', datetime('now', '-1 day', '+5 hours'), datetime('now', '-1 day', '+5 hours'));