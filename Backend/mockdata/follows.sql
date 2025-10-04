-- Mock Follows Data
-- Creating a complex social graph with 200 relationships

INSERT INTO follows (follower_id, following_id, status, created_at, updated_at) VALUES
-- John (1) follows 15 people
(1, 2, 'accepted', datetime('now', '-350 days'), datetime('now', '-350 days')),
(1, 3, 'accepted', datetime('now', '-345 days'), datetime('now', '-345 days')),
(1, 5, 'accepted', datetime('now', '-340 days'), datetime('now', '-340 days')),
(1, 6, 'accepted', datetime('now', '-335 days'), datetime('now', '-335 days')),
(1, 7, 'accepted', datetime('now', '-330 days'), datetime('now', '-330 days')),
(1, 9, 'accepted', datetime('now', '-325 days'), datetime('now', '-325 days')),
(1, 10, 'accepted', datetime('now', '-320 days'), datetime('now', '-320 days')),
(1, 13, 'accepted', datetime('now', '-315 days'), datetime('now', '-315 days')),
(1, 14, 'accepted', datetime('now', '-310 days'), datetime('now', '-310 days')),
(1, 16, 'accepted', datetime('now', '-305 days'), datetime('now', '-305 days')),
(1, 17, 'accepted', datetime('now', '-300 days'), datetime('now', '-300 days')),
(1, 20, 'accepted', datetime('now', '-295 days'), datetime('now', '-295 days')),
(1, 24, 'accepted', datetime('now', '-290 days'), datetime('now', '-290 days')),
(1, 25, 'accepted', datetime('now', '-285 days'), datetime('now', '-285 days')),
(1, 27, 'accepted', datetime('now', '-280 days'), datetime('now', '-280 days')),

-- Sarah (2) follows 12 people
(2, 1, 'accepted', datetime('now', '-345 days'), datetime('now', '-345 days')),
(2, 4, 'pending', datetime('now', '-340 days'), datetime('now', '-340 days')), -- Alice private
(2, 6, 'accepted', datetime('now', '-335 days'), datetime('now', '-335 days')),
(2, 7, 'accepted', datetime('now', '-330 days'), datetime('now', '-330 days')),
(2, 10, 'accepted', datetime('now', '-325 days'), datetime('now', '-325 days')),
(2, 14, 'accepted', datetime('now', '-320 days'), datetime('now', '-320 days')),
(2, 15, 'accepted', datetime('now', '-315 days'), datetime('now', '-315 days')),
(2, 17, 'accepted', datetime('now', '-310 days'), datetime('now', '-310 days')),
(2, 18, 'accepted', datetime('now', '-305 days'), datetime('now', '-305 days')),
(2, 21, 'accepted', datetime('now', '-300 days'), datetime('now', '-300 days')),
(2, 25, 'accepted', datetime('now', '-295 days'), datetime('now', '-295 days')),
(2, 27, 'accepted', datetime('now', '-290 days'), datetime('now', '-290 days')),

-- Mike (3) follows 10 people
(3, 1, 'accepted', datetime('now', '-340 days'), datetime('now', '-340 days')),
(3, 2, 'accepted', datetime('now', '-335 days'), datetime('now', '-335 days')),
(3, 5, 'accepted', datetime('now', '-330 days'), datetime('now', '-330 days')),
(3, 7, 'accepted', datetime('now', '-325 days'), datetime('now', '-325 days')),
(3, 9, 'accepted', datetime('now', '-320 days'), datetime('now', '-320 days')),
(3, 11, 'accepted', datetime('now', '-315 days'), datetime('now', '-315 days')),
(3, 15, 'accepted', datetime('now', '-310 days'), datetime('now', '-310 days')),
(3, 20, 'accepted', datetime('now', '-305 days'), datetime('now', '-305 days')),
(3, 22, 'accepted', datetime('now', '-300 days'), datetime('now', '-300 days')),
(3, 28, 'accepted', datetime('now', '-295 days'), datetime('now', '-295 days')),

