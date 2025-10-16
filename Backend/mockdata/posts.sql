-- Mock Posts Data
-- Creating diverse posts from different users
-- Mock Posts Data
-- Creating diverse posts from different users

INSERT INTO posts (user_id, content, image_url, privacy, created_at, updated_at) VALUES
-- John's posts (very active - 12 posts)
(1, 'Just finished working on a new React project! The new features in React 18 are amazing. Concurrent rendering is a game changer for performance 🚀 #React #WebDev #JavaScript', '', 'public', datetime('now', '-350 days'), datetime('now', '-350 days')),
(1, 'Beautiful sunset from my office window today. Sometimes you need to pause and appreciate the simple things in life 🌅', '', 'public', datetime('now', '-340 days'), datetime('now', '-340 days')),
(1, 'Started learning Go language this week. The simplicity and performance are impressive. Any Go developers here with tips for a beginner?', '', 'public', datetime('now', '-330 days'), datetime('now', '-330 days')),
(1, 'Excited to announce I''ve joined a new startup working on AI-powered development tools! The future of coding is here 🤖', '', 'public', datetime('now', '-320 days'), datetime('now', '-320 days')),
(1, 'Weekend project: Built a simple REST API in Go. Loving the clean syntax and built-in concurrency features!', '', 'public', datetime('now', '-310 days'), datetime('now', '-310 days')),
(1, 'Question for the community: What''s your favorite debugging technique? Mine is definitely adding console.log everywhere 😂', '', 'public', datetime('now', '-300 days'), datetime('now', '-300 days')),
(1, 'Attended a tech conference today. So many inspiring talks about the future of web development. Mind blown!', '', 'public', datetime('now', '-290 days'), datetime('now', '-290 days')),
(1, 'Finally implemented authentication in my app! JWT tokens are powerful but tricky. Security is no joke 🔐', '', 'public', datetime('now', '-280 days'), datetime('now', '-280 days')),
(1, 'Coffee and code - the perfect combination ☕👨‍💻 What''s your coding fuel?', '', 'public', datetime('now', '-270 days'), datetime('now', '-270 days')),
(1, 'Just deployed my first production app! Nervous but excited. Here''s to many more successful deployments! 🎉', '', 'public', datetime('now', '-260 days'), datetime('now', '-260 days')),
(1, 'Learning about microservices architecture. It''s complex but so rewarding. Any good resources you recommend?', '', 'public', datetime('now', '-250 days'), datetime('now', '-250 days')),
(1, 'Happy to share that I''ve been promoted to Senior Developer! Hard work pays off 💪 #CareerGoals', '', 'public', datetime('now', '-240 days'), datetime('now', '-240 days')),

-- Sarah's posts (very active - 11 posts)
(2, 'Just launched our new digital marketing campaign! The results in the first 24 hours have been incredible. ROI is through the roof 📈 #DigitalMarketing #Success', '', 'public', datetime('now', '-345 days'), datetime('now', '-345 days')),
(2, 'Exploring the beautiful streets of Barcelona this weekend! The architecture here is absolutely stunning. Gaudí was truly a genius ✨ #Travel #Barcelona #Architecture', '', 'public', datetime('now', '-335 days'), datetime('now', '-335 days')),
(2, 'Coffee tasting session at the local roastery today. Learned so much about single-origin beans and brewing techniques ☕ #Coffee #Learning', '', 'public', datetime('now', '-325 days'), datetime('now', '-325 days')),
(2, 'Digital nomad life is calling! Just booked flights to Bali for a month-long workation. Who''s joining me? 🌴 #DigitalNomad #Travel', '', 'public', datetime('now', '-315 days'), datetime('now', '-315 days')),
(2, 'Content creation tip: Always focus on storytelling. People connect with stories, not just facts. What''s your content strategy?', '', 'public', datetime('now', '-305 days'), datetime('now', '-305 days')),
(2, 'Sunrise yoga on the beach this morning. Perfect way to start the day 🧘‍♀️ #Wellness #MorningRoutine', '', 'public', datetime('now', '-295 days'), datetime('now', '-295 days')),
(2, 'Excited to speak at the Marketing Summit next month! Topic: Social Media Trends for 2025 📱 #Speaking #Marketing', '', 'public', datetime('now', '-285 days'), datetime('now', '-285 days')),
(2, 'Tried a new recipe today - vegan sushi rolls! Surprisingly delicious. Who knew healthy could taste this good? 🍣 #HealthyEating', '', 'public', datetime('now', '-275 days'), datetime('now', '-275 days')),
(2, 'Networking event tonight. Met so many amazing entrepreneurs. The energy was electric! 🤝 #Networking #Entrepreneurship', '', 'public', datetime('now', '-265 days'), datetime('now', '-265 days')),
(2, 'Reading "Atomic Habits" and it''s changing how I approach goal setting. Small changes, big results 📚 #PersonalDevelopment', '', 'public', datetime('now', '-255 days'), datetime('now', '-255 days')),
(2, 'Weekend getaway to the mountains. Nature therapy is the best therapy 🌲 #Nature #MentalHealth', '', 'public', datetime('now', '-245 days'), datetime('now', '-245 days')),

