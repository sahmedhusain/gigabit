'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, type ConversationResponse } from '@/lib/api'
import { useToast } from '@/context/ToastContext'

export function useConversations() {
  const { error } = useToast()
  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getConversations()
      setConversations(res.conversations || [])
    } catch (e: any) {
      setErr(e?.message || 'Failed to load conversations')
      error('Failed to load conversations.')
    } finally {
      setLoading(false)
    }
  }, [error])

  useEffect(() => { refetch() }, [refetch])

  return useMemo(() => ({ conversations, loading, error: err, refetch }), [conversations, loading, err, refetch])
}