-- Alice (4) accepts followers (private account)
(4, 2, 'accepted', datetime('now', '-335 days'), datetime('now', '-335 days')),
(4, 6, 'accepted', datetime('now', '-330 days'), datetime('now', '-330 days')),
(4, 8, 'accepted', datetime('now', '-325 days'), datetime('now', '-325 days')),
(4, 14, 'accepted', datetime('now', '-320 days'), datetime('now', '-320 days')),
(4, 19, 'accepted', datetime('now', '-315 days'), datetime('now', '-315 days')),
(4, 25, 'accepted', datetime('now', '-310 days'), datetime('now', '-310 days')),

-- David (5) follows 11 people
(5, 1, 'accepted', datetime('now', '-325 days'), datetime('now', '-325 days')),
(5, 3, 'accepted', datetime('now', '-320 days'), datetime('now', '-320 days')),
(5, 6, 'accepted', datetime('now', '-315 days'), datetime('now', '-315 days')),
(5, 7, 'accepted', datetime('now', '-310 days'), datetime('now', '-310 days')),
(5, 9, 'accepted', datetime('now', '-305 days'), datetime('now', '-305 days')),
(5, 13, 'accepted', datetime('now', '-300 days'), datetime('now', '-300 days')),
(5, 16, 'accepted', datetime('now', '-295 days'), datetime('now', '-295 days')),
(5, 17, 'accepted', datetime('now', '-290 days'), datetime('now', '-290 days')),
(5, 24, 'accepted', datetime('now', '-285 days'), datetime('now', '-285 days')),
(5, 26, 'accepted', datetime('now', '-280 days'), datetime('now', '-280 days')),
(5, 29, 'accepted', datetime('now', '-275 days'), datetime('now', '-275 days')),

-- Emma (6) follows 13 people
(6, 1, 'accepted', datetime('now', '-320 days'), datetime('now', '-320 days')),
(6, 2, 'accepted', datetime('now', '-315 days'), datetime('now', '-315 days')),
(6, 4, 'accepted', datetime('now', '-310 days'), datetime('now', '-310 days')),
(6, 5, 'accepted', datetime('now', '-305 days'), datetime('now', '-305 days')),
(6, 8, 'accepted', datetime('now', '-300 days'), datetime('now', '-300 days')),
(6, 10, 'accepted', datetime('now', '-295 days'), datetime('now', '-295 days')),
(6, 14, 'accepted', datetime('now', '-290 days'), datetime('now', '-290 days')),
(6, 17, 'accepted', datetime('now', '-285 days'), datetime('now', '-285 days')),
(6, 19, 'pending', datetime('now', '-280 days'), datetime('now', '-280 days')), -- Ava private
(6, 21, 'accepted', datetime('now', '-275 days'), datetime('now', '-275 days')),
(6, 23, 'pending', datetime('now', '-270 days'), datetime('now', '-270 days')), -- Madison private
(6, 25, 'accepted', datetime('now', '-265 days'), datetime('now', '-265 days')),
(6, 27, 'accepted', datetime('now', '-260 days'), datetime('now', '-260 days')),

-- James (7) follows 14 people
(7, 2, 'accepted', datetime('now', '-315 days'), datetime('now', '-315 days')),
(7, 3, 'accepted', datetime('now', '-310 days'), datetime('now', '-310 days')),
(7, 5, 'accepted', datetime('now', '-305 days'), datetime('now', '-305 days')),
(7, 6, 'accepted', datetime('now', '-300 days'), datetime('now', '-300 days')),
(7, 9, 'accepted', datetime('now', '-295 days'), datetime('now', '-295 days')),
(7, 10, 'accepted', datetime('now', '-290 days'), datetime('now', '-290 days')),
(7, 13, 'accepted', datetime('now', '-285 days'), datetime('now', '-285 days')),
(7, 15, 'accepted', datetime('now', '-280 days'), datetime('now', '-280 days')),
(7, 16, 'accepted', datetime('now', '-275 days'), datetime('now', '-275 days')),
(7, 20, 'accepted', datetime('now', '-270 days'), datetime('now', '-270 days')),
(7, 24, 'accepted', datetime('now', '-265 days'), datetime('now', '-265 days')),
(7, 25, 'accepted', datetime('now', '-260 days'), datetime('now', '-260 days')),
(7, 28, 'accepted', datetime('now', '-255 days'), datetime('now', '-255 days')),
(7, 30, 'accepted', datetime('now', '-250 days'), datetime('now', '-250 days')),