-- Mike's posts (active - 10 posts)
(3, 'Completed a 10K run this morning! Personal best time: 42 minutes. Consistency and dedication really pay off 🏃‍♂️ #Fitness #Running #PersonalRecord', '', 'public', datetime('now', '-340 days'), datetime('now', '-340 days')),
(3, 'Amazing basketball game last night! The final shot was absolutely incredible. Love the intensity of playoff season 🏀 #Basketball #Sports #Playoffs', '', 'public', datetime('now', '-330 days'), datetime('now', '-330 days')),
(3, 'Started a new workout routine focusing on functional fitness. The difference in everyday activities is already noticeable 💪 #Fitness #Health #Wellness', '', 'public', datetime('now', '-320 days'), datetime('now', '-320 days')),
(3, 'Meal prep Sunday! Healthy eating made easy. What''s your go-to healthy meal? 🥗 #MealPrep #HealthyEating', '', 'public', datetime('now', '-310 days'), datetime('now', '-310 days')),
(3, 'CrossFit competition this weekend! Nervous but excited. Training has been intense 💥 #CrossFit #Competition', '', 'public', datetime('now', '-300 days'), datetime('now', '-300 days')),
(3, 'Recovery is just as important as training. Foam rolling and stretching after every workout 🧘‍♂️ #Recovery #Fitness', '', 'public', datetime('now', '-290 days'), datetime('now', '-290 days')),
(3, 'Nutrition tip: Focus on whole foods. Your body will thank you! What''s your favorite superfood? 🥑 #Nutrition #Health', '', 'public', datetime('now', '-280 days'), datetime('now', '-280 days')),
(3, 'Marathon training update: Week 12 complete! The mental game is getting tougher but I''m committed 🏃‍♂️ #Marathon #Training', '', 'public', datetime('now', '-270 days'), datetime('now', '-270 days')),
(3, 'Group fitness class today was amazing! The community energy makes all the difference 👥 #GroupFitness #Community', '', 'public', datetime('now', '-260 days'), datetime('now', '-260 days')),
(3, 'Rest day wisdom: Sometimes the best workout is the one you skip. Listen to your body 💤 #RestDay #SelfCare', '', 'public', datetime('now', '-250 days'), datetime('now', '-250 days')),

-- Alice's posts (moderate - 7 posts, private account)
(4, 'Just finished painting a landscape piece inspired by my recent trip to the mountains. Art therapy is real! 🎨 #Painting #Art #Landscape #Creativity', '', 'public', datetime('now', '-335 days'), datetime('now', '-335 days')),
(4, 'Movie night: watched the new sci-fi thriller. The cinematography was breathtaking, but the plot could have been tighter 🎬 #Movies #Cinema #Review', '', 'public', datetime('now', '-325 days'), datetime('now', '-325 days')),
(4, 'Teaching watercolor techniques to beginners today. Seeing their faces light up when they create something beautiful never gets old 🎨 #Teaching #Art #Education', '', 'public', datetime('now', '-315 days'), datetime('now', '-315 days')),
(4, 'Design portfolio update! Added my latest branding project. Feedback welcome 🎨 #Design #Branding #Portfolio', '', 'friends', datetime('now', '-305 days'), datetime('now', '-305 days')),
(4, 'Exploring abstract art styles. Sometimes breaking the rules leads to the best creations 🎨 #AbstractArt #Creativity', '', 'public', datetime('now', '-295 days'), datetime('now', '-295 days')),
(4, 'Client project complete! So happy with how this logo turned out. What do you think? 🏷️ #LogoDesign #ClientWork', '', 'public', datetime('now', '-285 days'), datetime('now', '-285 days')),
(4, 'Art supplies haul! New paints, brushes, and canvases. Can''t wait to create 🎨 #ArtSupplies #Creativity', '', 'friends', datetime('now', '-275 days'), datetime('now', '-275 days')),

-- David's posts (active - 9 posts)
(5, 'AI development is moving so fast! GPT-4 capabilities are mind-blowing. We are living in interesting times 🤖 #AI #Technology #Innovation #Future', '', 'public', datetime('now', '-325 days'), datetime('now', '-325 days')),
(5, 'Climate change summit outcomes are promising. Technology and policy working together might actually make a difference 🌍 #ClimateChange #News #Environment', '', 'public', datetime('now', '-315 days'), datetime('now', '-315 days')),
(5, 'Blockchain technology beyond cryptocurrency is fascinating. Supply chain transparency applications are game-changing ⛓️ #Blockchain #Technology #Innovation', '', 'public', datetime('now', '-305 days'), datetime('now', '-305 days')),
(5, 'Product roadmap planning session today. User feedback is gold for prioritization 💎 #ProductManagement #Roadmap', '', 'public', datetime('now', '-295 days'), datetime('now', '-295 days')),
(5, 'Excited about our new feature launch! User testing showed 40% improvement in task completion rates 📊 #ProductLaunch', '', 'public', datetime('now', '-285 days'), datetime('now', '-285 days')),
(5, 'Startup life: Coffee, code, and customer feedback loops ☕👨‍💻 #StartupLife #Entrepreneurship', '', 'public', datetime('now', '-275 days'), datetime('now', '-275 days')),
(5, 'Attending a product conference this week. So many innovative ideas floating around 💡 #ProductConference', '', 'public', datetime('now', '-265 days'), datetime('now', '-265 days')),
(5, 'Data-driven decisions are changing everything. A/B testing our new onboarding flow 🚀 #DataDriven #ProductDesign', '', 'public', datetime('now', '-255 days'), datetime('now', '-255 days')),
(5, 'Team building activity today was awesome! Collaboration makes the dream work 👥 #TeamBuilding #Collaboration', '', 'public', datetime('now', '-245 days'), datetime('now', '-245 days')),

-- Emma's posts (moderate - 8 posts)
(6, 'Homemade pasta night! Nothing beats fresh linguine with homemade pesto. The basil from my garden makes all the difference 🍝 #Cooking #Food #Homemade', '', 'public', datetime('now', '-320 days'), datetime('now', '-320 days')),
(6, 'Hiking in the national park this weekend. 15 miles of pure nature therapy. Highly recommend disconnecting and reconnecting with nature 🥾 #Hiking #Nature #Health', '', 'public', datetime('now', '-310 days'), datetime('now', '-310 days')),
(6, 'Food market in Florence was incredible! The variety of fresh produce and local specialties was overwhelming in the best way 🍅 #Travel #Food #Italy', '', 'public', datetime('now', '-300 days'), datetime('now', '-300 days')),
(6, 'UX design principle: Keep it simple. Users don''t read, they scan. How do you simplify complex interfaces? 🎨 #UXDesign #Simplicity', '', 'public', datetime('now', '-290 days'), datetime('now', '-290 days')),
(6, 'Accessibility audit complete! Found and fixed 12 WCAG violations. Every user deserves a great experience ♿ #Accessibility #UX', '', 'public', datetime('now', '-280 days'), datetime('now', '-280 days')),
(6, 'Design system workshop today. Consistency across products is so important for user experience 🎨 #DesignSystem #UX', '', 'public', datetime('now', '-270 days'), datetime('now', '-270 days')),
(6, 'User research insights are changing our product direction. Talking to users is invaluable 💬 #UserResearch #UX', '', 'public', datetime('now', '-260 days'), datetime('now', '-260 days')),
(6, 'Weekend design challenge: Redesign a banking app. What features would you prioritize? 🏦 #DesignChallenge #UX', '', 'public', datetime('now', '-250 days'), datetime('now', '-250 days')),

