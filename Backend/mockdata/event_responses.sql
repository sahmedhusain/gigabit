-- Mock data for event_responses table
INSERT INTO event_responses (event_id, user_id, response, created_at, updated_at) VALUES
-- User 1 (john_doe) going to some events
(1, 1, 'going', datetime('now'), datetime('now')),
(2, 1, 'going', datetime('now'), datetime('now')),
(3, 1, 'going', datetime('now'), datetime('now')),

-- User 2 (sarah_wilson) going to some events
(1, 2, 'going', datetime('now'), datetime('now')),
(4, 2, 'going', datetime('now'), datetime('now')),
(5, 2, 'going', datetime('now'), datetime('now')),

-- User 3 (mike_johnson) going to some events
(2, 3, 'going', datetime('now'), datetime('now')),
(6, 3, 'going', datetime('now'), datetime('now')),
(7, 3, 'going', datetime('now'), datetime('now')),

-- User 4 (alice_cooper) going to some events
(3, 4, 'going', datetime('now'), datetime('now')),
(8, 4, 'going', datetime('now'), datetime('now')),
(9, 4, 'going', datetime('now'), datetime('now')),

-- User 5 (david_brown) going to some events
(4, 5, 'going', datetime('now'), datetime('now')),
(10, 5, 'going', datetime('now'), datetime('now')),
(11, 5, 'going', datetime('now'), datetime('now')),

-- User 6 (emma_davis) going to some events
(5, 6, 'going', datetime('now'), datetime('now')),
(12, 6, 'going', datetime('now'), datetime('now')),
(13, 6, 'going', datetime('now'), datetime('now')),

-- User 7 (james_smith) going to some events
(6, 7, 'going', datetime('now'), datetime('now')),
(14, 7, 'going', datetime('now'), datetime('now')),
(15, 7, 'going', datetime('now'), datetime('now')),

-- User 8 (lisa_taylor) going to some events
(7, 8, 'going', datetime('now'), datetime('now')),
(16, 8, 'going', datetime('now'), datetime('now')),

-- Some users not going to events
(1, 3, 'not_going', datetime('now'), datetime('now')),
(2, 4, 'not_going', datetime('now'), datetime('now')),
(3, 5, 'not_going', datetime('now'), datetime('now'));