-- Lisa (8) accepts followers (private)
(8, 6, 'accepted', datetime('now', '-310 days'), datetime('now', '-310 days')),
(8, 4, 'accepted', datetime('now', '-305 days'), datetime('now', '-305 days')),
(8, 10, 'accepted', datetime('now', '-300 days'), datetime('now', '-300 days')),
(8, 13, 'accepted', datetime('now', '-295 days'), datetime('now', '-295 days')),
(8, 17, 'accepted', datetime('now', '-290 days'), datetime('now', '-290 days')),
(8, 21, 'accepted', datetime('now', '-285 days'), datetime('now', '-285 days')),
(8, 30, 'accepted', datetime('now', '-280 days'), datetime('now', '-280 days')),

-- Ryan (9) follows 8 people
(9, 3, 'accepted', datetime('now', '-305 days'), datetime('now', '-305 days')),
(9, 5, 'accepted', datetime('now', '-300 days'), datetime('now', '-300 days')),
(9, 7, 'accepted', datetime('now', '-295 days'), datetime('now', '-295 days')),
(9, 10, 'accepted', datetime('now', '-290 days'), datetime('now', '-290 days')),
(9, 15, 'accepted', datetime('now', '-285 days'), datetime('now', '-285 days')),
(9, 20, 'accepted', datetime('now', '-280 days'), datetime('now', '-280 days')),
(9, 25, 'accepted', datetime('now', '-275 days'), datetime('now', '-275 days')),
(9, 28, 'accepted', datetime('now', '-270 days'), datetime('now', '-270 days')),

-- Sophia (10) follows 12 people
(10, 2, 'accepted', datetime('now', '-300 days'), datetime('now', '-300 days')),
(10, 6, 'accepted', datetime('now', '-295 days'), datetime('now', '-295 days')),
(10, 7, 'accepted', datetime('now', '-290 days'), datetime('now', '-290 days')),
(10, 9, 'accepted', datetime('now', '-285 days'), datetime('now', '-285 days')),
(10, 8, 'pending', datetime('now', '-280 days'), datetime('now', '-280 days')), -- Lisa private
(10, 14, 'accepted', datetime('now', '-275 days'), datetime('now', '-275 days')),
(10, 17, 'accepted', datetime('now', '-270 days'), datetime('now', '-270 days')),
(10, 18, 'accepted', datetime('now', '-265 days'), datetime('now', '-265 days')),
(10, 21, 'accepted', datetime('now', '-260 days'), datetime('now', '-260 days')),
(10, 23, 'pending', datetime('now', '-255 days'), datetime('now', '-255 days')), -- Madison private
(10, 25, 'accepted', datetime('now', '-250 days'), datetime('now', '-250 days')),
(10, 27, 'accepted', datetime('now', '-245 days'), datetime('now', '-245 days')),

-- Oliver (11) follows 6 people
(11, 3, 'accepted', datetime('now', '-295 days'), datetime('now', '-295 days')),
(11, 5, 'accepted', datetime('now', '-290 days'), datetime('now', '-290 days')),
(11, 7, 'accepted', datetime('now', '-285 days'), datetime('now', '-285 days')),
(11, 16, 'accepted', datetime('now', '-280 days'), datetime('now', '-280 days')),
(11, 22, 'accepted', datetime('now', '-275 days'), datetime('now', '-275 days')),
(11, 28, 'accepted', datetime('now', '-270 days'), datetime('now', '-270 days')),

-- Mia (12) accepts followers (private)
(12, 6, 'accepted', datetime('now', '-290 days'), datetime('now', '-290 days')),
(12, 10, 'accepted', datetime('now', '-285 days'), datetime('now', '-285 days')),
(12, 17, 'accepted', datetime('now', '-280 days'), datetime('now', '-280 days')),
(12, 21, 'accepted', datetime('now', '-275 days'), datetime('now', '-275 days')),

