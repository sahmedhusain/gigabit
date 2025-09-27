-- Mock data for private_conversations table
INSERT INTO private_conversations (id, participant1_id, participant2_id, last_message_id, unread_count1, unread_count2, created_at, updated_at) VALUES
(1, 1, 2, NULL, 0, 0, datetime('now', '-10 days'), datetime('now', '-1 hour')), -- John and Sarah
(2, 1, 3, NULL, 0, 0, datetime('now', '-8 days'), datetime('now', '-2 hours')), -- John and Mike
(3, 2, 4, NULL, 0, 0, datetime('now', '-7 days'), datetime('now', '-30 minutes')), -- Sarah and Alice
(4, 3, 5, NULL, 0, 0, datetime('now', '-6 days'), datetime('now', '-1 day')), -- Mike and David
(5, 4, 6, NULL, 0, 0, datetime('now', '-5 days'), datetime('now', '-3 hours')), -- Alice and Emma
(6, 5, 7, NULL, 0, 0, datetime('now', '-4 days'), datetime('now', '-4 hours')), -- David and James
(7, 6, 8, NULL, 0, 0, datetime('now', '-3 days'), datetime('now', '-5 hours')), -- Emma and Lisa
(8, 7, 9, NULL, 0, 0, datetime('now', '-2 days'), datetime('now', '-6 hours')), -- James and Ryan
(9, 8, 10, NULL, 0, 0, datetime('now', '-1 day'), datetime('now', '-7 hours')), -- Lisa and Sophia
(10, 9, 11, NULL, 0, 0, datetime('now', '-12 hours'), datetime('now', '-8 hours')), -- Ryan and Oliver
(11, 10, 12, NULL, 0, 0, datetime('now', '-6 hours'), datetime('now', '-9 hours')), -- Sophia and Mia
(12, 11, 13, NULL, 0, 0, datetime('now', '-3 hours'), datetime('now', '-10 hours')), -- Oliver and Ethan
(13, 12, 14, NULL, 0, 0, datetime('now', '-2 hours'), datetime('now', '-11 hours')), -- Mia and Chloe
(14, 13, 15, NULL, 0, 0, datetime('now', '-1 hour'), datetime('now', '-12 hours')), -- Ethan and Noah
(15, 14, 1, NULL, 0, 0, datetime('now', '-30 minutes'), datetime('now', '-13 hours')), -- Chloe and John
(16, 15, 2, NULL, 0, 0, datetime('now', '-15 minutes'), datetime('now', '-14 hours')); -- Noah and Sarah