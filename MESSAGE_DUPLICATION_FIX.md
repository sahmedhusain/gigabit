# Message Duplication Fix

## Problem
Messages were appearing **3 times** on the receiver's side in both DMs and group chats.

## Root Cause
The message flow had multiple redundant save and broadcast operations:

### Before Fix:
1. **Frontend** (`useRealTimeMessages.ts`):
   - Added optimistic message to local state ✅
   - Sent message via WebSocket to hub ❌
   - Sent message via HTTP API ✅

2. **Backend WebSocket Hub** (`hub.go`):
   - Received WebSocket message
   - Saved to database ❌ (redundant)
   - Broadcast to recipients ❌ (redundant)

3. **Backend API Handler** (`message.go`):
   - Received HTTP request
   - Saved to database ✅
   - Broadcast via WebSocket ✅

### Result:
- **Sender saw**: 1 optimistic message
- **Receiver saw**: 3 copies (optimistic + hub broadcast + API broadcast)

## Solution

### Backend Changes (`Backend/websocket/hub.go`)

#### 1. Removed database save from `handlePrivateMessage`:
```go
// Before: saved to DB and broadcast
// After: only broadcasts (real-time delivery only)
func (h *Hub) handlePrivateMessage(message Message) {
    // WebSocket is for real-time delivery only
    // Message persistence is handled by the HTTP API endpoint
    
    h.mu.RLock()
    targetClient, exists := h.clients[message.To]
    h.mu.RUnlock()
    // ... rest of broadcast logic
}
```

#### 2. Removed database save from `handleGroupMessage`:
```go
// Before: saved to DB and broadcast
// After: only broadcasts (real-time delivery only)
func (h *Hub) handleGroupMessage(message Message) {
    // WebSocket is for real-time delivery only
    // Message persistence is handled by the HTTP API endpoint
    
    h.mu.RLock()
    defer h.mu.RUnlock()
    // ... rest of broadcast logic
}
```

### Frontend Changes (`Frontend/hooks/useRealTimeMessages.ts`)

#### 1. Removed redundant WebSocket send:
```typescript
// Before: sent via both WebSocket AND API
// After: only sends via API (which handles WebSocket broadcast)

// Add optimistic message to local state
setMessages(prev => {
  const conversationMessages = prev.get(conversationId) || []
  const updated = new Map(prev)
  updated.set(conversationId, [...conversationMessages, optimisticMessage])
  return updated
})

// Send to backend API - the backend will handle WebSocket broadcast
const apiData = { content, message_type: groupId ? 'group' : 'private' }
await api.sendMessage(apiData)
```

#### 2. Improved duplicate detection:
```typescript
// Better duplicate detection using:
// 1. Real message IDs (from database)
// 2. Content + sender + time window (for optimistic messages)

const messageExists = conversationMessages.some(msg => {
  // If both have real IDs (not timestamps), compare them
  if (msg.id && newMessage.id && 
      msg.id < 1000000000000 && newMessage.id < 1000000000000) {
    return msg.id === newMessage.id
  }
  
  // Otherwise, use content-based matching
  return msg.content === newMessage.content && 
         msg.sender_id === newMessage.sender_id && 
         Math.abs(new Date(msg.created_at).getTime() - 
                  new Date(newMessage.created_at).getTime()) < 10000
})
```

## New Message Flow

### After Fix:
1. **Frontend**:
   - Adds optimistic message to local state (shows immediately to sender)
   - Sends HTTP POST request to `/api/messages`

2. **Backend API Handler** (`message.go`):
   - Saves message to database
   - Broadcasts via WebSocket to all relevant recipients

3. **Backend WebSocket Hub** (`hub.go`):
   - Receives broadcast from API handler
   - Delivers to online recipients only (no DB save)

4. **Frontend WebSocket Listener**:
   - Receives broadcast
   - Checks for duplicates
   - Adds message if not already present

### Result:
- **Sender sees**: 1 message (optimistic, then replaced with real one)
- **Receiver sees**: 1 message (from WebSocket broadcast)

## Architecture Principles

1. **Single Source of Truth**: Only the HTTP API endpoint saves messages to the database
2. **WebSocket for Real-Time Only**: WebSocket hub handles real-time delivery, not persistence
3. **Optimistic UI**: Frontend shows messages immediately, then syncs with server
4. **Duplicate Prevention**: Smart deduplication using message IDs and content matching

## Testing

To verify the fix:
1. Start the backend: `cd Backend && go run .`
2. Start the frontend: `cd Frontend && npm run dev`
3. Open two browser windows with different users
4. Send messages in both private and group chats
5. Verify each message appears **exactly once** on both sides

## Files Modified

### Backend:
- `Backend/websocket/hub.go` - Removed redundant DB saves and broadcasts
- `Backend/services/message_service.go` - Added GetDB() method

### Frontend:
- `Frontend/hooks/useRealTimeMessages.ts` - Removed redundant WebSocket send, improved deduplication

## Benefits

✅ Messages appear exactly once  
✅ No duplicate database entries  
✅ Reduced network traffic  
✅ Cleaner separation of concerns  
✅ Better performance  
✅ Easier to debug  


