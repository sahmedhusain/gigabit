-- Mock data for group_members table
INSERT INTO group_members (group_id, user_id, role, status, created_at, updated_at) VALUES
-- Tech Enthusiasts (group_id: 1) - 8 members
(1, 1, 'admin', 'member', datetime('now', '-320 days'), datetime('now', '-320 days')),
(1, 2, 'member', 'member', datetime('now', '-315 days'), datetime('now', '-315 days')),
(1, 3, 'member', 'member', datetime('now', '-310 days'), datetime('now', '-310 days')),
(1, 4, 'member', 'member', datetime('now', '-305 days'), datetime('now', '-305 days')),
(1, 5, 'member', 'member', datetime('now', '-300 days'), datetime('now', '-300 days')),
(1, 7, 'member', 'member', datetime('now', '-295 days'), datetime('now', '-295 days')),
(1, 9, 'member', 'member', datetime('now', '-290 days'), datetime('now', '-290 days')),
(1, 11, 'member', 'member', datetime('now', '-285 days'), datetime('now', '-285 days')),

-- Design & Creativity (group_id: 2) - 8 members
(2, 2, 'admin', 'member', datetime('now', '-310 days'), datetime('now', '-310 days')),
(2, 1, 'member', 'member', datetime('now', '-305 days'), datetime('now', '-305 days')),
(2, 6, 'member', 'member', datetime('now', '-300 days'), datetime('now', '-300 days')),
(2, 7, 'member', 'member', datetime('now', '-295 days'), datetime('now', '-295 days')),
(2, 4, 'member', 'member', datetime('now', '-290 days'), datetime('now', '-290 days')),
(2, 8, 'member', 'member', datetime('now', '-285 days'), datetime('now', '-285 days')),
(2, 12, 'member', 'member', datetime('now', '-280 days'), datetime('now', '-280 days')),
(2, 15, 'member', 'member', datetime('now', '-275 days'), datetime('now', '-275 days')),

-- Fitness & Wellness (group_id: 3) - 8 members
(3, 3, 'admin', 'member', datetime('now', '-300 days'), datetime('now', '-300 days')),
(3, 1, 'member', 'member', datetime('now', '-295 days'), datetime('now', '-295 days')),
(3, 8, 'member', 'member', datetime('now', '-290 days'), datetime('now', '-290 days')),
(3, 5, 'member', 'member', datetime('now', '-285 days'), datetime('now', '-285 days')),
(3, 10, 'member', 'member', datetime('now', '-280 days'), datetime('now', '-280 days')),
(3, 13, 'member', 'member', datetime('now', '-275 days'), datetime('now', '-275 days')),
(3, 16, 'member', 'member', datetime('now', '-270 days'), datetime('now', '-270 days')),
(3, 19, 'member', 'member', datetime('now', '-265 days'), datetime('now', '-265 days')),

-- Book Club (group_id: 4) - 8 members
(4, 4, 'admin', 'member', datetime('now', '-290 days'), datetime('now', '-290 days')),
(4, 1, 'member', 'member', datetime('now', '-285 days'), datetime('now', '-285 days')),
(4, 2, 'member', 'member', datetime('now', '-280 days'), datetime('now', '-280 days')),
(4, 5, 'member', 'member', datetime('now', '-275 days'), datetime('now', '-275 days')),
(4, 6, 'member', 'member', datetime('now', '-270 days'), datetime('now', '-270 days')),
(4, 7, 'member', 'member', datetime('now', '-265 days'), datetime('now', '-265 days')),
(4, 9, 'member', 'member', datetime('now', '-260 days'), datetime('now', '-260 days')),
(4, 14, 'member', 'member', datetime('now', '-255 days'), datetime('now', '-255 days')),

-- Gaming Community (group_id: 5) - 8 members
(5, 5, 'admin', 'member', datetime('now', '-280 days'), datetime('now', '-280 days')),
(5, 1, 'member', 'member', datetime('now', '-275 days'), datetime('now', '-275 days')),
(5, 3, 'member', 'member', datetime('now', '-270 days'), datetime('now', '-270 days')),
(5, 8, 'member', 'member', datetime('now', '-265 days'), datetime('now', '-265 days')),
(5, 7, 'member', 'member', datetime('now', '-260 days'), datetime('now', '-260 days')),
(5, 11, 'member', 'member', datetime('now', '-255 days'), datetime('now', '-255 days')),
(5, 17, 'member', 'member', datetime('now', '-250 days'), datetime('now', '-250 days')),
(5, 20, 'member', 'member', datetime('now', '-245 days'), datetime('now', '-245 days')),

