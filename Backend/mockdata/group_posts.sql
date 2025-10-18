-- Mock data for group_posts table
-- These posts are specifically for groups, separate from regular posts

INSERT INTO group_posts (group_id, user_id, content, image_url, created_at, updated_at) VALUES
-- Tech Enthusiasts Group (group_id: 1)
(1, 1, 'Just deployed a new microservice architecture using Go and Docker! The performance improvements are incredible. Anyone else working with containerization?', '', '2025-09-21 10:00:00', '2025-09-21 10:00:00'),
(1, 2, 'Check out this React performance optimization technique I discovered. It reduced our bundle size by 40%! 🚀', '', '2025-09-23 10:00:00', '2025-09-23 10:00:00'),
(1, 3, 'Who''s attending the tech conference next month? Would love to meet up and discuss the latest in AI/ML', '', '2025-09-26 10:00:00', '2025-09-26 10:00:00'),
(1, 5, 'New JavaScript ES2024 features are amazing! Especially the pipeline operator. Game changer for functional programming', '', '2025-09-28 10:00:00', '2025-09-28 10:00:00'),
(1, 7, 'Started my first open source project - a CLI tool for API testing. Looking for contributors! 💻', '', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),

-- Design & Creativity Group (group_id: 2)
(2, 2, 'Finished my latest UI/UX project for a fintech startup. The user research phase was crucial! 🎨', '', '2025-09-22 10:00:00', '2025-09-22 10:00:00'),
(2, 4, 'What''s your favorite design tool this year? I''ve been loving Figma''s new AI features', '', '2025-09-24 10:00:00', '2025-09-24 10:00:00'),
(2, 6, 'Color psychology in web design - how do you choose your palettes? Share your process! 🌈', '', '2025-09-27 10:00:00', '2025-09-27 10:00:00'),
(2, 8, 'Typography matters! Just redesigned our brand identity with a custom typeface. The impact is huge', '', '2025-09-30 10:00:00', '2025-09-30 10:00:00'),
(2, 10, 'Mobile-first design approach saved us months of work. Always start with constraints! 📱', '', '2025-10-04 10:00:00', '2025-10-04 10:00:00'),

-- Fitness & Wellness Group (group_id: 3)
(3, 3, 'Completed my first marathon this weekend! 26.2 miles of pure determination. Training tips in comments 🏃‍♀️', '', '2025-09-25 10:00:00', '2025-09-25 10:00:00'),
(3, 1, 'New workout routine: 30-min HIIT sessions. Who wants to join the challenge?', '', '2025-09-29 10:00:00', '2025-09-29 10:00:00'),
(3, 9, 'Meal prep Sunday! This week''s menu focuses on plant-based proteins. Recipes below 🥗', '', '2025-10-02 10:00:00', '2025-10-02 10:00:00'),
(3, 5, 'Mental health check-in: How are you all managing stress? Meditation has been my game changer 🧘‍♂️', '', '2025-10-05 10:00:00', '2025-10-05 10:00:00'),
(3, 7, 'Home gym setup complete! Sometimes the best workouts happen in your living room 💪', '', '2025-10-08 10:00:00', '2025-10-08 10:00:00'),

-- Book Club Group (group_id: 4)
(4, 4, 'This month''s pick: "Klara and the Sun" by Kazuo Ishiguro. The AI perspective is fascinating! 📚', '', '2025-09-20 10:00:00', '2025-09-20 10:00:00'),
(4, 2, 'Just finished "The Seven Husbands of Evelyn Hugo". What an emotional rollercoaster! Thoughts?', '', '2025-10-03 10:00:00', '2025-10-03 10:00:00'),
(4, 6, 'Science fiction recommendations? Looking for something mind-bending like Philip K. Dick', '', '2025-10-06 10:00:00', '2025-10-06 10:00:00'),
(4, 8, 'Local bookstore spotlight: Found some amazing indie authors. Supporting small businesses! 📖', '', '2025-10-09 10:00:00', '2025-10-09 10:00:00'),
(4, 10, 'Book vs. Movie: "Dune" - which did you prefer? The visual storytelling vs. internal narrative', '', '2025-10-12 10:00:00', '2025-10-12 10:00:00'),

-- Gaming Community Group (group_id: 5)
(5, 5, 'New indie game recommendation: "Pizza Tower" - nostalgic platforming at its finest! 🎮', '', '2025-09-19 10:00:00', '2025-09-19 10:00:00'),
(5, 1, 'Building a gaming PC for the first time. RTX 4080 or wait for the next generation?', '', '2025-09-30 10:00:00', '2025-09-30 10:00:00'),
(5, 3, 'Friday night game session: Minecraft server is up! Building a massive castle project 🏰', '', '2025-10-07 10:00:00', '2025-10-07 10:00:00'),
(5, 7, 'Speedrunning "Celeste" - finally got sub-40 minutes! The precision required is insane', '', '2025-10-10 10:00:00', '2025-10-10 10:00:00'),
(5, 9, 'Retro gaming setup complete: CRT monitor for that authentic experience 👾', '', '2025-10-13 10:00:00', '2025-10-13 10:00:00'),

-- Photography Lovers Group (group_id: 6)
(6, 6, 'Golden hour landscape shot from my weekend hike. The light was perfect! 📷', '', '2025-09-18 10:00:00', '2025-09-18 10:00:00'),
(6, 2, 'Street photography ethics: How do you approach strangers for portraits? Tips welcome', '', '2025-10-01 10:00:00', '2025-10-01 10:00:00'),
(6, 4, 'New lens day! 85mm f/1.4 for portrait work. The bokeh is creamy smooth 📸', '', '2025-10-11 10:00:00', '2025-10-11 10:00:00'),
(6, 8, 'Film photography is making a comeback! Just developed my first roll of Portra 400', '', '2025-10-14 10:00:00', '2025-10-14 10:00:00'),

-- More recent posts for various groups
(1, 4, 'Thoughts on the new TypeScript 5.0 features? The decorators update is finally here!', '', '2025-10-15 10:00:00', '2025-10-15 10:00:00'),
(2, 1, 'Working on a design system for our team. Consistency is key to great UX! 🎯', '', '2025-10-15 10:00:00', '2025-10-15 10:00:00'),
(3, 2, 'Morning yoga session complete. Starting the day with mindfulness and movement ☀️', '', '2025-10-15 10:00:00', '2025-10-15 10:00:00'),
(4, 3, 'Reading recommendations for summer: light reads or deep literary fiction?', '', '2025-10-15 10:00:00', '2025-10-15 10:00:00'),
(5, 6, 'Anyone playing the new Zelda game? The physics engine is incredible! 🗡️', '', '2025-10-15 10:00:00', '2025-10-15 10:00:00');