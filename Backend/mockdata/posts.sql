-- Mock Posts Data with Categories
-- Creating diverse posts from different users with appropriate categories

INSERT INTO posts (user_id, content, image_url, privacy, category_id, created_at, updated_at) VALUES
-- John's posts (Technology & General)
(1, 'Just finished working on a new React project! The new features in React 18 are amazing. Concurrent rendering is a game changer for performance 🚀 #React #WebDev #JavaScript', '', 'public', 2, datetime('now', '-2 days'), datetime('now', '-2 days')),
(1, 'Beautiful sunset from my office window today. Sometimes you need to pause and appreciate the simple things in life 🌅', '', 'public', 1, datetime('now', '-5 days'), datetime('now', '-5 days')),
(1, 'Started learning Go language this week. The simplicity and performance are impressive. Any Go developers here with tips for a beginner?', '', 'public', 2, datetime('now', '-8 days'), datetime('now', '-8 days')),

-- Sarah's posts (Technology/Travel/Food)
(2, 'Just launched our new digital marketing campaign! The results in the first 24 hours have been incredible. ROI is through the roof 📈 #DigitalMarketing #Success', '', 'public', 2, datetime('now', '-1 day'), datetime('now', '-1 day')),
(2, 'Exploring the beautiful streets of Barcelona this weekend! The architecture here is absolutely stunning. Gaudí was truly a genius ✨ #Travel #Barcelona #Architecture', '', 'public', 6, datetime('now', '-3 days'), datetime('now', '-3 days')),
(2, 'Coffee tasting session at the local roastery today. Learned so much about single-origin beans and brewing techniques ☕ #Coffee #Learning', '', 'public', 7, datetime('now', '-6 days'), datetime('now', '-6 days')),

-- Mike's posts (Sports/Health)
(3, 'Completed a 10K run this morning! Personal best time: 42 minutes. Consistency and dedication really pay off 🏃‍♂️ #Fitness #Running #PersonalRecord', '', 'public', 3, datetime('now', '-1 day'), datetime('now', '-1 day')),
(3, 'Amazing basketball game last night! The final shot was absolutely incredible. Love the intensity of playoff season 🏀 #Basketball #Sports #Playoffs', '', 'public', 3, datetime('now', '-4 days'), datetime('now', '-4 days')),
(3, 'Started a new workout routine focusing on functional fitness. The difference in everyday activities is already noticeable 💪 #Fitness #Health #Wellness', '', 'public', 8, datetime('now', '-7 days'), datetime('now', '-7 days')),

-- Emma's posts (Art/Entertainment/Education)
(4, 'Just finished painting a landscape piece inspired by my recent trip to the mountains. Art therapy is real! 🎨 #Painting #Art #Landscape #Creativity', '', 'public', 10, datetime('now', '-2 days'), datetime('now', '-2 days')),
(4, 'Movie night: watched the new sci-fi thriller. The cinematography was breathtaking, but the plot could have been tighter 🎬 #Movies #Cinema #Review', '', 'public', 4, datetime('now', '-5 days'), datetime('now', '-5 days')),
(4, 'Teaching watercolor techniques to beginners today. Seeing their faces light up when they create something beautiful never gets old 🎨 #Teaching #Art #Education', '', 'public', 9, datetime('now', '-9 days'), datetime('now', '-9 days')),

-- Alex's posts (Technology/News)
(5, 'AI development is moving so fast! GPT-4 capabilities are mind-blowing. We are living in interesting times 🤖 #AI #Technology #Innovation #Future', '', 'public', 2, datetime('now', '-1 day'), datetime('now', '-1 day')),
(5, 'Climate change summit outcomes are promising. Technology and policy working together might actually make a difference 🌍 #ClimateChange #News #Environment', '', 'public', 5, datetime('now', '-4 days'), datetime('now', '-4 days')),
(5, 'Blockchain technology beyond cryptocurrency is fascinating. Supply chain transparency applications are game-changing ⛓️ #Blockchain #Technology #Innovation', '', 'public', 2, datetime('now', '-8 days'), datetime('now', '-8 days')),