-- James's posts (active - 10 posts)
(7, 'Champions League final was absolutely epic! What a match, what a tournament. Football at its finest ⚽ #Football #ChampionsLeague #Sports', '', 'public', datetime('now', '-315 days'), datetime('now', '-315 days')),
(7, 'Gaming session with the crew last night. New RPG is addictive! The storyline and character development are top-notch 🎮 #Gaming #Entertainment #RPG', '', 'public', datetime('now', '-305 days'), datetime('now', '-305 days')),
(7, 'Sunday family BBQ was perfect. Sometimes the simple moments are the most precious ❤️ #Family #Life #Gratitude', '', 'public', datetime('now', '-295 days'), datetime('now', '-295 days')),
(7, 'Open source contribution accepted! Fixed a critical bug in a popular JavaScript library. Community collaboration is amazing 👥 #OpenSource', '', 'public', datetime('now', '-285 days'), datetime('now', '-285 days')),
(7, 'Learning Rust this month. The ownership system is mind-bending but powerful 🦀 #Rust #Programming #Learning', '', 'public', datetime('now', '-275 days'), datetime('now', '-275 days')),
(7, 'Code review tip: Focus on logic and maintainability, not just style. What''s your approach to code reviews? 👨‍💻 #CodeReview', '', 'public', datetime('now', '-265 days'), datetime('now', '-265 days')),
(7, 'Hackathon weekend! Built a productivity app in 48 hours. Sleep is overrated when you''re in the zone 🚀 #Hackathon #Coding', '', 'public', datetime('now', '-255 days'), datetime('now', '-255 days')),
(7, 'Tech meetup tonight. Great discussions about the future of web frameworks 🌐 #TechMeetup #WebDev', '', 'public', datetime('now', '-245 days'), datetime('now', '-245 days')),
(7, 'Finally implemented CI/CD pipeline. Automated deployments are a game changer ⚙️ #DevOps #Automation', '', 'public', datetime('now', '-235 days'), datetime('now', '-235 days')),
(7, 'Weekend project: Built a weather app with real-time data. APIs are powerful! ☀️ #WebDev #APIs', '', 'public', datetime('now', '-225 days'), datetime('now', '-225 days')),

-- Lisa's posts (moderate - 6 posts, private)
(8, 'Machine learning model accuracy improved by 15% today! Feature engineering is an art 🎯 #MachineLearning #DataScience', '', 'public', datetime('now', '-310 days'), datetime('now', '-310 days')),
(8, 'Deep learning conference was mind-blowing. Neural networks are getting so sophisticated 🧠 #DeepLearning #AI', '', 'public', datetime('now', '-300 days'), datetime('now', '-300 days')),
(8, 'Data visualization tip: Choose the right chart for your data story 📊 #DataViz #Analytics', '', 'friends', datetime('now', '-290 days'), datetime('now', '-290 days')),
(8, 'Working on a recommendation system. Collaborative filtering is fascinating 🤝 #RecommendationSystem #ML', '', 'public', datetime('now', '-280 days'), datetime('now', '-280 days')),
(8, 'Big data processing challenge solved! Distributed computing saves the day 💾 #BigData #DistributedSystems', '', 'friends', datetime('now', '-270 days'), datetime('now', '-270 days')),
(8, 'Research paper accepted! Excited to share our findings on computer vision applications 📄 #Research #ComputerVision', '', 'public', datetime('now', '-260 days'), datetime('now', '-260 days')),

-- Ryan's posts (moderate - 7 posts)
(9, 'Concert last night was absolutely incredible! Live music has a magic that recorded music just cannot replicate 🎵 #Music #Concert #Entertainment #Live', '', 'public', datetime('now', '-305 days'), datetime('now', '-305 days')),
(9, 'Farmers market haul: organic vegetables, fresh bread, local honey. Supporting local producers feels so rewarding 🥕 #LocalFood #Organic #Community #Food', '', 'public', datetime('now', '-295 days'), datetime('now', '-295 days')),
(9, 'Road trip planning for next month. Nothing beats the freedom of the open road and spontaneous discoveries 🚗 #RoadTrip #Travel #Adventure #Freedom', '', 'public', datetime('now', '-285 days'), datetime('now', '-285 days')),
(9, 'Photography tip: Golden hour light transforms ordinary scenes into extraordinary images 🌅 #Photography #GoldenHour', '', 'public', datetime('now', '-275 days'), datetime('now', '-275 days')),
(9, 'Wedding photography session today. Capturing love stories is the best part of my job 💍 #WeddingPhotography #Love', '', 'public', datetime('now', '-265 days'), datetime('now', '-265 days')),
(9, 'Drone photography is opening up incredible perspectives. The world looks different from above 🛸 #DronePhotography #Aerial', '', 'public', datetime('now', '-255 days'), datetime('now', '-255 days')),
(9, 'Street photography walk in the city. Urban life is full of beautiful moments 📸 #StreetPhotography #Urban', '', 'public', datetime('now', '-245 days'), datetime('now', '-245 days')),

