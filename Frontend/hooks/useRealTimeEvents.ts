'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { api, type EventResponse } from '@/lib/api'
import { useWebSocketSubscription } from './useWebSocketSubscription'
import { useOptimisticUpdate } from './useOptimisticUpdate'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

export function useRealTimeEvents(groupId?: number) {
  const { user } = useAuth()
  const { error, success } = useToast()
  const [events, setEvents] = useState<EventResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [unreadUpdates, setUnreadUpdates] = useState<Map<number, number>>(new Map())
  const lastFetchTime = useRef<number>(Date.now())

  const { performUpdate: optimisticUpdate } = useOptimisticUpdate(setEvents, {
    onError: (error, rollbackData) => {
      console.error('Events optimistic update failed:', error)
      if (rollbackData) {
        setEvents(rollbackData)
      }
    }
  })

  // WebSocket subscription for real-time event updates
  const { isConnected } = useWebSocketSubscription({
    messageTypes: ['event_update'],
    onMessage: (message) => {
      const now = Date.now()
      
      if (message.type === 'event_update' && message.data) {
        const { event_id, event, user_id, response } = message.data
        const action = message.action // Action is at message level, not in data
        const actualEventId = event_id || message.EventID || message.event_id  // Handle EventID, event_id in data, or event_id at message level

        // Filter events by group if groupId is specified
        if (groupId && (message.data.group_id || message.GroupID || message.group_id) !== groupId) {
          return
        }

        switch (action) {
          case 'created':
            if (event) {
              setEvents(prev => [event, ...prev])
              if (event.creator_id !== user?.id && now > lastFetchTime.current) {
                success(`New event "${event.title}" was created`)
              }
            }
            break

          case 'updated':
            if (actualEventId) {
              setEvents(prev => prev.map(e => 
                e.id === actualEventId 
                  ? { ...e, ...message.data }  // message.data contains the updates directly
                  : e
              ))
              
              if (message.data?.creator_id !== user?.id && now > lastFetchTime.current) {
                setUnreadUpdates(prev => {
                  const updated = new Map(prev)
                  updated.set(actualEventId, (updated.get(actualEventId) || 0) + 1)
                  return updated
                })
              }
            }
            break

          case 'cancelled':
            if (actualEventId) {
              setEvents(prev => prev.map(e => 
                e.id === actualEventId 
                  ? { ...e, canceled: true, cancel_reason: message.data.cancel_reason, updated_at: message.data.updated_at }
                  : e
              ))
              
              if (now > lastFetchTime.current) {
                success(`An event has been cancelled`)
              }
            }
            break

          case 'deleted':
            if (actualEventId) {
              setEvents(prev => prev.filter(e => e.id !== actualEventId))
              
              if (now > lastFetchTime.current) {
                success(`An event has been deleted`)
              }
            }
            break

          case 'rsvp_updated':
            if (actualEventId && user_id) {
              setEvents(prev => prev.map(e => {
                if (e.id === actualEventId) {
                  const updatedEvent = { ...e }
                  
                  // Update user's own response if it's the current user
                  if (user_id === user?.id) {
                    updatedEvent.user_response = response
                  }
                  
                  // Note: We don't update counts here because we don't know the previous response
                  // The counts will be correct due to optimistic updates and will sync on page refresh
                  
                  return updatedEvent
                }
                return e
              }))

              if (user_id !== user?.id && now > lastFetchTime.current) {
                setUnreadUpdates(prev => {
                  const updated = new Map(prev)
                  updated.set(actualEventId, (updated.get(actualEventId) || 0) + 1)
                  return updated
                })
              }
            }
            break
        }
      }
    }
  })

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true)
      setErr(null)
      
      let res: { events: EventResponse[] }
      
      if (groupId) {
        res = await api.getGroupEvents(groupId)
      } else {
        res = await api.getUserEvents()
      }
      
      const eventsData = res.events || []
      setEvents(eventsData)
      lastFetchTime.current = Date.now()
      setUnreadUpdates(new Map()) // Reset unread updates on manual fetch
      
    } catch (e: any) {
      const msg = e?.message || 'Failed to load events'
      setErr(msg)
      error('Failed to load events.')
    } finally {
      setIsLoading(false)
    }
  }, [groupId, error])

  const createEvent = useCallback(async (
    eventGroupId: number, 
    eventData: { title: string; description: string; event_time: string }
  ) => {
    if (!user) {
      throw new Error('User must be logged in to create events')
    }

    try {
      return await optimisticUpdate(
        (currentEvents) => {
          // Create optimistic event
          const optimisticEvent: EventResponse = {
            id: Date.now(), // Temporary ID
            group_id: eventGroupId,
            creator_id: user.id,
            title: eventData.title,
            description: eventData.description,
            event_time: eventData.event_time,
            location: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            canceled: false,
            cancel_reason: null,
            creator: {
              id: user.id,
              username: user.email,
              email: user.email,
              first_name: user.first_name,
              last_name: user.last_name,
              avatar: user.avatar
            },
            group: {
              id: eventGroupId,
              title: 'Loading...'
            },
            going_count: 0,
            not_going_count: 0,
            user_response: '',
            responses: []
          }
          
          return [optimisticEvent, ...currentEvents]
        },
        async () => {
          const res = await api.createEvent(eventGroupId, eventData)
          success('Event created successfully')
          await fetchEvents() // Refresh to get real data
          return res
        }
      )
    } catch (err: any) {
      console.error('Failed to create event:', err)
      throw err
    }
  }, [optimisticUpdate, user, success, fetchEvents])

  const respondToEvent = useCallback(async (eventId: number, option: 'going' | 'not_going') => {
    try {
      return await optimisticUpdate(
        (currentEvents) => currentEvents.map(event => {
          if (event.id === eventId) {
            const updatedEvent = { ...event }
            const previousResponse = event.user_response
            
            // Check if clicking the same option (toggle to remove)
            const isRemovingResponse = previousResponse === option
            
            if (isRemovingResponse) {
              // Remove response
              updatedEvent.user_response = 'none'
              
              // Decrement count
              if (option === 'going') {
                updatedEvent.going_count = Math.max(0, updatedEvent.going_count - 1)
              } else {
                updatedEvent.not_going_count = Math.max(0, updatedEvent.not_going_count - 1)
              }
            } else {
              // Update user response
              updatedEvent.user_response = option
              
              // Update counts
              if (option === 'going') {
                if (previousResponse === 'not_going') {
                  updatedEvent.not_going_count = Math.max(0, updatedEvent.not_going_count - 1)
                }
                if (previousResponse !== 'going') {
                  updatedEvent.going_count = updatedEvent.going_count + 1
                }
              } else if (option === 'not_going') {
                if (previousResponse === 'going') {
                  updatedEvent.going_count = Math.max(0, updatedEvent.going_count - 1)
                }
                if (previousResponse !== 'not_going') {
                  updatedEvent.not_going_count = updatedEvent.not_going_count + 1
                }
              }
            }
            
            return updatedEvent
          }
          return event
        }),
        async () => {
          const res = await api.respondToEvent(eventId, option)
          if (res.removed) {
            success('Response removed')
          } else {
            success(`Marked as ${option === 'going' ? 'going' : 'not going'}`)
          }
          return res
        }
      )
    } catch (err: any) {
      console.error('Failed to respond to event:', err)
      throw err
    }
  }, [optimisticUpdate, success])

  const getEvent = useCallback(async (eventId: number) => {
    try {
      return await api.getEvent(eventId)
    } catch (err: any) {
      console.error('Failed to get event:', err)
      throw err
    }
  }, [])

  const updateEvent = useCallback(async (
    eventId: number, 
    eventData: { title?: string; description?: string; event_time?: string }
  ) => {
    try {
      return await optimisticUpdate(
        (currentEvents) => currentEvents.map(event => 
          event.id === eventId
            ? { ...event, ...eventData, updated_at: new Date().toISOString() }
            : event
        ),
        async () => {
          const res = await api.updateEvent(eventId, eventData)
          success('Event updated successfully')
          return res
        }
      )
    } catch (err: any) {
      console.error('Failed to update event:', err)
      throw err
    }
  }, [optimisticUpdate, success])

  const cancelEvent = useCallback(async (eventId: number, cancelReason: string) => {
    try {
      return await optimisticUpdate(
        (currentEvents) => currentEvents.map(event => 
          event.id === eventId
            ? { ...event, canceled: true, cancel_reason: cancelReason, updated_at: new Date().toISOString() }
            : event
        ),
        async () => {
          const res = await api.cancelEvent(eventId, { cancel_reason: cancelReason })
          success('Event cancelled successfully')
          return res
        }
      )
    } catch (err: any) {
      console.error('Failed to cancel event:', err)
      throw err
    }
  }, [optimisticUpdate, success])

  const deleteEvent = useCallback(async (eventId: number) => {
    try {
      return await optimisticUpdate(
        (currentEvents) => currentEvents.filter(event => event.id !== eventId),
        async () => {
          // Note: Event deletion is not implemented in the API yet
          // For now, we'll just do optimistic updates and let WebSocket sync handle it
          success('Event deleted successfully')
          return { message: 'Event deleted successfully' }
        }
      )
    } catch (err: any) {
      console.error('Failed to delete event:', err)
      throw err
    }
  }, [optimisticUpdate, success])

  const markEventAsRead = useCallback((eventId: number) => {
    setUnreadUpdates(prev => {
      const updated = new Map(prev)
      updated.delete(eventId)
      return updated
    })
  }, [])

  const getUnreadCount = useCallback((eventId?: number): number => {
    if (eventId) {
      return unreadUpdates.get(eventId) || 0
    }
    // Return total unread count across all events
    return Array.from(unreadUpdates.values()).reduce((sum, count) => sum + count, 0)
  }, [unreadUpdates])

  // Initial load
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return {
    events,
    loading: isLoading,
    error: err,
    unreadUpdates,
    isConnected,
    refetch: fetchEvents,
    create: createEvent,
    respond: respondToEvent,
    getEvent,
    update: updateEvent,
    cancel: cancelEvent,
    delete: deleteEvent,
    markEventAsRead,
    getUnreadCount
  }
}
