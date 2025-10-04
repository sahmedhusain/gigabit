-- Mock data for private_conversations table
INSERT INTO private_conversations (id, participant1_id, participant2_id, last_message_id, unread_count1, unread_count2, created_at, updated_at, participant1_deleted, participant2_deleted) VALUES
(1, 1, 2, NULL, 0, 0, datetime('now', '-350 days'), datetime('now', '-1 hour'), 0, 0), -- John and Sarah
(2, 1, 3, NULL, 0, 0, datetime('now', '-340 days'), datetime('now', '-2 hours'), 0, 0), -- John and Mike
(3, 2, 4, NULL, 0, 0, datetime('now', '-330 days'), datetime('now', '-30 minutes'), 0, 0), -- Sarah and Alice
(4, 3, 5, NULL, 0, 0, datetime('now', '-320 days'), datetime('now', '-1 day'), 0, 0), -- Mike and David
(5, 4, 6, NULL, 0, 0, datetime('now', '-310 days'), datetime('now', '-3 hours'), 0, 0), -- Alice and Emma
(6, 5, 7, NULL, 0, 0, datetime('now', '-300 days'), datetime('now', '-4 hours'), 0, 0), -- David and James
(7, 6, 8, NULL, 0, 0, datetime('now', '-290 days'), datetime('now', '-5 hours'), 0, 0), -- Emma and Lisa
(8, 7, 9, NULL, 0, 0, datetime('now', '-280 days'), datetime('now', '-6 hours'), 0, 0), -- James and Ryan
(9, 8, 10, NULL, 0, 0, datetime('now', '-270 days'), datetime('now', '-7 hours'), 0, 0), -- Lisa and Sophia
(10, 9, 11, NULL, 0, 0, datetime('now', '-260 days'), datetime('now', '-8 hours'), 0, 0), -- Ryan and Oliver
(11, 10, 12, NULL, 0, 0, datetime('now', '-250 days'), datetime('now', '-9 hours'), 0, 0), -- Sophia and Mia
(12, 11, 13, NULL, 0, 0, datetime('now', '-240 days'), datetime('now', '-10 hours'), 0, 0), -- Oliver and Ethan
(13, 12, 14, NULL, 0, 0, datetime('now', '-230 days'), datetime('now', '-11 hours'), 0, 0), -- Mia and Chloe
(14, 13, 15, NULL, 0, 0, datetime('now', '-220 days'), datetime('now', '-12 hours'), 0, 0), -- Ethan and Noah
(15, 14, 16, NULL, 0, 0, datetime('now', '-210 days'), datetime('now', '-13 hours'), 0, 0), -- Chloe and Ava
(16, 15, 17, NULL, 0, 0, datetime('now', '-200 days'), datetime('now', '-14 hours'), 0, 0), -- Noah and Liam
(17, 16, 18, NULL, 0, 0, datetime('now', '-190 days'), datetime('now', '-15 hours'), 0, 0), -- Ava and Isabella
(18, 17, 19, NULL, 0, 0, datetime('now', '-180 days'), datetime('now', '-16 hours'), 0, 0), -- Liam and Mason
(19, 18, 20, NULL, 0, 0, datetime('now', '-170 days'), datetime('now', '-17 hours'), 0, 0), -- Isabella and Harper
(20, 19, 21, NULL, 0, 0, datetime('now', '-160 days'), datetime('now', '-18 hours'), 0, 0), -- Mason and Elijah
(21, 20, 22, NULL, 0, 0, datetime('now', '-150 days'), datetime('now', '-19 hours'), 0, 0), -- Harper and Lucas
(22, 21, 23, NULL, 0, 0, datetime('now', '-140 days'), datetime('now', '-20 hours'), 0, 0), -- Elijah and Jackson
(23, 22, 24, NULL, 0, 0, datetime('now', '-130 days'), datetime('now', '-21 hours'), 0, 0), -- Lucas and Aiden
(24, 23, 25, NULL, 0, 0, datetime('now', '-120 days'), datetime('now', '-22 hours'), 0, 0), -- Jackson and Logan
(25, 24, 26, NULL, 0, 0, datetime('now', '-110 days'), datetime('now', '-23 hours'), 0, 0); -- Aiden and Benjamin