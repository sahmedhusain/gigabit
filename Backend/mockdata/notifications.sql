-- Mock Notifications Data
-- Creating realistic notifications for various user activities

INSERT INTO notifications (user_id, type, message, related_user_id, related_post_id, related_group_id, related_event_id, is_read, created_at) VALUES
-- Follow request notifications
(4, 'follow_request', 'Sarah Wilson sent you a follow request', 2, NULL, NULL, NULL, false, datetime('now', '-18 days')),
(8, 'follow_request', 'Sophia Lee sent you a follow request', 10, NULL, NULL, NULL, true, datetime('now', '-12 hours')),

-- Follow accepted notifications
(2, 'follow_accepted', 'Alice Cooper accepted your follow request', 4, NULL, NULL, NULL, true, datetime('now', '-16 days')),
(1, 'follow_accepted', 'James Smith started following you', 7, NULL, NULL, NULL, true, datetime('now', '-5 days')),

-- New follower notifications
(1, 'new_follower', 'Emma Davis started following you', 6, NULL, NULL, NULL, true, datetime('now', '-10 days')),
(2, 'new_follower', 'Sophia Lee started following you', 10, NULL, NULL, NULL, true, datetime('now', '-3 days')),

-- Post like notifications
(1, 'post_liked', 'Sarah Wilson liked your post', 2, 1, NULL, NULL, false, datetime('now', '-2 days', '+1 hour')),
(1, 'post_liked', 'Mike Johnson liked your post', 3, 1, NULL, NULL, false, datetime('now', '-2 days', '+2 hours')),
(1, 'post_liked', 'Emma Davis liked your post', 6, 1, NULL, NULL, false, datetime('now', '-1 day')),
(2, 'post_liked', 'John Doe liked your post', 1, 4, NULL, NULL, true, datetime('now', '-1 day', '+30 minutes')),
(3, 'post_liked', 'Sarah Wilson liked your post', 2, 7, NULL, NULL, false, datetime('now', '-1 day', '+2 hours')),

-- Group invitation notifications
(2, 'group_invitation', 'You were invited to join "Go Language Enthusiasts"', 7, NULL, 2, NULL, true, datetime('now', '-5 days')),
(9, 'group_invitation', 'You were invited to join "Digital Art Collective"', 4, NULL, 7, NULL, false, datetime('now', '-3 days')),
(2, 'group_invitation', 'You were invited to join "Startup Founders Network"', 5, NULL, 8, NULL, false, datetime('now', '-2 days')),

-- Group join request notifications (for admins)
(7, 'group_join_request', 'Sarah Wilson requested to join "Go Language Enthusiasts"', 2, NULL, 2, NULL, false, datetime('now', '-5 days')),
(4, 'group_join_request', 'Ryan Garcia requested to join "Digital Art Collective"', 9, NULL, 7, NULL, false, datetime('now', '-3 days')),
(5, 'group_join_request', 'Sarah Wilson requested to join "Startup Founders Network"', 2, NULL, 8, NULL, false, datetime('now', '-2 days')),

-- Event notifications
(1, 'event_reminder', 'Reminder: "React 18 Workshop" starts in 2 days', NULL, NULL, 1, 1, false, datetime('now', '-2 days')),
(2, 'event_reminder', 'Reminder: "React 18 Workshop" starts in 2 days', NULL, NULL, 1, 1, false, datetime('now', '-2 days')),
(3, 'event_reminder', 'Reminder: "Group Training Session" starts tomorrow', NULL, NULL, 4, 6, false, datetime('now', '-1 day')),
(6, 'event_reminder', 'Reminder: "Design System Workshop" starts in 3 days', NULL, NULL, 3, 4, false, datetime('now', '-2 days')),

-- New event notifications
(1, 'new_event', 'New event "Code Review Session" was created in React Developers Community', 5, NULL, 1, 2, true, datetime('now', '-3 days')),
(6, 'new_event', 'New event "Accessibility in Design Panel" was created in UI/UX Designers Network', 6, NULL, 3, 5, false, datetime('now', '-1 day')),

-- Message notifications
(2, 'new_message', 'You have a new message from John Doe', 1, NULL, NULL, NULL, true, datetime('now', '-2 days', '+11:00')),
(1, 'new_message', 'You have a new message from Sarah Wilson', 2, NULL, NULL, NULL, true, datetime('now', '-2 days', '+11:15')),
(5, 'new_message', 'You have a new message from Mike Johnson', 3, NULL, NULL, NULL, false, datetime('now', '-1 day', '+14:00')),
(9, 'new_message', 'You have a new message from James Smith', 7, NULL, NULL, NULL, false, datetime('now', '-12 hours')),

-- Group message notifications
(1, 'group_message', 'New message in React Developers Community', 2, NULL, 1, NULL, true, datetime('now', '-3 days')),
(2, 'group_message', 'New message in Go Language Enthusiasts', 3, NULL, 2, NULL, false, datetime('now', '-8 days')),
(4, 'group_message', 'New message in UI/UX Designers Network', 8, NULL, 3, NULL, false, datetime('now', '-5 days')),

-- Activity notifications
(1, 'weekly_summary', 'Your weekly activity summary is ready! You had 15 interactions this week', NULL, NULL, NULL, NULL, true, datetime('now', '-7 days')),
(3, 'achievement', 'Congratulations! You reached 50 followers', NULL, NULL, NULL, NULL, true, datetime('now', '-5 days')),
(9, 'achievement', 'Your post received 10 likes!', NULL, 25, NULL, NULL, false, datetime('now', '-1 day', '+5 hours'));