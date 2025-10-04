# Event Creation Permissions & Notifications

## Overview
Updated event system to restrict creation to group admins and creators, plus notify all group members when an event is created.

## Changes Implemented

### 1. Backend: Event Creation Notifications ✅

#### Updated Files:
- **`Backend/handlers/event.go`**
  - Added `notificationService` field to `EventHandler`
  - Modified `NewEventHandler()` to accept WebSocket hub
  - Added notification call in `CreateEvent()`:
    ```go
    // Send notifications to all group members (async, don't wait for it)
    go h.notificationService.NotifyEventCreated(userID, uint(groupID), event.ID)
    ```

- **`Backend/Server.go`**
  - Updated `NewEventHandler()` call to pass WebSocket hub:
    ```go
    eventHandler := handlers.NewEventHandler(s.DB.GetDB(), s.Hub)
    ```

#### How It Works:
1. When an event is created, the handler calls `NotifyEventCreated()`
2. The notification service gets all group members (excluding creator)
3. Creates a notification for each member
4. Broadcasts via WebSocket for real-time delivery
5. Saves to database for later viewing

#### Notification Message Example:
```
Title: "New Event"
Message: "John Doe created event 'Team Building Day'"
Type: "event_created"
```

### 2. Frontend: Admin/Creator Only Permissions ✅

#### Updated Files:
- **`Frontend/hooks/useGroups.ts`**
  - Modified `refetch()` to fetch role for each group
  - Groups now include `role` and `is_admin_or_creator` fields
  - Uses `api.getUserRole(groupId)` to get user's role

- **`Frontend/components/dashboard/CreateGeneralEvent.tsx`**
  - Added filter to only show groups where user is admin or creator:
    ```typescript
    const eligibleGroups = groups.filter(group => {
      if (!user) return false
      return group.creator_id === user.id || group.role === 'admin'
    })
    ```
  - Disabled "Create Event" button when no eligible groups
  - Shows tooltip: "You must be a group admin or creator to create events"
  - Dropdown shows "(Creator)" or "(Admin)" next to group names
  - Shows warning message when no eligible groups available

#### UI Changes:
1. **Group Dropdown**:
   - Only shows groups where user has permissions
   - Displays role badge: "Group Name (Creator)" or "Group Name (Admin)"
   - Shows message: "No groups available (admin/creator only)" when empty

2. **Create Button**:
   - Disabled and grayed out when no eligible groups
   - Tooltip explains permission requirement
   - Button opacity reduced when disabled

3. **Visual Feedback**:
   - Yellow warning label: "(Admin/Creator only)" next to group label
   - Warning box if user has no groups to create events in

### 3. How It Works End-to-End

```
User Clicks "Create Event"
    ↓
Modal Opens
    ↓
useGroups hook fetches groups + roles
    ↓
Filter: Only show admin/creator groups
    ↓
User selects group (if eligible)
    ↓
User fills event details
    ↓
Submits to backend
    ↓
Backend validates: Must be admin or creator
    ↓
Event created
    ↓
NotifyEventCreated() called
    ↓
Notification sent to all group members
    ↓
Real-time toast appears for each member
    ↓
Notification saved to database
    ↓
Members can view in notifications page
```

## Backend Permission Check

The backend already had permission checks in place:
```go
// Check if user is a member of the group
isMember, err := h.groupService.IsUserMember(uint(groupID), userID)
if err != nil || !isMember {
    writeError(w, http.StatusForbidden, "Must be a group member to create events")
    return
}

// Check if user is an admin or creator of the group
isAdminOrCreator, err := h.groupService.IsUserAdminOrCreator(uint(groupID), userID)
if err != nil || !isAdminOrCreator {
    writeError(w, http.StatusForbidden, "Only group admins and creators can create events")
    return
}
```

This provides server-side security. The frontend changes add better UX by preventing unauthorized attempts.

## User Experience

### For Group Admins/Creators:
1. Click "Create Event" button
2. See dropdown with all their admin/creator groups
3. Select group, fill details
4. Create event successfully
5. All group members receive real-time notification

### For Regular Members:
1. Click "Create Event" button
2. See message: "No groups available (admin/creator only)"
3. Cannot select any groups
4. "Create Event" button is disabled
5. Clear feedback about permission requirements

### For Group Members (receiving notification):
1. Real-time toast notification appears (upper right)
2. Shows: "{Creator Name} created event '{Event Title}'"
3. Click to navigate to event
4. Also appears in notifications page
5. Can mark as read or delete

## API Endpoints Used

### Get User Role:
```
GET /api/groups/{groupId}/role
Response: { "role": "admin|member|creator", "is_admin_or_creator": true|false }
```

### Create Event:
```
POST /api/groups/{groupId}/events
Body: { "title": "...", "description": "...", "event_time": "...", "location": "..." }
```

## Database Schema

### Notifications Table:
```sql
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    actor_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'event_created'
    entity_type TEXT NOT NULL, -- 'event'
    entity_id INTEGER NOT NULL, -- event_id
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Testing

### Test Event Creation Permissions:
1. **As Group Creator**:
   - Should see group in dropdown
   - Should be able to create event
   - All members receive notification

2. **As Group Admin**:
   - Should see group in dropdown
   - Should be able to create event
   - All members receive notification

3. **As Regular Member**:
   - Should NOT see group in dropdown
   - Should see warning message
   - Cannot create event

### Test Notifications:
1. Create event as admin/creator
2. Check other members receive:
   - Real-time toast notification (upper right)
   - Entry in notifications page
3. Click notification toast → navigates to event
4. Verify notification is marked as read
5. Test notification deletion

## Security Considerations

✅ **Backend Validation**: Server always checks permissions before creating event
✅ **Database Constraints**: Foreign keys ensure data integrity
✅ **Role Verification**: getUserRole endpoint validates membership and role
✅ **Notification Privacy**: Only group members receive event notifications
✅ **WebSocket Auth**: WebSocket connections are authenticated

## Future Enhancements (Optional)

- [ ] Notification preferences per user
- [ ] Digest mode (batch notifications)
- [ ] Event reminder notifications
- [ ] RSVP notifications to event creator
- [ ] Event update notifications
- [ ] Event cancellation notifications
- [ ] @mention support in event descriptions
- [ ] Rich event notifications with images

## Files Modified Summary

### Backend:
- ✅ `Backend/handlers/event.go` - Added notification service
- ✅ `Backend/Server.go` - Updated handler initialization

### Frontend:
- ✅ `Frontend/hooks/useGroups.ts` - Fetch user roles
- ✅ `Frontend/components/dashboard/CreateGeneralEvent.tsx` - Filter eligible groups
- ✅ `Frontend/components/dashboard/CommunitySection.tsx` - Added comment about permissions

## Notes

- Notifications are sent asynchronously (`go` routine) to not block event creation response
- If notification fails, event is still created (fire-and-forget)
- Frontend caches group roles to avoid repeated API calls
- Backend permissions are the source of truth
- Frontend UX improvements guide users to success

