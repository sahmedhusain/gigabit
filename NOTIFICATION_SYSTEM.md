# Real-Time Notification System

## Overview
Comprehensive real-time notification system with toast notifications in the upper right corner and a dedicated notifications page.

## Features Implemented

### 1. Toast Notifications (Upper Right Corner)
- **Location**: Fixed position in upper right corner (top-right)
- **Auto-dismiss**: 6 seconds duration with progress bar
- **Interactive**: Click to navigate to related content
- **Beautiful UI**: Glassmorphic design with gradients
- **Animated**: Smooth slide-in/out animations

### 2. Notification Types Supported

#### Social Actions
- **Likes** 👍
  - When someone likes your post
  - Shows heart icon with red gradient
  - Links to the post

- **Comments** 💬
  - When someone comments on your post  
  - Shows message icon with blue gradient
  - Links to the post

- **Follows** 👤
  - Follow requests (for private accounts)
  - New followers
  - Shows user-plus icon with emerald gradient
  - Links to the user's profile

#### Messages
- **Private Messages** 📨
  - New direct messages
  - Shows mail icon with cyan gradient
  - Links to direct messages page

- **Group Messages** 👥
  - New group chat messages
  - Shows users icon with orange gradient  
  - Links to group chats

#### Group Activities
- **Group Invitations** 👥
  - When invited to join a group
  - Shows users icon with orange gradient
  - Links to the group page

- **Join Requests** 👥
  - When someone requests to join your group
  - Shows users icon with orange gradient
  - Links to the group page

- **Group Posts** 📝
  - New posts in your groups
  - Links to the group page

#### Events
- **Event Created** 📅
  - New events in your groups
  - Shows calendar icon with purple gradient
  - Links to events page

- **Event Invitations** 📅
  - When invited to an event
  - Links to the specific event

### 3. Notifications Page
- **Full List**: View all notifications with filtering
- **Search**: Search notifications by content or actor name
- **Filter by Time**: Today, This Week, This Month, All Time
- **Bulk Actions**: 
  - Select all/multiple notifications
  - Mark multiple as read
  - Delete multiple
- **Mark as Read**: Individual or all at once
- **Beautiful UI**: Glassmorphic design with proper spacing

### 4. Backend Integration

#### Notification Service
All notification types are handled in `/Backend/services/notification_service.go`:
- `NotifyPostLiked()` - When someone likes a post
- `NotifyPostCommented()` - When someone comments  
- `NotifyFollowRequest()` - Follow request sent
- `NotifyFollowAccepted()` - Follow request accepted
- `NotifyGroupInvite()` - Group invitation
- `NotifyJoinRequest()` - Join request for group
- `NotifyEventCreated()` - New event in group
- `NotifyNewMessage()` - New private message
- `NotifyGroupPostCreated()` - New post in group
- `NotifyGroupPostLiked()` - Group post liked

#### WebSocket Integration
Real-time notifications are sent via WebSocket:
- Notifications broadcast to specific users
- Includes actor information, message, and entity links
- Automatically handled by frontend context

#### Updated Handlers
- **Post Handler** (`/Backend/handlers/post.go`):
  - Sends notification when post is liked
  - Sends notification when comment is created
  
- **Follow Handler** (already implemented):
  - Sends notifications for follow requests and accepts
  
- **Group Handler** (already implemented):
  - Sends notifications for invites and join requests
  
- **Message Handler** (already implemented):
  - Sends notifications for new messages
  
- **Event Handler** (already implemented):
  - Sends notifications when events are created

### 5. Frontend Components

#### NotificationToast.tsx
Individual toast notification component with:
- Dynamic icons based on type
- Avatar support
- Click-to-navigate functionality
- Close button
- Progress bar animation

#### NotificationToastContainer.tsx
Container that manages multiple toasts:
- Stacks notifications vertically
- Positioned in upper right
- Auto-manages lifecycle

#### NotificationToastContext.tsx
Context provider that:
- Listens to WebSocket messages
- Converts messages to toast notifications
- Manages notification queue
- Handles auto-dismiss
- Provides `addNotification`, `removeNotification`, `clearAll`

#### NotificationsPage.tsx  
Full notifications page with:
- Search and filter capabilities
- Bulk selection and actions
- Mark as read functionality
- Delete notifications
- Beautiful loading states

