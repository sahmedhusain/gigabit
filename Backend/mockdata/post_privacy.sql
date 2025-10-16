-- Mock Post Privacy Data
-- Controls which users can view private (friends_only) posts

INSERT INTO post_privacy (post_id, user_id, created_at) VALUES
-- Alice's friends_only posts (user 4) - posts 50 and 53
-- Alice's accepted followers: 2, 6, 8, 14, 19, 25
(50, 2, datetime('now', '-305 days')),
(50, 6, datetime('now', '-305 days')),
(50, 8, datetime('now', '-305 days')),
(50, 14, datetime('now', '-305 days')),
(50, 25, datetime('now', '-305 days')),
(53, 2, datetime('now', '-275 days')),
(53, 6, datetime('now', '-275 days')),
(53, 14, datetime('now', '-275 days')),
(53, 19, datetime('now', '-275 days')),
(53, 25, datetime('now', '-275 days')),

-- Lisa's friends_only posts (user 8) - posts 91 and 93
-- Lisa's accepted followers: 6, 4, 10, 13, 17, 21, 30
(91, 6, datetime('now', '-290 days')),
(91, 4, datetime('now', '-290 days')),
(91, 10, datetime('now', '-290 days')),
(91, 13, datetime('now', '-290 days')),
(91, 17, datetime('now', '-290 days')),
(93, 6, datetime('now', '-270 days')),
(93, 4, datetime('now', '-270 days')),
(93, 10, datetime('now', '-270 days')),
(93, 21, datetime('now', '-270 days')),
(93, 30, datetime('now', '-270 days')),

-- Mia's friends_only post (user 12) - post 123
-- Mia's accepted followers: 6, 10, 17, 21
(123, 6, datetime('now', '-290 days')),
(123, 10, datetime('now', '-290 days')),
(123, 17, datetime('now', '-290 days')),
(123, 21, datetime('now', '-290 days')),

-- Ava's friends_only posts (user 19) - posts 174 and 177
-- Ava's accepted followers: 6, 14, 17, 21, 27
(174, 6, datetime('now', '-255 days')),
(174, 14, datetime('now', '-255 days')),
(174, 17, datetime('now', '-255 days')),
(174, 21, datetime('now', '-255 days')),
(174, 27, datetime('now', '-255 days')),
(177, 6, datetime('now', '-225 days')),
(177, 14, datetime('now', '-225 days')),
(177, 17, datetime('now', '-225 days')),
(177, 21, datetime('now', '-225 days')),
(177, 27, datetime('now', '-225 days')),

-- Madison's friends_only post (user 23) - post 200
-- Madison's accepted followers: 6, 10, 21, 27
(200, 6, datetime('now', '-235 days')),
(200, 10, datetime('now', '-235 days')),
(200, 21, datetime('now', '-235 days')),
(200, 27, datetime('now', '-235 days'));