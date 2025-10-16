-- Mock Bookmarks Data
-- Users bookmark posts they're interested in for later reading

INSERT INTO bookmarks (user_id, post_id, created_at, updated_at) VALUES
-- John bookmarks tech and fitness posts
(1, 25, datetime('now', '-30 days'), datetime('now', '-30 days')),
(1, 45, datetime('now', '-25 days'), datetime('now', '-25 days')),
(1, 67, datetime('now', '-20 days'), datetime('now', '-20 days')),
(1, 89, datetime('now', '-15 days'), datetime('now', '-15 days')),
(1, 112, datetime('now', '-10 days'), datetime('now', '-10 days')),

-- Sarah bookmarks design and travel posts
(2, 28, datetime('now', '-28 days'), datetime('now', '-28 days')),
(2, 52, datetime('now', '-22 days'), datetime('now', '-22 days')),
(2, 76, datetime('now', '-18 days'), datetime('now', '-18 days')),
(2, 98, datetime('now', '-12 days'), datetime('now', '-12 days')),
(2, 124, datetime('now', '-8 days'), datetime('now', '-8 days')),

-- Mike bookmarks fitness and health posts
(3, 31, datetime('now', '-26 days'), datetime('now', '-26 days')),
(3, 55, datetime('now', '-19 days'), datetime('now', '-19 days')),
(3, 79, datetime('now', '-14 days'), datetime('now', '-14 days')),
(3, 101, datetime('now', '-9 days'), datetime('now', '-9 days')),
(3, 127, datetime('now', '-5 days'), datetime('now', '-5 days')),

-- Alice bookmarks art and creative posts
(4, 34, datetime('now', '-24 days'), datetime('now', '-24 days')),
(4, 58, datetime('now', '-16 days'), datetime('now', '-16 days')),
(4, 82, datetime('now', '-11 days'), datetime('now', '-11 days')),
(4, 106, datetime('now', '-6 days'), datetime('now', '-6 days')),

-- David bookmarks business and tech posts
(5, 37, datetime('now', '-22 days'), datetime('now', '-22 days')),
(5, 61, datetime('now', '-13 days'), datetime('now', '-13 days')),
(5, 85, datetime('now', '-8 days'), datetime('now', '-8 days')),
(5, 109, datetime('now', '-3 days'), datetime('now', '-3 days')),

-- Emma bookmarks UX and design posts
(6, 40, datetime('now', '-20 days'), datetime('now', '-20 days')),
(6, 64, datetime('now', '-10 days'), datetime('now', '-10 days')),
(6, 88, datetime('now', '-5 days'), datetime('now', '-5 days')),
(6, 115, datetime('now', '-1 day'), datetime('now', '-1 day')),

-- James bookmarks development posts
(7, 43, datetime('now', '-18 days'), datetime('now', '-18 days')),
(7, 67, datetime('now', '-7 days'), datetime('now', '-7 days')),
(7, 91, datetime('now', '-2 days'), datetime('now', '-2 days')),

-- Lisa bookmarks AI and data science posts
(8, 46, datetime('now', '-16 days'), datetime('now', '-16 days')),
(8, 70, datetime('now', '-4 days'), datetime('now', '-4 days')),

-- Ryan bookmarks photography posts
(9, 49, datetime('now', '-14 days'), datetime('now', '-14 days')),
(9, 73, datetime('now', '-3 days'), datetime('now', '-3 days')),

-- Sophia bookmarks marketing posts
(10, 50, datetime('now', '-12 days'), datetime('now', '-12 days')),
(10, 74, datetime('now', '-2 days'), datetime('now', '-2 days')),

-- Oliver bookmarks finance posts
(11, 53, datetime('now', '-10 days'), datetime('now', '-10 days')),
(11, 77, datetime('now', '-1 day'), datetime('now', '-1 day')),

-- Mia bookmarks pet-related posts
(12, 56, datetime('now', '-8 days'), datetime('now', '-8 days')),

-- Ethan bookmarks science posts
(13, 59, datetime('now', '-6 days'), datetime('now', '-6 days')),

-- Chloe bookmarks fashion posts
(14, 62, datetime('now', '-4 days'), datetime('now', '-4 days')),

-- Noah bookmarks gaming posts
(15, 65, datetime('now', '-2 days'), datetime('now', '-2 days')),

-- New users bookmark recent posts
(31, 151, datetime('now', '-5 days'), datetime('now', '-5 days')),
(32, 152, datetime('now', '-4 days'), datetime('now', '-4 days')),
(33, 153, datetime('now', '-3 days'), datetime('now', '-3 days')),
(34, 154, datetime('now', '-2 days'), datetime('now', '-2 days')),
(35, 155, datetime('now', '-1 day'), datetime('now', '-1 day'));