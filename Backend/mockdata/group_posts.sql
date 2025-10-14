-- Mock data for group_posts table
-- These posts are specifically for groups, separate from regular posts

INSERT INTO group_posts (group_id, user_id, content, image_url, created_at, updated_at) VALUES
-- Tech Enthusiasts Group (group_id: 1)
(1, 1, 'Just deployed a new microservice architecture using Go and Docker! The performance improvements are incredible. Anyone else working with containerization?', '', datetime('now', '-25 days'), datetime('now', '-25 days')),
(1, 2, 'Check out this React performance optimization technique I discovered. It reduced our bundle size by 40%! 🚀', '', datetime('now', '-23 days'), datetime('now', '-23 days')),
(1, 3, 'Who''s attending the tech conference next month? Would love to meet up and discuss the latest in AI/ML', '', datetime('now', '-20 days'), datetime('now', '-20 days')),
(1, 5, 'New JavaScript ES2024 features are amazing! Especially the pipeline operator. Game changer for functional programming', '', datetime('now', '-18 days'), datetime('now', '-18 days')),
(1, 7, 'Started my first open source project - a CLI tool for API testing. Looking for contributors! 💻', '', datetime('now', '-15 days'), datetime('now', '-15 days')),

-- Design & Creativity Group (group_id: 2)
(2, 2, 'Finished my latest UI/UX project for a fintech startup. The user research phase was crucial! 🎨', '', datetime('now', '-24 days'), datetime('now', '-24 days')),
(2, 4, 'What''s your favorite design tool this year? I''ve been loving Figma''s new AI features', '', datetime('now', '-22 days'), datetime('now', '-22 days')),
(2, 6, 'Color psychology in web design - how do you choose your palettes? Share your process! 🌈', '', datetime('now', '-19 days'), datetime('now', '-19 days')),
(2, 8, 'Typography matters! Just redesigned our brand identity with a custom typeface. The impact is huge', '', datetime('now', '-16 days'), datetime('now', '-16 days')),
(2, 10, 'Mobile-first design approach saved us months of work. Always start with constraints! 📱', '', datetime('now', '-12 days'), datetime('now', '-12 days')),

-- Fitness & Wellness Group (group_id: 3)
(3, 3, 'Completed my first marathon this weekend! 26.2 miles of pure determination. Training tips in comments 🏃‍♀️', '', datetime('now', '-21 days'), datetime('now', '-21 days')),
(3, 1, 'New workout routine: 30-min HIIT sessions. Who wants to join the challenge?', '', datetime('now', '-17 days'), datetime('now', '-17 days')),
(3, 9, 'Meal prep Sunday! This week''s menu focuses on plant-based proteins. Recipes below 🥗', '', datetime('now', '-14 days'), datetime('now', '-14 days')),
(3, 5, 'Mental health check-in: How are you all managing stress? Meditation has been my game changer 🧘‍♂️', '', datetime('now', '-11 days'), datetime('now', '-11 days')),
(3, 7, 'Home gym setup complete! Sometimes the best workouts happen in your living room 💪', '', datetime('now', '-8 days'), datetime('now', '-8 days')),

-- Book Club Group (group_id: 4)
(4, 4, 'This month''s pick: "Klara and the Sun" by Kazuo Ishiguro. The AI perspective is fascinating! 📚', '', datetime('now', '-26 days'), datetime('now', '-26 days')),
(4, 2, 'Just finished "The Seven Husbands of Evelyn Hugo". What an emotional rollercoaster! Thoughts?', '', datetime('now', '-13 days'), datetime('now', '-13 days')),
(4, 6, 'Science fiction recommendations? Looking for something mind-bending like Philip K. Dick', '', datetime('now', '-10 days'), datetime('now', '-10 days')),
(4, 8, 'Local bookstore spotlight: Found some amazing indie authors. Supporting small businesses! 📖', '', datetime('now', '-7 days'), datetime('now', '-7 days')),
(4, 10, 'Book vs. Movie: "Dune" - which did you prefer? The visual storytelling vs. internal narrative', '', datetime('now', '-4 days'), datetime('now', '-4 days')),

-- Gaming Community Group (group_id: 5)
(5, 5, 'New indie game recommendation: "Pizza Tower" - nostalgic platforming at its finest! 🎮', '', datetime('now', '-27 days'), datetime('now', '-27 days')),
(5, 1, 'Building a gaming PC for the first time. RTX 4080 or wait for the next generation?', '', datetime('now', '-16 days'), datetime('now', '-16 days')),
(5, 3, 'Friday night game session: Minecraft server is up! Building a massive castle project 🏰', '', datetime('now', '-9 days'), datetime('now', '-9 days')),
(5, 7, 'Speedrunning "Celeste" - finally got sub-40 minutes! The precision required is insane', '', datetime('now', '-6 days'), datetime('now', '-6 days')),
(5, 9, 'Retro gaming setup complete: CRT monitor for that authentic experience 👾', '', datetime('now', '-3 days'), datetime('now', '-3 days')),

-- Photography Lovers Group (group_id: 6)
(6, 6, 'Golden hour landscape shot from my weekend hike. The light was perfect! 📷', '', datetime('now', '-28 days'), datetime('now', '-28 days')),
(6, 2, 'Street photography ethics: How do you approach strangers for portraits? Tips welcome', '', datetime('now', '-15 days'), datetime('now', '-15 days')),
(6, 4, 'New lens day! 85mm f/1.4 for portrait work. The bokeh is creamy smooth 📸', '', datetime('now', '-5 days'), datetime('now', '-5 days')),
(6, 8, 'Film photography is making a comeback! Just developed my first roll of Portra 400', '', datetime('now', '-2 days'), datetime('now', '-2 days')),

-- More recent posts for various groups
(1, 4, 'Thoughts on the new TypeScript 5.0 features? The decorators update is finally here!', '', datetime('now', '-1 days'), datetime('now', '-1 days')),
(2, 1, 'Working on a design system for our team. Consistency is key to great UX! 🎯', '', datetime('now', '-1 days'), datetime('now', '-1 days')),
(3, 2, 'Morning yoga session complete. Starting the day with mindfulness and movement ☀️', '', datetime('now', '-1 days'), datetime('now', '-1 days')),
(4, 3, 'Reading recommendations for summer: light reads or deep literary fiction?', '', datetime('now', '-1 days'), datetime('now', '-1 days')),
(5, 6, 'Anyone playing the new Zelda game? The physics engine is incredible! 🗡️', '', datetime('now', '-1 days'), datetime('now', '-1 days'));