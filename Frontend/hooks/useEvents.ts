'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, type EventResponse, type CreateEventRequest, type UpdateEventRequest } from '@/lib/api'
import { useToast } from '@/context/ToastContext'

export function useEvents(groupId?: number) {
  const { error, success } = useToast()
  const [events, setEvents] = useState<EventResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      const res = groupId != null
        ? await api.getGroupEvents(groupId)
        : await api.getUserEvents()
      const eventsArr = Array.isArray((res as any).events) ? (res as any).events : Array.isArray((res as any).data) ? (res as any).data : []
      setEvents(eventsArr)
    } catch (e: any) {
      setErr(e?.message || 'Failed to load events')
      error('Failed to load events.')
    } finally {
      setLoading(false)
    }
  }, [groupId, error])

  const create = useCallback(async (gid: number, payload: CreateEventRequest) => {
    const res = await api.createEvent(gid, payload)
    success('Event created')
    await refetch()
    return res
  }, [refetch, success])

  const update = useCallback(async (eventId: number, payload: UpdateEventRequest) => {
    const res = await api.updateEvent(eventId, payload)
    success('Event updated')
    await refetch()
    return res
  }, [refetch, success])

  const remove = useCallback(async (eventId: number) => {
    const res = await api.cancelEvent(eventId, { cancel_reason: 'Deleted by user' })
    success('Event deleted')
    await refetch()
    return res
  }, [refetch, success])

  const respond = useCallback(async (eventId: number, option: 'going' | 'not_going') => {
    const res = await api.respondToEvent(eventId, option)
    await refetch()
    return res
  }, [refetch])

  useEffect(() => { refetch() }, [refetch])

  return useMemo(() => ({ events, loading, error: err, refetch, create, update, remove, respond }), [events, loading, err, refetch, create, update, remove, respond])
}