-- Sophia's posts (active - 9 posts)
(10, 'Social media engagement up 200% this month! Storytelling and authenticity are key 🔑 #SocialMedia #Marketing', '', 'public', datetime('now', '-300 days'), datetime('now', '-300 days')),
(10, 'Content creation is about connection. What stories are you telling? 📖 #ContentCreation #Storytelling', '', 'public', datetime('now', '-290 days'), datetime('now', '-290 days')),
(10, 'Instagram algorithm changes are keeping us on our toes! Adapting content strategy 📱 #Instagram #Algorithm', '', 'public', datetime('now', '-280 days'), datetime('now', '-280 days')),
(10, 'Collaborated with an amazing brand today. Cross-promotion done right 🤝 #Collaboration #Branding', '', 'public', datetime('now', '-270 days'), datetime('now', '-270 days')),
(10, 'Live session Q&A was so much fun! Connecting with followers in real-time is magical ✨ #LiveSession #Community', '', 'public', datetime('now', '-260 days'), datetime('now', '-260 days')),
(10, 'Behind the scenes of content creation. It''s not always glamorous but always rewarding 🎬 #BehindTheScenes #Content', '', 'public', datetime('now', '-250 days'), datetime('now', '-250 days')),
(10, 'TikTok dance challenge with my followers! Social media should be fun 💃 #TikTok #Dance #Fun', '', 'public', datetime('now', '-240 days'), datetime('now', '-240 days')),
(10, 'Brand partnership opportunity! Excited to work with companies that align with my values 🌱 #BrandPartnership #Values', '', 'public', datetime('now', '-230 days'), datetime('now', '-230 days')),
(10, 'Content calendar planning for next quarter. Consistency is key to growth 📅 #ContentPlanning #Consistency', '', 'public', datetime('now', '-220 days'), datetime('now', '-220 days')),

-- Oliver's posts (low - 4 posts)
(11, 'Market analysis shows interesting trends in tech stocks. Long-term investing beats day trading 📈 #Investing #Finance', '', 'public', datetime('now', '-295 days'), datetime('now', '-295 days')),
(11, 'Dividend investing strategy update: Focus on companies with sustainable payouts 💰 #Dividends #PassiveIncome', '', 'public', datetime('now', '-285 days'), datetime('now', '-285 days')),
(11, 'Financial planning tip: Emergency fund should cover 6-12 months of expenses 🏦 #FinancialPlanning #EmergencyFund', '', 'public', datetime('now', '-275 days'), datetime('now', '-275 days')),
(11, 'Real estate market insights: Location and fundamentals matter most 🏠 #RealEstate #Investing', '', 'public', datetime('now', '-265 days'), datetime('now', '-265 days')),

-- Mia's posts (low - 3 posts, private)
(12, 'Pet health tip: Regular check-ups can prevent major issues 🐾 #PetHealth #Veterinary', '', 'friends', datetime('now', '-290 days'), datetime('now', '-290 days')),
(12, 'Emergency pet care: Know the signs of common emergencies 🚨 #PetCare #Emergency', '', 'public', datetime('now', '-280 days'), datetime('now', '-280 days')),
(12, 'Adopting pets changes lives. Every animal deserves a loving home ❤️ #PetAdoption #AnimalWelfare', '', 'public', datetime('now', '-270 days'), datetime('now', '-270 days')),

-- Ethan's posts (moderate - 6 posts)
(13, 'Science communication is about making complex ideas accessible. What topic should I explain next? 🔬 #Science #Education', '', 'public', datetime('now', '-285 days'), datetime('now', '-285 days')),
(13, 'Climate science update: The data is clear, action is urgent 🌍 #ClimateScience #Environment', '', 'public', datetime('now', '-275 days'), datetime('now', '-275 days')),
(13, 'Quantum physics explained simply: Think of it as the universe''s ultimate magic trick 🎩 #QuantumPhysics #Science', '', 'public', datetime('now', '-265 days'), datetime('now', '-265 days')),
(13, 'Research breakthrough in renewable energy! Solar efficiency hits new record ☀️ #RenewableEnergy #Research', '', 'public', datetime('now', '-255 days'), datetime('now', '-255 days')),
(13, 'Science podcast episode dropping tomorrow! Discussing the future of space exploration 🚀 #Podcast #Space', '', 'public', datetime('now', '-245 days'), datetime('now', '-245 days')),
(13, 'Educational outreach event today. Inspiring the next generation of scientists 👩‍🔬 #STEM #Education', '', 'public', datetime('now', '-235 days'), datetime('now', '-235 days')),

-- Chloe's posts (moderate - 7 posts)
(14, 'Fashion week inspiration: Mixing vintage pieces with modern silhouettes 👗 #Fashion #Style #Vintage', '', 'public', datetime('now', '-280 days'), datetime('now', '-280 days')),
(14, 'Sustainable fashion is the future. Ethical brands are leading the way 🌱 #SustainableFashion #Ethics', '', 'public', datetime('now', '-270 days'), datetime('now', '-270 days')),
(14, 'Color palette of the season: Earthy tones with pops of color 🎨 #ColorPalette #FashionTrends', '', 'public', datetime('now', '-260 days'), datetime('now', '-260 days')),
(14, 'Behind the scenes of fashion design. From sketch to runway 🏃‍♀️ #FashionDesign #Process', '', 'public', datetime('now', '-250 days'), datetime('now', '-250 days')),
(14, 'Street style inspiration from the city. Urban fashion is so creative 🏙️ #StreetStyle #UrbanFashion', '', 'public', datetime('now', '-240 days'), datetime('now', '-240 days')),
(14, 'Collaborating with emerging designers. The fashion community is so supportive 👥 #Collaboration #FashionCommunity', '', 'public', datetime('now', '-230 days'), datetime('now', '-230 days')),
(14, 'Fashion tip: Invest in quality basics. They never go out of style 💼 #FashionTips #WardrobeEssentials', '', 'public', datetime('now', '-220 days'), datetime('now', '-220 days')),

