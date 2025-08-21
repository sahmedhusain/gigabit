-- Mock Follows Data
-- Creating a realistic follow network between users

INSERT INTO follows (follower_id, following_id, status, created_at, updated_at) VALUES
-- John follows Sarah, Mike, David, Emma
(1, 2, 'accepted', datetime('now', '-25 days'), datetime('now', '-25 days')),
(1, 3, 'accepted', datetime('now', '-20 days'), datetime('now', '-20 days')),
(1, 5, 'accepted', datetime('now', '-15 days'), datetime('now', '-15 days')),
(1, 6, 'accepted', datetime('now', '-10 days'), datetime('now', '-10 days')),

-- Sarah follows John, Alice, Emma, James, Sophia
(2, 1, 'accepted', datetime('now', '-24 days'), datetime('now', '-24 days')),
(2, 4, 'pending', datetime('now', '-18 days'), datetime('now', '-18 days')), -- Alice has private profile
(2, 6, 'accepted', datetime('now', '-12 days'), datetime('now', '-12 days')),
(2, 7, 'accepted', datetime('now', '-8 days'), datetime('now', '-8 days')),
(2, 10, 'accepted', datetime('now', '-3 days'), datetime('now', '-3 days')),

-- Mike follows John, Sarah, David, Ryan, James
(3, 1, 'accepted', datetime('now', '-19 days'), datetime('now', '-19 days')),
(3, 2, 'accepted', datetime('now', '-18 days'), datetime('now', '-18 days')),
(3, 5, 'accepted', datetime('now', '-14 days'), datetime('now', '-14 days')),
(3, 9, 'accepted', datetime('now', '-6 days'), datetime('now', '-6 days')),
(3, 7, 'accepted', datetime('now', '-5 days'), datetime('now', '-5 days')),

-- Alice (private) accepts some followers
(4, 2, 'accepted', datetime('now', '-16 days'), datetime('now', '-16 days')), -- Accepts Sarah
(4, 6, 'accepted', datetime('now', '-10 days'), datetime('now', '-10 days')), -- Accepts Emma
(4, 8, 'accepted', datetime('now', '-7 days'), datetime('now', '-7 days')), -- Accepts Lisa

-- David follows John, Mike, Emma, James, Ryan
(5, 1, 'accepted', datetime('now', '-14 days'), datetime('now', '-14 days')),
(5, 3, 'accepted', datetime('now', '-13 days'), datetime('now', '-13 days')),
(5, 6, 'accepted', datetime('now', '-11 days'), datetime('now', '-11 days')),
(5, 7, 'accepted', datetime('now', '-9 days'), datetime('now', '-9 days')),
(5, 9, 'accepted', datetime('now', '-4 days'), datetime('now', '-4 days')),

-- Emma follows John, Sarah, Alice, David, Lisa, Sophia
(6, 1, 'accepted', datetime('now', '-11 days'), datetime('now', '-11 days')),
(6, 2, 'accepted', datetime('now', '-10 days'), datetime('now', '-10 days')),
(6, 4, 'accepted', datetime('now', '-9 days'), datetime('now', '-9 days')),
(6, 5, 'accepted', datetime('now', '-8 days'), datetime('now', '-8 days')),
(6, 8, 'accepted', datetime('now', '-6 days'), datetime('now', '-6 days')),
(6, 10, 'accepted', datetime('now', '-2 days'), datetime('now', '-2 days')),

-- James follows Sarah, Mike, David, Emma, Ryan, Sophia
(7, 2, 'accepted', datetime('now', '-7 days'), datetime('now', '-7 days')),
(7, 3, 'accepted', datetime('now', '-6 days'), datetime('now', '-6 days')),
(7, 5, 'accepted', datetime('now', '-5 days'), datetime('now', '-5 days')),
(7, 6, 'accepted', datetime('now', '-4 days'), datetime('now', '-4 days')),
(7, 9, 'accepted', datetime('now', '-3 days'), datetime('now', '-3 days')),
(7, 10, 'accepted', datetime('now', '-1 day'), datetime('now', '-1 day')),

-- Lisa (private) accepts some followers
(8, 6, 'accepted', datetime('now', '-5 days'), datetime('now', '-5 days')), -- Accepts Emma
(8, 4, 'accepted', datetime('now', '-4 days'), datetime('now', '-4 days')), -- Accepts Alice
(8, 10, 'accepted', datetime('now', '-2 days'), datetime('now', '-2 days')), -- Accepts Sophia

-- Ryan follows Mike, David, James, Sophia
(9, 3, 'accepted', datetime('now', '-4 days'), datetime('now', '-4 days')),
(9, 5, 'accepted', datetime('now', '-3 days'), datetime('now', '-3 days')),
(9, 7, 'accepted', datetime('now', '-2 days'), datetime('now', '-2 days')),
(9, 10, 'accepted', datetime('now', '-1 day'), datetime('now', '-1 day')),

-- Sophia follows Sarah, Emma, James, Ryan, Lisa
(10, 2, 'accepted', datetime('now', '-2 days'), datetime('now', '-2 days')),
(10, 6, 'accepted', datetime('now', '-2 days'), datetime('now', '-2 days')),
(10, 7, 'accepted', datetime('now', '-1 day'), datetime('now', '-1 day')),
(10, 9, 'accepted', datetime('now', '-1 day'), datetime('now', '-1 day')),
(10, 8, 'pending', datetime('now', '-12 hours'), datetime('now', '-12 hours')); -- Lisa has private profile