-- Ethan (13) follows 9 people
(13, 1, 'accepted', datetime('now', '-285 days'), datetime('now', '-285 days')),
(13, 5, 'accepted', datetime('now', '-280 days'), datetime('now', '-280 days')),
(13, 7, 'accepted', datetime('now', '-275 days'), datetime('now', '-275 days')),
(13, 8, 'accepted', datetime('now', '-270 days'), datetime('now', '-270 days')),
(13, 16, 'accepted', datetime('now', '-265 days'), datetime('now', '-265 days')),
(13, 17, 'accepted', datetime('now', '-260 days'), datetime('now', '-260 days')),
(13, 24, 'accepted', datetime('now', '-255 days'), datetime('now', '-255 days')),
(13, 26, 'accepted', datetime('now', '-250 days'), datetime('now', '-250 days')),
(13, 30, 'accepted', datetime('now', '-245 days'), datetime('now', '-245 days')),

-- Chloe (14) follows 10 people
(14, 2, 'accepted', datetime('now', '-280 days'), datetime('now', '-280 days')),
(14, 4, 'accepted', datetime('now', '-275 days'), datetime('now', '-275 days')),
(14, 6, 'accepted', datetime('now', '-270 days'), datetime('now', '-270 days')),
(14, 10, 'accepted', datetime('now', '-265 days'), datetime('now', '-265 days')),
(14, 15, 'accepted', datetime('now', '-260 days'), datetime('now', '-260 days')),
(14, 18, 'accepted', datetime('now', '-255 days'), datetime('now', '-255 days')),
(14, 20, 'accepted', datetime('now', '-250 days'), datetime('now', '-250 days')),
(14, 25, 'accepted', datetime('now', '-245 days'), datetime('now', '-245 days')),
(14, 27, 'accepted', datetime('now', '-240 days'), datetime('now', '-240 days')),
(14, 29, 'accepted', datetime('now', '-235 days'), datetime('now', '-235 days')),

-- Noah (15) follows 11 people
(15, 2, 'accepted', datetime('now', '-275 days'), datetime('now', '-275 days')),
(15, 3, 'accepted', datetime('now', '-270 days'), datetime('now', '-270 days')),
(15, 7, 'accepted', datetime('now', '-265 days'), datetime('now', '-265 days')),
(15, 9, 'accepted', datetime('now', '-260 days'), datetime('now', '-260 days')),
(15, 10, 'accepted', datetime('now', '-255 days'), datetime('now', '-255 days')),
(15, 13, 'accepted', datetime('now', '-250 days'), datetime('now', '-250 days')),
(15, 20, 'accepted', datetime('now', '-245 days'), datetime('now', '-245 days')),
(15, 24, 'accepted', datetime('now', '-240 days'), datetime('now', '-240 days')),
(15, 25, 'accepted', datetime('now', '-235 days'), datetime('now', '-235 days')),
(15, 28, 'accepted', datetime('now', '-230 days'), datetime('now', '-230 days')),
(15, 30, 'accepted', datetime('now', '-225 days'), datetime('now', '-225 days')),

-- Alex (16) follows 7 people
(16, 1, 'accepted', datetime('now', '-270 days'), datetime('now', '-270 days')),
(16, 5, 'accepted', datetime('now', '-265 days'), datetime('now', '-265 days')),
(16, 7, 'accepted', datetime('now', '-260 days'), datetime('now', '-260 days')),
(16, 13, 'accepted', datetime('now', '-255 days'), datetime('now', '-255 days')),
(16, 24, 'accepted', datetime('now', '-250 days'), datetime('now', '-250 days')),
(16, 26, 'accepted', datetime('now', '-245 days'), datetime('now', '-245 days')),
(16, 29, 'accepted', datetime('now', '-240 days'), datetime('now', '-240 days')),

-- Isabella (17) follows 8 people
(17, 1, 'accepted', datetime('now', '-265 days'), datetime('now', '-265 days')),
(17, 2, 'accepted', datetime('now', '-260 days'), datetime('now', '-260 days')),
(17, 5, 'accepted', datetime('now', '-255 days'), datetime('now', '-255 days')),
(17, 6, 'accepted', datetime('now', '-250 days'), datetime('now', '-250 days')),
(17, 8, 'accepted', datetime('now', '-245 days'), datetime('now', '-245 days')),
(17, 13, 'accepted', datetime('now', '-240 days'), datetime('now', '-240 days')),
(17, 25, 'accepted', datetime('now', '-235 days'), datetime('now', '-235 days')),
(17, 27, 'accepted', datetime('now', '-230 days'), datetime('now', '-230 days')),