-- Photography Lovers (group_id: 6) - 8 members
(6, 6, 'admin', 'member', datetime('now', '-270 days'), datetime('now', '-270 days')),
(6, 2, 'member', 'member', datetime('now', '-265 days'), datetime('now', '-265 days')),
(6, 4, 'member', 'member', datetime('now', '-260 days'), datetime('now', '-260 days')),
(6, 9, 'member', 'member', datetime('now', '-255 days'), datetime('now', '-255 days')),
(6, 12, 'member', 'member', datetime('now', '-250 days'), datetime('now', '-250 days')),
(6, 15, 'member', 'member', datetime('now', '-245 days'), datetime('now', '-245 days')),
(6, 18, 'member', 'member', datetime('now', '-240 days'), datetime('now', '-240 days')),
(6, 21, 'member', 'member', datetime('now', '-235 days'), datetime('now', '-235 days')),

-- Entrepreneurship Hub (group_id: 7) - 8 members
(7, 7, 'admin', 'member', datetime('now', '-260 days'), datetime('now', '-260 days')),
(7, 1, 'member', 'member', datetime('now', '-255 days'), datetime('now', '-255 days')),
(7, 2, 'member', 'member', datetime('now', '-250 days'), datetime('now', '-250 days')),
(7, 3, 'member', 'member', datetime('now', '-245 days'), datetime('now', '-245 days')),
(7, 4, 'member', 'member', datetime('now', '-240 days'), datetime('now', '-240 days')),
(7, 5, 'member', 'member', datetime('now', '-235 days'), datetime('now', '-235 days')),
(7, 10, 'member', 'member', datetime('now', '-230 days'), datetime('now', '-230 days')),
(7, 13, 'member', 'member', datetime('now', '-225 days'), datetime('now', '-225 days')),

-- Music & Arts (group_id: 8) - 8 members
(8, 8, 'admin', 'member', datetime('now', '-250 days'), datetime('now', '-250 days')),
(8, 2, 'member', 'member', datetime('now', '-245 days'), datetime('now', '-245 days')),
(8, 6, 'member', 'member', datetime('now', '-240 days'), datetime('now', '-240 days')),
(8, 7, 'member', 'member', datetime('now', '-235 days'), datetime('now', '-235 days')),
(8, 4, 'member', 'member', datetime('now', '-230 days'), datetime('now', '-230 days')),
(8, 12, 'member', 'member', datetime('now', '-225 days'), datetime('now', '-225 days')),
(8, 16, 'member', 'member', datetime('now', '-220 days'), datetime('now', '-220 days')),
(8, 22, 'member', 'member', datetime('now', '-215 days'), datetime('now', '-215 days')),

-- Travel Explorers (group_id: 9) - 8 members
(9, 9, 'admin', 'member', datetime('now', '-240 days'), datetime('now', '-240 days')),
(9, 1, 'member', 'member', datetime('now', '-235 days'), datetime('now', '-235 days')),
(9, 2, 'member', 'member', datetime('now', '-230 days'), datetime('now', '-230 days')),
(9, 6, 'member', 'member', datetime('now', '-225 days'), datetime('now', '-225 days')),
(9, 10, 'member', 'member', datetime('now', '-220 days'), datetime('now', '-220 days')),
(9, 14, 'member', 'member', datetime('now', '-215 days'), datetime('now', '-215 days')),
(9, 18, 'member', 'member', datetime('now', '-210 days'), datetime('now', '-210 days')),
(9, 23, 'member', 'member', datetime('now', '-205 days'), datetime('now', '-205 days')),

-- Cooking & Recipes (group_id: 10) - 8 members
(10, 10, 'admin', 'member', datetime('now', '-230 days'), datetime('now', '-230 days')),
(10, 3, 'member', 'member', datetime('now', '-225 days'), datetime('now', '-225 days')),
(10, 5, 'member', 'member', datetime('now', '-220 days'), datetime('now', '-220 days')),
(10, 7, 'member', 'member', datetime('now', '-215 days'), datetime('now', '-215 days')),
(10, 11, 'member', 'member', datetime('now', '-210 days'), datetime('now', '-210 days')),
(10, 13, 'member', 'member', datetime('now', '-205 days'), datetime('now', '-205 days')),
(10, 17, 'member', 'member', datetime('now', '-200 days'), datetime('now', '-200 days')),
(10, 24, 'member', 'member', datetime('now', '-195 days'), datetime('now', '-195 days'));