### 6. How It Works

```
User Action (e.g., likes post)
    ↓
Backend Handler
    ↓
Notification Service creates notification
    ↓
Saves to database
    ↓
WebSocket broadcasts to recipient
    ↓
Frontend WebSocket Context receives message
    ↓
NotificationToastContext processes message
    ↓
Creates toast notification (upper right)
    ↓
Also updates NotificationsPage list
    ↓
User sees real-time toast + can view in notifications page
```

### 7. Navigation Integration

#### Notifications Button
Located in the header (TopBar component):
- Bell icon with unread count badge
- Click to navigate to `/notifications` page
- Real-time unread count updates

#### Toast Click Actions
Each notification type links to relevant content:
- **Likes**: `/post/{post_id}`
- **Comments**: `/post/{post_id}`
- **Follows**: `/profile/{user_id}`
- **Messages**: `/direct-messages`
- **Group Messages**: `/chats/all`
- **Group Invites**: `/group/{group_id}`
- **Events**: `/events?event={event_id}`

## Usage

### For Users
1. **Real-Time Toasts**: Automatically appear in upper right when actions happen
2. **Notifications Page**: Click bell icon in header to view all notifications
3. **Mark as Read**: Click checkmark on individual notifications or "Mark All Read"
4. **Delete**: Remove unwanted notifications
5. **Search/Filter**: Find specific notifications easily

### For Developers

#### Add New Notification Type

1. **Define constant** in `/Backend/models/notification.go`:
```go
const NotificationNewType = "new_type"
```

2. **Create service method** in `/Backend/services/notification_service.go`:
```go
func (s *NotificationService) NotifyNewType(actorID, recipientID, entityID uint) error {
    notification := &models.Notification{
        UserID:     recipientID,
        ActorID:    actorID,
        Type:       models.NotificationNewType,
        EntityType: "entity_type",
        EntityID:   entityID,
        Title:      "New Notification",
        Message:    "Something happened",
    }
    return s.CreateNotification(notification)
}
```

3. **Call in handler**:
```go
go h.notificationService.NotifyNewType(userID, recipientID, entityID)
```

4. **Add to frontend** `/Frontend/context/NotificationToastContext.tsx`:
```typescript
case 'new_type':
    notificationType = 'general'
    title = 'New Type'
    link = `/path/${entity_id}`
    break
```

## Files Modified/Created

### Frontend
- ✅ `/Frontend/components/NotificationToast.tsx` (new)
- ✅ `/Frontend/components/NotificationToastContainer.tsx` (new)
- ✅ `/Frontend/context/NotificationToastContext.tsx` (new)
- ✅ `/Frontend/app/layout.tsx` (updated - added providers)
- ✅ `/Frontend/components/dashboard/NotificationsPage.tsx` (already existed)
- ✅ `/Frontend/hooks/useNotifications.ts` (already existed)

### Backend
- ✅ `/Backend/handlers/post.go` (updated - added notification calls)
- ✅ `/Backend/handlers/notification.go` (already existed)
- ✅ `/Backend/services/notification_service.go` (already existed)
- ✅ `/Backend/models/notification.go` (already existed)

## Testing

To test the notification system:

1. **Like a Post**: Like someone else's post → they see toast + notification
2. **Comment**: Comment on a post → owner sees toast + notification
3. **Follow**: Send follow request → recipient sees toast + notification
4. **Message**: Send private message → recipient sees toast
5. **Group Invite**: Invite to group → invitee sees toast + notification
6. **Create Event**: Create event in group → members see toast + notification

## Next Steps (Optional Enhancements)

- [ ] Add notification sounds
- [ ] Browser push notifications (when app is not focused)
- [ ] Notification preferences/settings per user
- [ ] Group notifications by type
- [ ] Rich notifications with images/previews
- [ ] "Do not disturb" mode
- [ ] Notification categories/channels

## Notes

- Notifications are sent asynchronously (using `go` routines) to not block API responses
- WebSocket must be connected for real-time toasts
- Notifications are persisted in database and viewable later
- Toast notifications auto-dismiss after 6 seconds
- Users can click toasts to navigate to related content
- Notifications page supports bulk operations

