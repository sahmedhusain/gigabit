-- Mock data for event_responses table
INSERT INTO event_responses (event_id, user_id, response, created_at, updated_at) VALUES
-- Event 1: AI & Machine Learning Workshop (Tech Enthusiasts)
(1, 1, 'going', datetime('now', '-275 days'), datetime('now', '-275 days')),
(1, 2, 'going', datetime('now', '-274 days'), datetime('now', '-274 days')),
(1, 3, 'going', datetime('now', '-273 days'), datetime('now', '-273 days')),
(1, 4, 'going', datetime('now', '-272 days'), datetime('now', '-272 days')),
(1, 5, 'going', datetime('now', '-271 days'), datetime('now', '-271 days')),
(1, 7, 'going', datetime('now', '-270 days'), datetime('now', '-270 days')),
(1, 9, 'going', datetime('now', '-269 days'), datetime('now', '-269 days')),
(1, 11, 'not_going', datetime('now', '-268 days'), datetime('now', '-268 days')),

-- Event 2: Tech Meetup (Tech Enthusiasts)
(2, 1, 'going', datetime('now', '-265 days'), datetime('now', '-265 days')),
(2, 2, 'going', datetime('now', '-264 days'), datetime('now', '-264 days')),
(2, 3, 'going', datetime('now', '-263 days'), datetime('now', '-263 days')),
(2, 5, 'going', datetime('now', '-262 days'), datetime('now', '-262 days')),
(2, 7, 'going', datetime('now', '-261 days'), datetime('now', '-261 days')),
(2, 8, 'going', datetime('now', '-260 days'), datetime('now', '-260 days')),
(2, 12, 'not_going', datetime('now', '-259 days'), datetime('now', '-259 days')),

-- Event 3: Design Critique Session (Design & Creativity)
(3, 2, 'going', datetime('now', '-255 days'), datetime('now', '-255 days')),
(3, 1, 'going', datetime('now', '-254 days'), datetime('now', '-254 days')),
(3, 6, 'going', datetime('now', '-253 days'), datetime('now', '-253 days')),
(3, 7, 'going', datetime('now', '-252 days'), datetime('now', '-252 days')),
(3, 4, 'going', datetime('now', '-251 days'), datetime('now', '-251 days')),
(3, 8, 'going', datetime('now', '-250 days'), datetime('now', '-250 days')),
(3, 12, 'going', datetime('now', '-249 days'), datetime('now', '-249 days')),
(3, 15, 'not_going', datetime('now', '-248 days'), datetime('now', '-248 days')),

-- Event 4: Creative Portfolio Review (Design & Creativity)
(4, 2, 'going', datetime('now', '-245 days'), datetime('now', '-245 days')),
(4, 6, 'going', datetime('now', '-244 days'), datetime('now', '-244 days')),
(4, 7, 'going', datetime('now', '-243 days'), datetime('now', '-243 days')),
(4, 4, 'going', datetime('now', '-242 days'), datetime('now', '-242 days')),
(4, 8, 'going', datetime('now', '-241 days'), datetime('now', '-241 days')),
(4, 12, 'going', datetime('now', '-240 days'), datetime('now', '-240 days')),
(4, 15, 'going', datetime('now', '-239 days'), datetime('now', '-239 days')),
(4, 18, 'not_going', datetime('now', '-238 days'), datetime('now', '-238 days')),

-- Event 5: Morning Yoga Session (Fitness & Wellness)
(5, 3, 'going', datetime('now', '-235 days'), datetime('now', '-235 days')),
(5, 1, 'going', datetime('now', '-234 days'), datetime('now', '-234 days')),
(5, 8, 'going', datetime('now', '-233 days'), datetime('now', '-233 days')),
(5, 5, 'going', datetime('now', '-232 days'), datetime('now', '-232 days')),
(5, 10, 'going', datetime('now', '-231 days'), datetime('now', '-231 days')),
(5, 13, 'going', datetime('now', '-230 days'), datetime('now', '-230 days')),
(5, 16, 'going', datetime('now', '-229 days'), datetime('now', '-229 days')),
(5, 19, 'not_going', datetime('now', '-228 days'), datetime('now', '-228 days')),

-- Event 6: Monthly Book Discussion (Book Club)
(6, 4, 'going', datetime('now', '-225 days'), datetime('now', '-225 days')),
(6, 1, 'going', datetime('now', '-224 days'), datetime('now', '-224 days')),
(6, 2, 'going', datetime('now', '-223 days'), datetime('now', '-223 days')),
(6, 5, 'going', datetime('now', '-222 days'), datetime('now', '-222 days')),
(6, 6, 'going', datetime('now', '-221 days'), datetime('now', '-221 days')),
(6, 7, 'going', datetime('now', '-220 days'), datetime('now', '-220 days')),
(6, 9, 'going', datetime('now', '-219 days'), datetime('now', '-219 days')),
(6, 14, 'not_going', datetime('now', '-218 days'), datetime('now', '-218 days')),

-- Event 7: LAN Party Tournament (Gaming Community)
(7, 5, 'going', datetime('now', '-215 days'), datetime('now', '-215 days')),
(7, 1, 'going', datetime('now', '-214 days'), datetime('now', '-214 days')),
(7, 3, 'going', datetime('now', '-213 days'), datetime('now', '-213 days')),
(7, 8, 'going', datetime('now', '-212 days'), datetime('now', '-212 days')),
(7, 7, 'going', datetime('now', '-211 days'), datetime('now', '-211 days')),
(7, 11, 'going', datetime('now', '-210 days'), datetime('now', '-210 days')),
(7, 17, 'going', datetime('now', '-209 days'), datetime('now', '-209 days')),
(7, 20, 'not_going', datetime('now', '-208 days'), datetime('now', '-208 days')),

-- Event 8: Startup Pitch Night (Entrepreneurship Hub)
(8, 7, 'going', datetime('now', '-205 days'), datetime('now', '-205 days')),
(8, 1, 'going', datetime('now', '-204 days'), datetime('now', '-204 days')),
(8, 2, 'going', datetime('now', '-203 days'), datetime('now', '-203 days')),
(8, 3, 'going', datetime('now', '-202 days'), datetime('now', '-202 days')),
(8, 4, 'going', datetime('now', '-201 days'), datetime('now', '-201 days')),
(8, 5, 'going', datetime('now', '-200 days'), datetime('now', '-200 days')),
(8, 10, 'going', datetime('now', '-199 days'), datetime('now', '-199 days')),
(8, 13, 'not_going', datetime('now', '-198 days'), datetime('now', '-198 days'));