-- Jacob (18) follows 5 people
(18, 2, 'accepted', datetime('now', '-260 days'), datetime('now', '-260 days')),
(18, 10, 'accepted', datetime('now', '-255 days'), datetime('now', '-255 days')),
(18, 14, 'accepted', datetime('now', '-250 days'), datetime('now', '-250 days')),
(18, 20, 'accepted', datetime('now', '-245 days'), datetime('now', '-245 days')),
(18, 25, 'accepted', datetime('now', '-240 days'), datetime('now', '-240 days')),

-- Ava (19) accepts followers (private)
(19, 6, 'accepted', datetime('now', '-255 days'), datetime('now', '-255 days')),
(19, 14, 'accepted', datetime('now', '-250 days'), datetime('now', '-250 days')),
(19, 17, 'accepted', datetime('now', '-245 days'), datetime('now', '-245 days')),
(19, 21, 'accepted', datetime('now', '-240 days'), datetime('now', '-240 days')),
(19, 27, 'accepted', datetime('now', '-235 days'), datetime('now', '-235 days')),

-- Logan (20) follows 6 people
(20, 2, 'accepted', datetime('now', '-250 days'), datetime('now', '-250 days')),
(20, 7, 'accepted', datetime('now', '-245 days'), datetime('now', '-245 days')),
(20, 10, 'accepted', datetime('now', '-240 days'), datetime('now', '-240 days')),
(20, 15, 'accepted', datetime('now', '-235 days'), datetime('now', '-235 days')),
(20, 25, 'accepted', datetime('now', '-230 days'), datetime('now', '-230 days')),
(20, 28, 'accepted', datetime('now', '-225 days'), datetime('now', '-225 days')),

-- Samantha (21) follows 9 people
(21, 2, 'accepted', datetime('now', '-245 days'), datetime('now', '-245 days')),
(21, 6, 'accepted', datetime('now', '-240 days'), datetime('now', '-240 days')),
(21, 8, 'accepted', datetime('now', '-235 days'), datetime('now', '-235 days')),
(21, 10, 'accepted', datetime('now', '-230 days'), datetime('now', '-230 days')),
(21, 12, 'accepted', datetime('now', '-225 days'), datetime('now', '-225 days')),
(21, 17, 'accepted', datetime('now', '-220 days'), datetime('now', '-220 days')),
(21, 19, 'accepted', datetime('now', '-215 days'), datetime('now', '-215 days')),
(21, 23, 'accepted', datetime('now', '-210 days'), datetime('now', '-210 days')),
(21, 27, 'accepted', datetime('now', '-205 days'), datetime('now', '-205 days')),

-- Benjamin (22) follows 4 people
(22, 3, 'accepted', datetime('now', '-240 days'), datetime('now', '-240 days')),
(22, 5, 'accepted', datetime('now', '-235 days'), datetime('now', '-235 days')),
(22, 11, 'accepted', datetime('now', '-230 days'), datetime('now', '-230 days')),
(22, 16, 'accepted', datetime('now', '-225 days'), datetime('now', '-225 days')),

-- Madison (23) accepts followers (private)
(23, 6, 'accepted', datetime('now', '-235 days'), datetime('now', '-235 days')),
(23, 10, 'accepted', datetime('now', '-230 days'), datetime('now', '-230 days')),
(23, 21, 'accepted', datetime('now', '-225 days'), datetime('now', '-225 days')),
(23, 27, 'accepted', datetime('now', '-220 days'), datetime('now', '-220 days')),

-- William (24) follows 8 people
(24, 1, 'accepted', datetime('now', '-230 days'), datetime('now', '-230 days')),
(24, 5, 'accepted', datetime('now', '-225 days'), datetime('now', '-225 days')),
(24, 7, 'accepted', datetime('now', '-220 days'), datetime('now', '-220 days')),
(24, 13, 'accepted', datetime('now', '-215 days'), datetime('now', '-215 days')),
(24, 16, 'accepted', datetime('now', '-210 days'), datetime('now', '-210 days')),
(24, 26, 'accepted', datetime('now', '-205 days'), datetime('now', '-205 days')),
(24, 29, 'accepted', datetime('now', '-200 days'), datetime('now', '-200 days')),
(24, 30, 'accepted', datetime('now', '-195 days'), datetime('now', '-195 days')),