-- Noah's posts (moderate - 8 posts)
(15, 'Gaming tournament victory! Team coordination was key to the win 🏆 #Gaming #Tournament #Victory', '', 'public', datetime('now', '-275 days'), datetime('now', '-275 days')),
(15, 'New game release review: Graphics are stunning, gameplay is addictive 🎮 #GameReview #Gaming', '', 'public', datetime('now', '-265 days'), datetime('now', '-265 days')),
(15, 'eSports is growing so fast! Professional gaming is becoming mainstream 🏅 #eSports #ProfessionalGaming', '', 'public', datetime('now', '-255 days'), datetime('now', '-255 days')),
(15, 'Streaming setup upgrade! Better quality means better viewer experience 📺 #Streaming #Setup', '', 'public', datetime('now', '-245 days'), datetime('now', '-245 days')),
(15, 'Gaming community event was amazing. Meeting fans in person is the best 🎉 #GamingCommunity #Events', '', 'public', datetime('now', '-235 days'), datetime('now', '-235 days')),
(15, 'Speedrun world record attempt! So close but so far 😅 #Speedrun #Gaming', '', 'public', datetime('now', '-225 days'), datetime('now', '-225 days')),
(15, 'Retro gaming night! Nothing beats the classics 🎮 #RetroGaming #Classics', '', 'public', datetime('now', '-215 days'), datetime('now', '-215 days')),
(15, 'Gaming tip: Communication is key in team games. Voice chat makes all the difference 🎙️ #GamingTips #Teamwork', '', 'public', datetime('now', '-205 days'), datetime('now', '-205 days')),

-- Alex's posts (low - 4 posts)
(16, 'Startup funding secured! Bootstrapping to Series A in 18 months 💰 #Startup #Funding #Success', '', 'public', datetime('now', '-270 days'), datetime('now', '-270 days')),
(16, 'Building a team is harder than building a product. Culture matters 👥 #TeamBuilding #StartupCulture', '', 'public', datetime('now', '-260 days'), datetime('now', '-260 days')),
(16, 'Product-market fit achieved! User growth is exponential 📈 #ProductMarketFit #Growth', '', 'public', datetime('now', '-250 days'), datetime('now', '-250 days')),
(16, 'Scaling challenges: Infrastructure costs are real 💸 #Scaling #StartupChallenges', '', 'public', datetime('now', '-240 days'), datetime('now', '-240 days')),

-- Isabella's posts (moderate - 6 posts)
(17, 'Climate research breakthrough: New data on ocean acidification 🌊 #ClimateResearch #Ocean', '', 'public', datetime('now', '-265 days'), datetime('now', '-265 days')),
(17, 'Environmental policy changes needed now. Science shows we''re at a tipping point ⚠️ #EnvironmentalPolicy #ClimateAction', '', 'public', datetime('now', '-255 days'), datetime('now', '-255 days')),
(17, 'Renewable energy adoption is accelerating. Solar and wind are winning 💨 #RenewableEnergy #CleanEnergy', '', 'public', datetime('now', '-245 days'), datetime('now', '-245 days')),
(17, 'Biodiversity loss is alarming. Conservation efforts must intensify 🐾 #Biodiversity #Conservation', '', 'public', datetime('now', '-235 days'), datetime('now', '-235 days')),
(17, 'Carbon capture technology shows promise. Innovation is key to climate solutions 🏭 #CarbonCapture #Innovation', '', 'public', datetime('now', '-225 days'), datetime('now', '-225 days')),
(17, 'Youth climate activism is inspiring. The next generation gets it 🌱 #ClimateActivism #Youth', '', 'public', datetime('now', '-215 days'), datetime('now', '-215 days')),

-- Jacob's posts (low - 3 posts)
(18, 'Farm-to-table cooking revolution! Fresh ingredients make all the difference 🍅 #FarmToTable #Cooking', '', 'public', datetime('now', '-260 days'), datetime('now', '-260 days')),
(18, 'Culinary fusion experiment: Asian-European fusion dish turned out amazing 🍜 #FusionCooking #Creativity', '', 'public', datetime('now', '-250 days'), datetime('now', '-250 days')),
(18, 'Cooking class today: Teaching knife skills to beginners 🔪 #CookingClass #Teaching', '', 'public', datetime('now', '-240 days'), datetime('now', '-240 days')),

-- Ava's posts (moderate - 5 posts, private)
(19, 'Investigative journalism in the digital age: Challenges and opportunities 📰 #Journalism #DigitalAge', '', 'friends', datetime('now', '-255 days'), datetime('now', '-255 days')),
(19, 'Storytelling through data visualization. Facts become compelling narratives 📊 #DataJournalism #Storytelling', '', 'public', datetime('now', '-245 days'), datetime('now', '-245 days')),
(19, 'Press freedom is under threat worldwide. Democracy depends on independent media 📰 #PressFreedom #Democracy', '', 'public', datetime('now', '-235 days'), datetime('now', '-235 days')),
(19, 'Multimedia storytelling: Combining text, video, and interactive elements 📱 #Multimedia #Journalism', '', 'friends', datetime('now', '-225 days'), datetime('now', '-225 days')),
(19, 'Community journalism matters. Local stories connect us all 🏘️ #CommunityJournalism #LocalNews', '', 'public', datetime('now', '-215 days'), datetime('now', '-215 days')),

-- Logan's posts (low - 4 posts)
(20, 'New composition finished! Exploring minimalist electronic music 🎵 #Composition #ElectronicMusic', '', 'public', datetime('now', '-250 days'), datetime('now', '-250 days')),
(20, 'Live performance tonight. Nervous but excited to share new material 🎤 #LivePerformance #Music', '', 'public', datetime('now', '-240 days'), datetime('now', '-240 days')),
(20, 'Music production tip: Layering sounds creates depth and emotion 🎛️ #MusicProduction #AudioEngineering', '', 'public', datetime('now', '-230 days'), datetime('now', '-230 days')),
(20, 'Collaborating with visual artists for a multimedia project 🎨 #Collaboration #Multimedia', '', 'public', datetime('now', '-220 days'), datetime('now', '-220 days')),

