-- Mock data for group_members table
INSERT INTO group_members (group_id, user_id, role, status, created_at, updated_at) VALUES
-- Tech Enthusiasts (group_id: 1)
(1, 1, 'admin', 'accepted', datetime('now'), datetime('now')),
(1, 2, 'member', 'accepted', datetime('now'), datetime('now')),
(1, 3, 'member', 'accepted', datetime('now'), datetime('now')),
(1, 4, 'member', 'accepted', datetime('now'), datetime('now')),
(1, 5, 'member', 'accepted', datetime('now'), datetime('now')),

-- Design & Creativity (group_id: 2)
(2, 2, 'admin', 'accepted', datetime('now'), datetime('now')),
(2, 1, 'member', 'accepted', datetime('now'), datetime('now')),
(2, 6, 'member', 'accepted', datetime('now'), datetime('now')),
(2, 7, 'member', 'accepted', datetime('now'), datetime('now')),

-- Fitness & Wellness (group_id: 3)
(3, 3, 'admin', 'accepted', datetime('now'), datetime('now')),
(3, 1, 'member', 'accepted', datetime('now'), datetime('now')),
(3, 8, 'member', 'accepted', datetime('now'), datetime('now')),

-- Book Club (group_id: 4)
(4, 4, 'admin', 'accepted', datetime('now'), datetime('now')),
(4, 1, 'member', 'accepted', datetime('now'), datetime('now')),
(4, 2, 'member', 'accepted', datetime('now'), datetime('now')),
(4, 5, 'member', 'accepted', datetime('now'), datetime('now')),
(4, 6, 'member', 'accepted', datetime('now'), datetime('now')),
(4, 7, 'member', 'accepted', datetime('now'), datetime('now')),

-- Gaming Community (group_id: 5)
(5, 5, 'admin', 'accepted', datetime('now'), datetime('now')),
(5, 1, 'member', 'accepted', datetime('now'), datetime('now')),
(5, 3, 'member', 'accepted', datetime('now'), datetime('now')),
(5, 8, 'member', 'accepted', datetime('now'), datetime('now')),

-- Photography Lovers (group_id: 6)
(6, 6, 'admin', 'accepted', datetime('now'), datetime('now')),
(6, 2, 'member', 'accepted', datetime('now'), datetime('now')),
(6, 4, 'member', 'accepted', datetime('now'), datetime('now')),

-- Entrepreneurship Hub (group_id: 7)
(7, 7, 'admin', 'accepted', datetime('now'), datetime('now')),
(7, 1, 'member', 'accepted', datetime('now'), datetime('now')),
(7, 2, 'member', 'accepted', datetime('now'), datetime('now')),
(7, 3, 'member', 'accepted', datetime('now'), datetime('now')),
(7, 4, 'member', 'accepted', datetime('now'), datetime('now')),
(7, 5, 'member', 'accepted', datetime('now'), datetime('now')),

-- Music & Arts (group_id: 8)
(8, 8, 'admin', 'accepted', datetime('now'), datetime('now')),
(8, 2, 'member', 'accepted', datetime('now'), datetime('now')),
(8, 6, 'member', 'accepted', datetime('now'), datetime('now')),
(8, 7, 'member', 'accepted', datetime('now'), datetime('now'));
