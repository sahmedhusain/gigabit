-- Mock Invitations Data
-- Group membership invitations with different statuses

INSERT INTO invitations (inviter_id, invitee_id, group_id, status, created_at) VALUES
-- Tech Enthusiasts (group 1, admin: John/1) - inviting tech-interested users
(1, 13, 1, 'pending', '2025-01-06 10:00:00'),
(1, 16, 1, 'accepted', '2025-01-11 10:00:00'),
(1, 24, 1, 'pending', '2025-01-16 10:00:00'),
(1, 26, 1, 'declined', '2025-01-21 10:00:00'),
(1, 29, 1, 'accepted', '2025-01-26 10:00:00'),

-- Design & Creativity (group 2, admin: Sarah/2) - inviting creative users
(2, 18, 2, 'pending', '2025-01-16 10:00:00'),
(2, 20, 2, 'accepted', '2025-01-21 10:00:00'),
(2, 22, 2, 'pending', '2025-01-26 10:00:00'),
(2, 25, 2, 'accepted', '2025-01-31 10:00:00'),
(2, 27, 2, 'declined', '2025-02-05 10:00:00'),

-- Fitness & Wellness (group 3, admin: Mike/3) - inviting health-conscious users
(3, 6, 3, 'accepted', '2025-01-26 10:00:00'),
(3, 12, 3, 'pending', '2025-01-31 10:00:00'),
(3, 14, 3, 'accepted', '2025-02-05 10:00:00'),
(3, 21, 3, 'pending', '2025-02-10 10:00:00'),
(3, 23, 3, 'accepted', '2025-02-15 10:00:00'),

-- Book Club (group 4, admin: Alice/4) - inviting literature lovers
(4, 8, 4, 'pending', '2025-02-05 10:00:00'),
(4, 11, 4, 'accepted', '2025-02-10 10:00:00'),
(4, 15, 4, 'pending', '2025-02-15 10:00:00'),
(4, 18, 4, 'accepted', '2025-02-20 10:00:00'),
(4, 20, 4, 'declined', '2025-02-25 10:00:00'),

-- Gaming Community (group 5, admin: David/5) - inviting gamers
(5, 6, 5, 'accepted', '2025-02-15 10:00:00'),
(5, 12, 5, 'pending', '2025-02-20 10:00:00'),
(5, 14, 5, 'accepted', '2025-02-25 10:00:00'),
(5, 18, 5, 'pending', '2025-03-02 10:00:00'),
(5, 21, 5, 'accepted', '2025-03-07 10:00:00'),

-- Photography Lovers (group 6, admin: Emma/6) - inviting photographers
(6, 1, 6, 'accepted', '2025-02-25 10:00:00'),
(6, 3, 6, 'pending', '2025-03-02 10:00:00'),
(6, 7, 6, 'accepted', '2025-03-07 10:00:00'),
(6, 11, 6, 'pending', '2025-03-12 10:00:00'),
(6, 13, 6, 'accepted', '2025-03-17 10:00:00'),

-- Entrepreneurship Hub (group 7, admin: James/7) - inviting business-minded users
(7, 8, 7, 'pending', '2025-03-07 10:00:00'),
(7, 9, 7, 'accepted', '2025-03-12 10:00:00'),
(7, 11, 7, 'pending', '2025-03-17 10:00:00'),
(7, 15, 7, 'accepted', '2025-03-22 10:00:00'),
(7, 16, 7, 'declined', '2025-03-27 10:00:00'),

-- Music & Arts (group 8, admin: Lisa/8) - inviting artistic users
(8, 1, 8, 'accepted', '2025-03-17 10:00:00'),
(8, 3, 8, 'pending', '2025-03-22 10:00:00'),
(8, 5, 8, 'accepted', '2025-03-27 10:00:00'),
(8, 9, 8, 'pending', '2025-04-01 10:00:00'),
(8, 11, 8, 'accepted', '2025-04-06 10:00:00'),

-- Travel Explorers (group 9, admin: Ryan/9) - inviting travelers
(9, 4, 9, 'pending', '2025-03-27 10:00:00'),
(9, 7, 9, 'accepted', '2025-04-01 10:00:00'),
(9, 11, 9, 'pending', '2025-04-06 10:00:00'),
(9, 13, 9, 'accepted', '2025-04-11 10:00:00'),
(9, 16, 9, 'declined', '2025-04-16 10:00:00'),

-- Cooking & Recipes (group 10, admin: Sophia/10) - inviting food enthusiasts
(10, 2, 10, 'accepted', '2025-04-06 10:00:00'),
(10, 4, 10, 'pending', '2025-04-11 10:00:00'),
(10, 6, 10, 'accepted', '2025-04-16 10:00:00'),
(10, 8, 10, 'pending', '2025-04-21 10:00:00'),
(10, 12, 10, 'accepted', '2025-04-26 10:00:00'),

-- Recent invitations for newer users
(1, 31, 1, 'accepted', '2025-08-27 10:00:00'), -- Nathan to Tech Enthusiasts
(2, 32, 2, 'pending', '2025-09-01 10:00:00'), -- Zoe to Design & Creativity
(3, 33, 3, 'accepted', '2025-09-06 10:00:00'), -- Carter to Fitness & Wellness
(5, 35, 5, 'pending', '2025-09-11 10:00:00'), -- Aria to Gaming Community
(6, 36, 6, 'accepted', '2025-09-16 10:00:00'), -- Jackson to Photography Lovers
(7, 37, 7, 'pending', '2025-09-21 10:00:00'), -- Scarlett to Entrepreneurship Hub
(8, 38, 8, 'accepted', '2025-09-26 10:00:00'), -- Mason to Music & Arts
(9, 39, 9, 'pending', '2025-09-31 10:00:00'), -- Levi to Travel Explorers
(10, 40, 10, 'accepted', '2025-10-06 10:00:00'); -- Aiden to Cooking & Recipes