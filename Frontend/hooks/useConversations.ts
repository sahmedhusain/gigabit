'use client'
import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { api, type ConversationResponse } from '@/lib/api'
import { useToast } from '@/context/ToastContext'

export function useConversations() {
  const { error: showError } = useToast()
  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const hasFetchedRef = useRef(false)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      setErr(null)
      const res = await api.getConversations()
      setConversations(res.conversations || [])
    } catch (e: any) {
      const errorMsg = e?.message || 'Failed to load conversations'
      setErr(errorMsg)
      showError('Failed to load conversations.')
    } finally {
      setLoading(false)
    }
  }, [showError])

  // Only fetch once on mount
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      refetch()
    }
  }, [refetch])

  return useMemo(() => ({ conversations, loading, error: err, refetch }), [conversations, loading, err, refetch])
}
