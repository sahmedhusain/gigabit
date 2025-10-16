-- Mock Invitations Data
-- Group membership invitations with different statuses

INSERT INTO invitations (inviter_id, invitee_id, group_id, status, created_at) VALUES
-- Tech Enthusiasts (group 1, admin: John/1) - inviting tech-interested users
(1, 13, 1, 'pending', datetime('now', '-280 days')),
(1, 16, 1, 'accepted', datetime('now', '-275 days')),
(1, 24, 1, 'pending', datetime('now', '-270 days')),
(1, 26, 1, 'declined', datetime('now', '-265 days')),
(1, 29, 1, 'accepted', datetime('now', '-260 days')),

-- Design & Creativity (group 2, admin: Sarah/2) - inviting creative users
(2, 18, 2, 'pending', datetime('now', '-270 days')),
(2, 20, 2, 'accepted', datetime('now', '-265 days')),
(2, 22, 2, 'pending', datetime('now', '-260 days')),
(2, 25, 2, 'accepted', datetime('now', '-255 days')),
(2, 27, 2, 'declined', datetime('now', '-250 days')),

-- Fitness & Wellness (group 3, admin: Mike/3) - inviting health-conscious users
(3, 6, 3, 'accepted', datetime('now', '-260 days')),
(3, 12, 3, 'pending', datetime('now', '-255 days')),
(3, 14, 3, 'accepted', datetime('now', '-250 days')),
(3, 21, 3, 'pending', datetime('now', '-245 days')),
(3, 23, 3, 'accepted', datetime('now', '-240 days')),

-- Book Club (group 4, admin: Alice/4) - inviting literature lovers
(4, 8, 4, 'pending', datetime('now', '-250 days')),
(4, 11, 4, 'accepted', datetime('now', '-245 days')),
(4, 15, 4, 'pending', datetime('now', '-240 days')),
(4, 18, 4, 'accepted', datetime('now', '-235 days')),
(4, 20, 4, 'declined', datetime('now', '-230 days')),

-- Gaming Community (group 5, admin: David/5) - inviting gamers
(5, 6, 5, 'accepted', datetime('now', '-240 days')),
(5, 12, 5, 'pending', datetime('now', '-235 days')),
(5, 14, 5, 'accepted', datetime('now', '-230 days')),
(5, 18, 5, 'pending', datetime('now', '-225 days')),
(5, 21, 5, 'accepted', datetime('now', '-220 days')),

-- Photography Lovers (group 6, admin: Emma/6) - inviting photographers
(6, 1, 6, 'accepted', datetime('now', '-230 days')),
(6, 3, 6, 'pending', datetime('now', '-225 days')),
(6, 7, 6, 'accepted', datetime('now', '-220 days')),
(6, 11, 6, 'pending', datetime('now', '-215 days')),
(6, 13, 6, 'accepted', datetime('now', '-210 days')),

-- Entrepreneurship Hub (group 7, admin: James/7) - inviting business-minded users
(7, 8, 7, 'pending', datetime('now', '-220 days')),
(7, 9, 7, 'accepted', datetime('now', '-215 days')),
(7, 11, 7, 'pending', datetime('now', '-210 days')),
(7, 15, 7, 'accepted', datetime('now', '-205 days')),
(7, 16, 7, 'declined', datetime('now', '-200 days')),

-- Music & Arts (group 8, admin: Lisa/8) - inviting artistic users
(8, 1, 8, 'accepted', datetime('now', '-210 days')),
(8, 3, 8, 'pending', datetime('now', '-205 days')),
(8, 5, 8, 'accepted', datetime('now', '-200 days')),
(8, 9, 8, 'pending', datetime('now', '-195 days')),
(8, 11, 8, 'accepted', datetime('now', '-190 days')),

-- Travel Explorers (group 9, admin: Ryan/9) - inviting travelers
(9, 4, 9, 'pending', datetime('now', '-200 days')),
(9, 7, 9, 'accepted', datetime('now', '-195 days')),
(9, 11, 9, 'pending', datetime('now', '-190 days')),
(9, 13, 9, 'accepted', datetime('now', '-185 days')),
(9, 16, 9, 'declined', datetime('now', '-180 days')),

-- Cooking & Recipes (group 10, admin: Sophia/10) - inviting food enthusiasts
(10, 2, 10, 'accepted', datetime('now', '-190 days')),
(10, 4, 10, 'pending', datetime('now', '-185 days')),
(10, 6, 10, 'accepted', datetime('now', '-180 days')),
(10, 8, 10, 'pending', datetime('now', '-175 days')),
(10, 12, 10, 'accepted', datetime('now', '-170 days')),

-- Recent invitations for newer users
(1, 31, 1, 'accepted', datetime('now', '-50 days')), -- Nathan to Tech Enthusiasts
(2, 32, 2, 'pending', datetime('now', '-45 days')), -- Zoe to Design & Creativity
(3, 33, 3, 'accepted', datetime('now', '-40 days')), -- Carter to Fitness & Wellness
(5, 35, 5, 'pending', datetime('now', '-35 days')), -- Aria to Gaming Community
(6, 36, 6, 'accepted', datetime('now', '-30 days')), -- Jackson to Photography Lovers
(7, 37, 7, 'pending', datetime('now', '-25 days')), -- Scarlett to Entrepreneurship Hub
(8, 38, 8, 'accepted', datetime('now', '-20 days')), -- Mason to Music & Arts
(9, 39, 9, 'pending', datetime('now', '-15 days')), -- Levi to Travel Explorers
(10, 40, 10, 'accepted', datetime('now', '-10 days')); -- Aiden to Cooking & Recipes