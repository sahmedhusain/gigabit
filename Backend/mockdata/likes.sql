-- Mock Likes Data
-- Creating realistic like patterns between users and posts

INSERT INTO likes (user_id, post_id, created_at) VALUES
-- Likes on John's posts (posts 1-3)
(2, 1, datetime('now', '-2 days', '+1 hour')), -- Sarah likes John's React post
(3, 1, datetime('now', '-2 days', '+2 hours')), -- Mike likes John's React post
(5, 1, datetime('now', '-2 days', '+3 hours')), -- David likes John's React post
(6, 1, datetime('now', '-1 day')), -- Emma likes John's React post
(7, 1, datetime('now', '-1 day', '+2 hours')), -- James likes John's React post

(2, 2, datetime('now', '-5 days', '+30 minutes')), -- Sarah likes John's sunset post
(6, 2, datetime('now', '-4 days')), -- Emma likes John's sunset post
(10, 2, datetime('now', '-4 days', '+1 hour')), -- Sophia likes John's sunset post

(7, 3, datetime('now', '-8 days', '+1 hour')), -- James likes John's Go post
(5, 3, datetime('now', '-7 days')), -- David likes John's Go post

-- Likes on Sarah's posts (posts 4-6)
(1, 4, datetime('now', '-1 day', '+30 minutes')), -- John likes Sarah's marketing post
(6, 4, datetime('now', '-1 day', '+1 hour')), -- Emma likes Sarah's marketing post
(7, 4, datetime('now', '-1 day', '+2 hours')), -- James likes Sarah's marketing post
(10, 4, datetime('now', '-1 day', '+3 hours')), -- Sophia likes Sarah's marketing post

(1, 5, datetime('now', '-3 days', '+1 hour')), -- John likes Sarah's Barcelona post
(6, 5, datetime('now', '-2 days')), -- Emma likes Sarah's Barcelona post
(9, 5, datetime('now', '-2 days', '+2 hours')), -- Ryan likes Sarah's Barcelona post

(1, 6, datetime('now', '-6 days', '+2 hours')), -- John likes Sarah's coffee post
(3, 6, datetime('now', '-5 days')), -- Mike likes Sarah's coffee post

-- Likes on Mike's posts (posts 7-9)
(1, 7, datetime('now', '-1 day', '+1 hour')), -- John likes Mike's running post
(2, 7, datetime('now', '-1 day', '+2 hours')), -- Sarah likes Mike's running post
(5, 7, datetime('now', '-1 day', '+3 hours')), -- David likes Mike's running post
(9, 7, datetime('now', '-1 day', '+4 hours')), -- Ryan likes Mike's running post

(2, 8, datetime('now', '-4 days', '+1 hour')), -- Sarah likes Mike's meal prep post
(6, 8, datetime('now', '-3 days')), -- Emma likes Mike's meal prep post

(7, 9, datetime('now', '-7 days', '+2 hours')), -- James likes Mike's workout post
(9, 9, datetime('now', '-6 days')), -- Ryan likes Mike's workout post

-- Likes on Alice's posts (posts 10-12) - only from followers
(2, 10, datetime('now', '-2 days', '+30 minutes')), -- Sarah likes Alice's design post
(6, 10, datetime('now', '-1 day')), -- Emma likes Alice's design post
(8, 10, datetime('now', '-1 day', '+2 hours')), -- Lisa likes Alice's design post

(6, 11, datetime('now', '-5 days', '+1 hour')), -- Emma likes Alice's color theory post
(8, 11, datetime('now', '-4 days')), -- Lisa likes Alice's color theory post

-- Likes on David's posts (posts 13-15)
(1, 13, datetime('now', '-1 day', '+45 minutes')), -- John likes David's roadmap post
(3, 13, datetime('now', '-1 day', '+2 hours')), -- Mike likes David's roadmap post
(6, 13, datetime('now', '-1 day', '+3 hours')), -- Emma likes David's roadmap post
(7, 13, datetime('now', '-1 day', '+4 hours')), -- James likes David's roadmap post

(1, 14, datetime('now', '-4 days', '+2 hours')), -- John likes David's AI post
(7, 14, datetime('now', '-3 days')), -- James likes David's AI post
(8, 14, datetime('now', '-3 days', '+1 hour')), -- Lisa likes David's AI post

-- Likes on Emma's posts (posts 16-18)
(1, 16, datetime('now', '-2 days', '+1 hour')), -- John likes Emma's accessibility post
(2, 16, datetime('now', '-1 day')), -- Sarah likes Emma's accessibility post
(6, 16, datetime('now', '-1 day', '+2 hours')), -- Emma's own post (self-like removed)
(7, 16, datetime('now', '-1 day', '+3 hours')), -- James likes Emma's accessibility post

(2, 17, datetime('now', '-5 days', '+1 hour')), -- Sarah likes Emma's Figma post
(4, 17, datetime('now', '-4 days')), -- Alice likes Emma's Figma post
(10, 17, datetime('now', '-4 days', '+1 hour')), -- Sophia likes Emma's Figma post

-- Likes on James's posts (posts 19-21)
(2, 19, datetime('now', '-1 day', '+30 minutes')), -- Sarah likes James's open source post
(3, 19, datetime('now', '-1 day', '+1 hour')), -- Mike likes James's open source post
(5, 19, datetime('now', '-1 day', '+2 hours')), -- David likes James's open source post
(6, 19, datetime('now', '-1 day', '+3 hours')), -- Emma likes James's open source post

(5, 20, datetime('now', '-3 days', '+1 hour')), -- David likes James's Docker post
(1, 20, datetime('now', '-2 days')), -- John likes James's Docker post

-- Likes on Lisa's posts (posts 22-24) - only from followers
(6, 22, datetime('now', '-1 day', '+1 hour')), -- Emma likes Lisa's ML post
(4, 22, datetime('now', '-1 day', '+2 hours')), -- Alice likes Lisa's ML post
(10, 22, datetime('now', '-1 day', '+3 hours')), -- Sophia likes Lisa's ML post

-- Likes on Ryan's posts (posts 25-27)
(3, 25, datetime('now', '-1 day', '+2 hours')), -- Mike likes Ryan's beach photo
(5, 25, datetime('now', '-1 day', '+3 hours')), -- David likes Ryan's beach photo
(7, 25, datetime('now', '-1 day', '+4 hours')), -- James likes Ryan's beach photo
(10, 25, datetime('now', '-1 day', '+5 hours')), -- Sophia likes Ryan's beach photo

(7, 26, datetime('now', '-3 days', '+1 hour')), -- James likes Ryan's wedding post
(10, 26, datetime('now', '-2 days')), -- Sophia likes Ryan's wedding post

-- Likes on Sophia's posts (posts 28-30)
(2, 28, datetime('now', '-1 day', '+1 hour')), -- Sarah likes Sophia's campaign post
(6, 28, datetime('now', '-1 day', '+2 hours')), -- Emma likes Sophia's campaign post
(7, 28, datetime('now', '-1 day', '+3 hours')), -- James likes Sophia's campaign post
(9, 28, datetime('now', '-1 day', '+4 hours')), -- Ryan likes Sophia's campaign post

(6, 29, datetime('now', '-2 days', '+1 hour')), -- Emma likes Sophia's content creation post
(7, 29, datetime('now', '-1 day')), -- James likes Sophia's content creation post
(9, 29, datetime('now', '-1 day', '+1 hour')); -- Ryan likes Sophia's content creation post