-- Lisa's posts (Food/Travel/Health)
(6, 'Homemade pasta night! Nothing beats fresh linguine with homemade pesto. The basil from my garden makes all the difference 🍝 #Cooking #Food #Homemade', '', 'public', 7, datetime('now', '-2 days'), datetime('now', '-2 days')),
(6, 'Hiking in the national park this weekend. 15 miles of pure nature therapy. Highly recommend disconnecting and reconnecting with nature 🥾 #Hiking #Nature #Health', '', 'public', 8, datetime('now', '-6 days'), datetime('now', '-6 days')),
(6, 'Food market in Florence was incredible! The variety of fresh produce and local specialties was overwhelming in the best way 🍅 #Travel #Food #Italy', '', 'public', 6, datetime('now', '-10 days'), datetime('now', '-10 days')),

-- David's posts (Sports/Entertainment/General)
(7, 'Champions League final was absolutely epic! What a match, what a tournament. Football at its finest ⚽ #Football #ChampionsLeague #Sports', '', 'public', 3, datetime('now', '-3 days'), datetime('now', '-3 days')),
(7, 'Gaming session with the crew last night. New RPG is addictive! The storyline and character development are top-notch 🎮 #Gaming #Entertainment #RPG', '', 'public', 4, datetime('now', '-5 days'), datetime('now', '-5 days')),
(7, 'Sunday family BBQ was perfect. Sometimes the simple moments are the most precious ❤️ #Family #Life #Gratitude', '', 'public', 1, datetime('now', '-7 days'), datetime('now', '-7 days')),

-- Anna's posts (Education/Health/Art)
(8, 'Workshop on modern teaching methodologies was eye-opening. Student engagement techniques have evolved so much in recent years 📚 #Education #Teaching #Learning', '', 'public', 9, datetime('now', '-1 day'), datetime('now', '-1 day')),
(8, 'Morning yoga session by the lake. Mind-body connection is powerful for mental clarity and physical wellbeing 🧘‍♀️ #Yoga #Health #Mindfulness #Wellness', '', 'public', 8, datetime('now', '-4 days'), datetime('now', '-4 days')),
(8, 'Photography walk through the old town. Light and shadows create the most beautiful compositions 📸 #Photography #Art #Architecture', '', 'public', 10, datetime('now', '-8 days'), datetime('now', '-8 days')),

-- Chris's posts (Technology/News/General)
(9, 'Cybersecurity threats are evolving rapidly. Organizations need to stay ahead with proactive measures and employee education 🔒 #Cybersecurity #Technology #InfoSec', '', 'public', 2, datetime('now', '-2 days'), datetime('now', '-2 days')),
(9, 'Election results analysis: voter turnout was historically high. Democracy in action is beautiful to witness 🗳️ #Politics #News #Democracy #Voting', '', 'public', 5, datetime('now', '-6 days'), datetime('now', '-6 days')),
(9, 'Coffee shop productivity session. Sometimes a change of environment boosts creativity exponentially ☕ #Productivity #Work #Lifestyle', '', 'public', 1, datetime('now', '-9 days'), datetime('now', '-9 days')),

-- Jessica's posts (Entertainment/Food/Travel)
(10, 'Concert last night was absolutely incredible! Live music has a magic that recorded music just cannot replicate 🎵 #Music #Concert #Entertainment #Live', '', 'public', 4, datetime('now', '-1 day'), datetime('now', '-1 day')),
(10, 'Farmers market haul: organic vegetables, fresh bread, local honey. Supporting local producers feels so rewarding 🥕 #LocalFood #Organic #Community #Food', '', 'public', 7, datetime('now', '-3 days'), datetime('now', '-3 days')),
(10, 'Road trip planning for next month. Nothing beats the freedom of the open road and spontaneous discoveries 🚗 #RoadTrip #Travel #Adventure #Freedom', '', 'public', 6, datetime('now', '-5 days'), datetime('now', '-5 days'));