-- Samantha's posts (moderate - 6 posts)
(21, 'Teacher appreciation week! Celebrating educators everywhere 👩‍🏫 #TeacherAppreciation #Education', '', 'public', datetime('now', '-245 days'), datetime('now', '-245 days')),
(21, 'Project-based learning transforms student engagement 📚 #ProjectBasedLearning #Education', '', 'public', datetime('now', '-235 days'), datetime('now', '-235 days')),
(21, 'STEM education needs more funding. Future innovators depend on it 🔬 #STEM #EducationFunding', '', 'public', datetime('now', '-225 days'), datetime('now', '-225 days')),
(21, 'Parent-teacher conferences season. Communication is key to student success 💬 #ParentTeacher #Communication', '', 'public', datetime('now', '-215 days'), datetime('now', '-215 days')),
(21, 'Educational technology integration: Balancing screens and hands-on learning 💻 #EdTech #Balance', '', 'public', datetime('now', '-205 days'), datetime('now', '-205 days')),
(21, 'Graduation season is emotional. Proud of all my students'' achievements 🎓 #Graduation #Achievement', '', 'public', datetime('now', '-195 days'), datetime('now', '-195 days')),

-- Benjamin's posts (low - 3 posts)
(22, 'Sustainable architecture design: Buildings that work with nature 🏗️ #SustainableArchitecture #GreenBuilding', '', 'public', datetime('now', '-240 days'), datetime('now', '-240 days')),
(22, 'Urban planning challenge: Creating livable cities for everyone 🏙️ #UrbanPlanning #CityDesign', '', 'public', datetime('now', '-230 days'), datetime('now', '-230 days')),
(22, 'Historic preservation meets modern design. Beautiful blend of old and new 🏛️ #HistoricPreservation #Architecture', '', 'public', datetime('now', '-220 days'), datetime('now', '-220 days')),

-- Madison's posts (low - 2 posts, private)
(23, 'Mental health awareness month. Breaking stigma one conversation at a time 🧠 #MentalHealth #Awareness', '', 'friends', datetime('now', '-235 days'), datetime('now', '-235 days')),
(23, 'Therapy is a sign of strength, not weakness 💪 #MentalHealth #Therapy', '', 'public', datetime('now', '-225 days'), datetime('now', '-225 days')),

-- William's posts (moderate - 5 posts)
(24, 'Microservices architecture migration complete. Scalability improved dramatically ⚙️ #Microservices #Architecture', '', 'public', datetime('now', '-230 days'), datetime('now', '-230 days')),
(24, 'System design interview prep: Always consider trade-offs 🔄 #SystemDesign #InterviewPrep', '', 'public', datetime('now', '-220 days'), datetime('now', '-220 days')),
(24, 'Database optimization: Indexing strategy made queries 10x faster 📊 #Database #Optimization', '', 'public', datetime('now', '-210 days'), datetime('now', '-210 days')),
(24, 'API design principles: REST vs GraphQL debate continues 🌐 #APIDesign #GraphQL', '', 'public', datetime('now', '-200 days'), datetime('now', '-200 days')),
(24, 'DevOps culture: Developers and ops working together seamlessly 🤝 #DevOps #Culture', '', 'public', datetime('now', '-190 days'), datetime('now', '-190 days')),

-- Olivia's posts (moderate - 6 posts)
(25, 'New graphic novel chapter released! Exploring themes of identity and belonging 📖 #GraphicNovel #Identity', '', 'public', datetime('now', '-225 days'), datetime('now', '-225 days')),
(25, 'Comic con was incredible! Meeting readers and fellow creators 🎭 #ComicCon #Creators', '', 'public', datetime('now', '-215 days'), datetime('now', '-215 days')),
(25, 'Visual storytelling: How to convey emotion through panel layout 🎨 #VisualStorytelling #Comics', '', 'public', datetime('now', '-205 days'), datetime('now', '-205 days')),
(25, 'Color theory in comics: Using palette to enhance mood and atmosphere 🌈 #ColorTheory #Comics', '', 'public', datetime('now', '-195 days'), datetime('now', '-195 days')),
(25, 'Self-publishing journey: From manuscript to printed book 📚 #SelfPublishing #IndieAuthor', '', 'public', datetime('now', '-185 days'), datetime('now', '-185 days')),
(25, 'Creative block breakthrough! Sometimes you just need to start drawing 🎨 #CreativeBlock #Drawing', '', 'public', datetime('now', '-175 days'), datetime('now', '-175 days')),

-- Henry's posts (low - 3 posts)
(26, 'New invention prototype complete! Smart irrigation system for urban farming 🌱 #Invention #Irrigation', '', 'public', datetime('now', '-220 days'), datetime('now', '-220 days')),
(26, 'Engineering challenge: Optimizing for both performance and sustainability ⚙️ #Engineering #Sustainability', '', 'public', datetime('now', '-210 days'), datetime('now', '-210 days')),
(26, 'Patent filed! Excited to see where this technology goes 📄 #Patent #Innovation', '', 'public', datetime('now', '-200 days'), datetime('now', '-200 days')),

-- Victoria's posts (moderate - 5 posts)
(27, 'Global education initiative launched! Connecting classrooms worldwide 🌍 #GlobalEducation #Initiative', '', 'public', datetime('now', '-215 days'), datetime('now', '-215 days')),
(27, 'Educational equity matters. Every child deserves quality education 📚 #EducationalEquity #Equality', '', 'public', datetime('now', '-205 days'), datetime('now', '-205 days')),
(27, 'Teacher training program expanding to 10 new countries 🗺️ #TeacherTraining #Global', '', 'public', datetime('now', '-195 days'), datetime('now', '-195 days')),
(27, 'Digital literacy for all: Bridging the digital divide 💻 #DigitalLiteracy #Access', '', 'public', datetime('now', '-185 days'), datetime('now', '-185 days')),
(27, 'Youth empowerment through education. The future leaders are ready 🌟 #YouthEmpowerment #Education', '', 'public', datetime('now', '-175 days'), datetime('now', '-175 days')),