-- Olivia (25) follows 10 people
(25, 1, 'accepted', datetime('now', '-225 days'), datetime('now', '-225 days')),
(25, 2, 'accepted', datetime('now', '-220 days'), datetime('now', '-220 days')),
(25, 4, 'accepted', datetime('now', '-215 days'), datetime('now', '-215 days')),
(25, 6, 'accepted', datetime('now', '-210 days'), datetime('now', '-210 days')),
(25, 14, 'accepted', datetime('now', '-205 days'), datetime('now', '-205 days')),
(25, 15, 'accepted', datetime('now', '-200 days'), datetime('now', '-200 days')),
(25, 17, 'accepted', datetime('now', '-195 days'), datetime('now', '-195 days')),
(25, 18, 'accepted', datetime('now', '-190 days'), datetime('now', '-190 days')),
(25, 20, 'accepted', datetime('now', '-185 days'), datetime('now', '-185 days')),
(25, 27, 'accepted', datetime('now', '-180 days'), datetime('now', '-180 days')),

-- Henry (26) follows 5 people
(26, 5, 'accepted', datetime('now', '-220 days'), datetime('now', '-220 days')),
(26, 13, 'accepted', datetime('now', '-215 days'), datetime('now', '-215 days')),
(26, 16, 'accepted', datetime('now', '-210 days'), datetime('now', '-210 days')),
(26, 22, 'accepted', datetime('now', '-205 days'), datetime('now', '-205 days')),
(26, 24, 'accepted', datetime('now', '-200 days'), datetime('now', '-200 days')),

-- Victoria (27) follows 7 people
(27, 1, 'accepted', datetime('now', '-215 days'), datetime('now', '-215 days')),
(27, 2, 'accepted', datetime('now', '-210 days'), datetime('now', '-210 days')),
(27, 6, 'accepted', datetime('now', '-205 days'), datetime('now', '-205 days')),
(27, 10, 'accepted', datetime('now', '-200 days'), datetime('now', '-200 days')),
(27, 17, 'accepted', datetime('now', '-195 days'), datetime('now', '-195 days')),
(27, 21, 'accepted', datetime('now', '-190 days'), datetime('now', '-190 days')),
(27, 25, 'accepted', datetime('now', '-185 days'), datetime('now', '-185 days')),

-- Daniel (28) follows 6 people
(28, 3, 'accepted', datetime('now', '-210 days'), datetime('now', '-210 days')),
(28, 7, 'accepted', datetime('now', '-205 days'), datetime('now', '-205 days')),
(28, 9, 'accepted', datetime('now', '-200 days'), datetime('now', '-200 days')),
(28, 11, 'accepted', datetime('now', '-195 days'), datetime('now', '-195 days')),
(28, 15, 'accepted', datetime('now', '-190 days'), datetime('now', '-190 days')),
(28, 20, 'accepted', datetime('now', '-185 days'), datetime('now', '-185 days')),

-- Alex (29) follows 5 people
(29, 1, 'accepted', datetime('now', '-205 days'), datetime('now', '-205 days')),
(29, 5, 'accepted', datetime('now', '-200 days'), datetime('now', '-200 days')),
(29, 13, 'accepted', datetime('now', '-195 days'), datetime('now', '-195 days')),
(29, 16, 'accepted', datetime('now', '-190 days'), datetime('now', '-190 days')),
(29, 24, 'accepted', datetime('now', '-185 days'), datetime('now', '-185 days')),

-- Liam (30) follows 4 people
(30, 7, 'accepted', datetime('now', '-200 days'), datetime('now', '-200 days')),
(30, 8, 'accepted', datetime('now', '-195 days'), datetime('now', '-195 days')),
(30, 13, 'accepted', datetime('now', '-190 days'), datetime('now', '-190 days')),
(30, 17, 'accepted', datetime('now', '-185 days'), datetime('now', '-185 days'));