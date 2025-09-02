-- Mock Notifications Data
-- Creating realistic notifications for various user activities

INSERT INTO notifications (user_id, actor_id, type, entity_type, entity_id, title, message, is_read, created_at, updated_at) VALUES
-- Follow request notifications
(4, 2, 'follow_request', 'user', 2, 'New Follow Request', 'Sarah Wilson sent you a follow request', false, datetime('now', '-18 days'), datetime('now', '-18 days')),
(8, 10, 'follow_request', 'user', 10, 'New Follow Request', 'Sophia Lee sent you a follow request', true, datetime('now', '-12 hours'), datetime('now', '-12 hours')),

-- Follow accepted notifications
(2, 4, 'follow_accepted', 'user', 4, 'Follow Request Accepted', 'Alice Cooper accepted your follow request', true, datetime('now', '-16 days'), datetime('now', '-16 days')),
(1, 7, 'follow_accepted', 'user', 7, 'New Follower', 'James Smith started following you', true, datetime('now', '-5 days'), datetime('now', '-5 days')),

-- New follower notifications
(1, 6, 'new_follower', 'user', 6, 'New Follower', 'Emma Davis started following you', true, datetime('now', '-10 days'), datetime('now', '-10 days')),
(2, 10, 'new_follower', 'user', 10, 'New Follower', 'Sophia Lee started following you', true, datetime('now', '-3 days'), datetime('now', '-3 days')),

-- Post like notifications
(1, 2, 'post_liked', 'post', 1, 'Post Liked', 'Sarah Wilson liked your post', false, datetime('now', '-2 days', '+1 hour'), datetime('now', '-2 days', '+1 hour')),
(1, 3, 'post_liked', 'post', 1, 'Post Liked', 'Mike Johnson liked your post', false, datetime('now', '-2 days', '+2 hours'), datetime('now', '-2 days', '+2 hours')),
(1, 6, 'post_liked', 'post', 1, 'Post Liked', 'Emma Davis liked your post', false, datetime('now', '-1 day'), datetime('now', '-1 day')),
(2, 1, 'post_liked', 'post', 4, 'Post Liked', 'John Doe liked your post', true, datetime('now', '-1 day', '+30 minutes'), datetime('now', '-1 day', '+30 minutes')),
(3, 2, 'post_liked', 'post', 7, 'Post Liked', 'Sarah Wilson liked your post', false, datetime('now', '-1 day', '+2 hours'), datetime('now', '-1 day', '+2 hours')),

-- Group invitation notifications
(2, 7, 'group_invitation', 'group', 2, 'Group Invitation', 'You were invited to join "Go Language Enthusiasts"', true, datetime('now', '-5 days'), datetime('now', '-5 days')),
(9, 4, 'group_invitation', 'group', 7, 'Group Invitation', 'You were invited to join "Digital Art Collective"', false, datetime('now', '-3 days'), datetime('now', '-3 days')),
(2, 5, 'group_invitation', 'group', 8, 'Group Invitation', 'You were invited to join "Startup Founders Network"', false, datetime('now', '-2 days'), datetime('now', '-2 days')),

-- Group join request notifications (for admins)
(7, 2, 'group_join_request', 'group', 2, 'Join Request', 'Sarah Wilson requested to join "Go Language Enthusiasts"', false, datetime('now', '-5 days'), datetime('now', '-5 days')),
(4, 9, 'group_join_request', 'group', 7, 'Join Request', 'Ryan Garcia requested to join "Digital Art Collective"', false, datetime('now', '-3 days'), datetime('now', '-3 days')),
(5, 2, 'group_join_request', 'group', 8, 'Join Request', 'Sarah Wilson requested to join "Startup Founders Network"', false, datetime('now', '-2 days'), datetime('now', '-2 days')),

-- Event notifications
(1, NULL, 'event_reminder', 'event', 1, 'Event Reminder', 'Reminder: "React 18 Workshop" starts in 2 days', false, datetime('now', '-2 days'), datetime('now', '-2 days')),
(2, NULL, 'event_reminder', 'event', 1, 'Event Reminder', 'Reminder: "React 18 Workshop" starts in 2 days', false, datetime('now', '-2 days'), datetime('now', '-2 days')),
(3, NULL, 'event_reminder', 'event', 6, 'Event Reminder', 'Reminder: "Group Training Session" starts tomorrow', false, datetime('now', '-1 day'), datetime('now', '-1 day')),
(6, NULL, 'event_reminder', 'event', 4, 'Event Reminder', 'Reminder: "Design System Workshop" starts in 3 days', false, datetime('now', '-2 days'), datetime('now', '-2 days')),

-- New event notifications
(1, 5, 'new_event', 'event', 2, 'New Event', 'New event "Code Review Session" was created in React Developers Community', true, datetime('now', '-3 days'), datetime('now', '-3 days')),
(6, 6, 'new_event', 'event', 5, 'New Event', 'New event "Accessibility in Design Panel" was created in UI/UX Designers Network', false, datetime('now', '-1 day'), datetime('now', '-1 day')),

-- Message notifications
(2, 1, 'new_message', 'message', NULL, 'New Message', 'You have a new message from John Doe', true, datetime('now', '-2 days', '+11:00'), datetime('now', '-2 days', '+11:00')),
(1, 2, 'new_message', 'message', NULL, 'New Message', 'You have a new message from Sarah Wilson', true, datetime('now', '-2 days', '+11:15'), datetime('now', '-2 days', '+11:15')),
(5, 3, 'new_message', 'message', NULL, 'New Message', 'You have a new message from Mike Johnson', false, datetime('now', '-1 day', '+14:00'), datetime('now', '-1 day', '+14:00')),
(9, 7, 'new_message', 'message', NULL, 'New Message', 'You have a new message from James Smith', false, datetime('now', '-12 hours'), datetime('now', '-12 hours')),

-- Group message notifications
(1, 2, 'group_message', 'group', 1, 'New Group Message', 'New message in React Developers Community', true, datetime('now', '-3 days'), datetime('now', '-3 days')),
(2, 3, 'group_message', 'group', 2, 'New Group Message', 'New message in Go Language Enthusiasts', false, datetime('now', '-8 days'), datetime('now', '-8 days')),
(4, 8, 'group_message', 'group', 3, 'New Group Message', 'New message in UI/UX Designers Network', false, datetime('now', '-5 days'), datetime('now', '-5 days')),

-- Activity notifications
(1, NULL, 'weekly_summary', 'system', NULL, 'Weekly Summary', 'Your weekly activity summary is ready! You had 15 interactions this week', true, datetime('now', '-7 days'), datetime('now', '-7 days')),
(3, NULL, 'achievement', 'system', NULL, 'Achievement', 'Congratulations! You reached 50 followers', true, datetime('now', '-5 days'), datetime('now', '-5 days')),
(9, NULL, 'achievement', 'post', 25, 'Achievement', 'Your post received 10 likes!', false, datetime('now', '-1 day', '+5 hours'), datetime('now', '-1 day', '+5 hours'));