-- Daniel's posts (low - 4 posts)
(28, 'Championship season starting! Training intensity is at peak levels 🏆 #Championship #Training', '', 'public', datetime('now', '-210 days'), datetime('now', '-210 days')),
(28, 'Team sports psychology: Mental preparation is half the battle 🧠 #SportsPsychology #MentalPrep', '', 'public', datetime('now', '-200 days'), datetime('now', '-200 days')),
(28, 'Injury prevention routine: Keeping athletes in the game 🏥 #InjuryPrevention #AthleteHealth', '', 'public', datetime('now', '-190 days'), datetime('now', '-190 days')),
(28, 'Post-game recovery: Ice baths and proper nutrition for optimal performance ❄️ #Recovery #Performance', '', 'public', datetime('now', '-180 days'), datetime('now', '-180 days')),

-- Remaining users have minimal posts to reach 150 total
(29, 'Tech startup life: Pivot or persevere? Current dilemma 💭 #Startup #DecisionMaking', '', 'public', datetime('now', '-205 days'), datetime('now', '-205 days')),
(29, 'Remote work productivity hacks that actually work 💻 #RemoteWork #Productivity', '', 'public', datetime('now', '-195 days'), datetime('now', '-195 days')),
(30, 'AI ethics discussion: Bias in algorithms must be addressed 🤖 #AI #Ethics', '', 'public', datetime('now', '-200 days'), datetime('now', '-200 days')),
(30, 'Machine learning fairness research is crucial 📊 #ML #Fairness', '', 'public', datetime('now', '-190 days'), datetime('now', '-190 days')),
-- Recent posts from new users (31-40)
(31, 'Excited to join the AI research community! Just published my first paper on neural network optimization 🧠 #AI #Research #NeuralNetworks', '', 'public', datetime('now', '-60 days'), datetime('now', '-60 days')),
(31, 'Weekend hackathon: Built an AI-powered code review tool. Open sourcing it soon! 🚀 #AI #Coding #OpenSource', '', 'public', datetime('now', '-45 days'), datetime('now', '-45 days')),
(31, 'Deep learning tip: Always validate your model on unseen data. Overfitting is the silent killer 📈 #DeepLearning #MachineLearning', '', 'public', datetime('now', '-30 days'), datetime('now', '-30 days')),
(31, 'Attending the AI conference next week. So many groundbreaking talks lined up! 🤖 #AI #Conference', '', 'public', datetime('now', '-15 days'), datetime('now', '-15 days')),
(31, 'New research breakthrough: Our model achieved 95% accuracy on benchmark datasets! 📊 #AI #Breakthrough', '', 'public', datetime('now', '-5 days'), datetime('now', '-5 days')),
(32, 'UX research findings: Users prefer intuitive navigation over fancy animations 🎯 #UX #Research #UserExperience', '', 'public', datetime('now', '-55 days'), datetime('now', '-55 days')),
(32, 'Human-centered design workshop was inspiring. Empathy drives better products ❤️ #HumanCenteredDesign #UX', '', 'public', datetime('now', '-40 days'), datetime('now', '-40 days')),
(32, 'A/B testing results: Simplified onboarding increased conversion by 35% 📈 #ABTesting #UX #Conversion', '', 'public', datetime('now', '-25 days'), datetime('now', '-25 days')),
(32, 'Accessibility audit complete! Fixed 15 violations. Inclusive design matters ♿ #Accessibility #UX', '', 'public', datetime('now', '-10 days'), datetime('now', '-10 days')),
(32, 'User interview insights: Pain points often reveal the biggest opportunities 💡 #UserInterviews #UX', '', 'public', datetime('now', '-2 days'), datetime('now', '-2 days')),
(33, 'DevOps automation saves lives! Just automated our entire deployment pipeline ⚙️ #DevOps #Automation #CI/CD', '', 'public', datetime('now', '-50 days'), datetime('now', '-50 days')),
(33, 'Cloud migration complete! Azure infrastructure is performing beautifully ☁️ #Cloud #Azure #Migration', '', 'public', datetime('now', '-35 days'), datetime('now', '-35 days')),
(33, 'Kubernetes cluster optimization: Reduced costs by 40% while improving reliability 🐳 #Kubernetes #Optimization', '', 'public', datetime('now', '-20 days'), datetime('now', '-20 days')),
(33, 'Infrastructure as Code with Terraform is a game changer 🏗️ #IaC #Terraform #Infrastructure', '', 'public', datetime('now', '-8 days'), datetime('now', '-8 days')),
(33, 'Monitoring setup: Prometheus and Grafana for real-time insights 📊 #Monitoring #Prometheus #Grafana', '', 'public', datetime('now', '-1 day'), datetime('now', '-1 day')),
(34, 'CRISPR gene editing breakthrough in our lab! Potential treatments for genetic diseases 🧬 #CRISPR #Biotech #Genetics', '', 'public', datetime('now', '-48 days'), datetime('now', '-48 days')),
(34, 'Stem cell research update: New protocols showing promising results 🌱 #StemCells #Research #Biotech', '', 'public', datetime('now', '-32 days'), datetime('now', '-32 days')),
(34, 'Bioethics discussion: The responsible development of biotechnology matters 🤝 #Bioethics #Biotech', '', 'public', datetime('now', '-18 days'), datetime('now', '-18 days')),
(34, 'Lab automation: Robots are revolutionizing drug discovery 🤖 #LabAutomation #DrugDiscovery', '', 'public', datetime('now', '-6 days'), datetime('now', '-6 days')),
(34, 'Personalized medicine is the future. Genomics data is key 🔑 #PersonalizedMedicine #Genomics', '', 'public', datetime('now', '-3 days'), datetime('now', '-3 days')),
(35, 'Indie game development is challenging but rewarding! Just released my first mobile game 🎮 #IndieDev #GameDev #MobileGames', '', 'public', datetime('now', '-42 days'), datetime('now', '-42 days')),
(35, 'Unity vs Unreal Engine debate: Both have their strengths for different projects 🎯 #Unity #Unreal #GameDev', '', 'public', datetime('now', '-28 days'), datetime('now', '-28 days')),
(35, 'Game jam weekend: Built a puzzle game in 48 hours. Creativity under pressure! 🧩 #GameJam #Creativity', '', 'public', datetime('now', '-14 days'), datetime('now', '-14 days')),
(35, 'Player feedback is gold! Updated my game based on user suggestions ⭐ #PlayerFeedback #GameDev', '', 'public', datetime('now', '-7 days'), datetime('now', '-7 days')),
(35, 'Monetization strategies for indie games: Finding the right balance 💰 #IndieGames #Monetization', '', 'public', datetime('now', '-4 days'), datetime('now', '-4 days')),
(36, 'Climate activism update: Our petition reached 100k signatures! 🌍 #ClimateAction #Activism #Environment', '', 'public', datetime('now', '-38 days'), datetime('now', '-38 days')),
(36, 'Youth climate summit was empowering. The next generation is ready to lead 🌱 #Youth #Climate #Leadership', '', 'public', datetime('now', '-24 days'), datetime('now', '-24 days')),
(36, 'Carbon footprint reduction: Small changes add up. Started biking to work 🚲 #CarbonFootprint #Sustainability', '', 'public', datetime('now', '-12 days'), datetime('now', '-12 days')),
(36, 'Environmental journalism: Holding corporations accountable for greenwashing 📰 #EnvironmentalJournalism #Greenwashing', '', 'public', datetime('now', '-9 days'), datetime('now', '-9 days')),
(36, 'Renewable energy revolution is happening! Solar panels on every roof soon ☀️ #RenewableEnergy #Solar', '', 'public', datetime('now', '-6 days'), datetime('now', '-6 days')),
(37, 'Mobile app development tip: Performance matters. Optimize images and reduce bundle size 📱 #MobileDev #Performance', '', 'public', datetime('now', '-36 days'), datetime('now', '-36 days')),
(37, 'Cross-platform development with React Native is evolving fast ⚛️ #ReactNative #CrossPlatform #Mobile', '', 'public', datetime('now', '-22 days'), datetime('now', '-22 days')),
(37, 'App Store optimization: ASO strategies that actually work 📈 #ASO #AppMarketing #Mobile', '', 'public', datetime('now', '-11 days'), datetime('now', '-11 days')),
(37, 'User acquisition challenge: Finding the right channels for growth 📊 #UserAcquisition #Growth', '', 'public', datetime('now', '-8 days'), datetime('now', '-8 days')),
(37, 'Mobile UI trends: Dark mode and gesture navigation are here to stay 🌙 #MobileUI #Trends', '', 'public', datetime('now', '-5 days'), datetime('now', '-5 days')),
(38, 'Social impact startup launched! Connecting volunteers with local NGOs 🤝 #SocialImpact #Startup #Volunteering', '', 'public', datetime('now', '-34 days'), datetime('now', '-34 days')),
(38, 'Community building: Online platforms can create real-world change 🌐 #Community #SocialChange', '', 'public', datetime('now', '-20 days'), datetime('now', '-20 days')),
(38, 'Impact measurement: How do we quantify social good? 📊 #ImpactMeasurement #SocialGood', '', 'public', datetime('now', '-13 days'), datetime('now', '-13 days')),
(38, 'Non-profit collaboration: Partnering for greater impact 👥 #NonProfit #Collaboration', '', 'public', datetime('now', '-7 days'), datetime('now', '-7 days')),
(38, 'Social entrepreneurship: Business models that create positive change 💼 #SocialEntrepreneurship #PositiveChange', '', 'public', datetime('now', '-3 days'), datetime('now', '-3 days')),
(39, 'Data visualization breakthrough: Interactive dashboards that tell stories 📊 #DataViz #Analytics #Storytelling', '', 'public', datetime('now', '-32 days'), datetime('now', '-32 days')),
(39, 'Big data processing: Handling petabytes of data efficiently 💾 #BigData #DataProcessing', '', 'public', datetime('now', '-18 days'), datetime('now', '-18 days')),
(39, 'Machine learning in production: MLOps best practices 🤖 #MLOps #MachineLearning #Production', '', 'public', datetime('now', '-10 days'), datetime('now', '-10 days')),
(39, 'Data storytelling: Turning numbers into narratives 📈 #DataStorytelling #Analytics', '', 'public', datetime('now', '-6 days'), datetime('now', '-6 days')),
(39, 'Real-time analytics dashboard deployed! Live data insights are powerful ⚡ #RealTimeAnalytics #Dashboard', '', 'public', datetime('now', '-2 days'), datetime('now', '-2 days')),
(40, 'Cybersecurity awareness: Multi-factor authentication saves lives 🔐 #Cybersecurity #MFA #Security', '', 'public', datetime('now', '-30 days'), datetime('now', '-30 days')),
(40, 'Ethical hacking: Finding vulnerabilities before attackers do 🕵️‍♂️ #EthicalHacking #Cybersecurity', '', 'public', datetime('now', '-16 days'), datetime('now', '-16 days')),
(40, 'Zero-trust architecture: Never trust, always verify 🔒 #ZeroTrust #Security #Architecture', '', 'public', datetime('now', '-9 days'), datetime('now', '-9 days')),
(40, 'Incident response planning: Preparation prevents panic 📋 #IncidentResponse #Security', '', 'public', datetime('now', '-4 days'), datetime('now', '-4 days')),
(40, 'Blockchain security: Immutable ledgers for secure transactions ⛓️ #Blockchain #Security', '', 'public', datetime('now', '-1 day'), datetime('now', '-1 day'));