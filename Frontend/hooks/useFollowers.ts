'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, type User } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

export function useFollowers() {
  const { user } = useAuth()
  const { error } = useToast()
  const [followers, setFollowers] = useState<User[]>([])
  const [following, setFollowing] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const [foll, follg] = await Promise.all([
        api.getFollowers(user.id),
        api.getFollowing(user.id)
      ])
      setFollowers(Array.isArray(foll?.data) ? foll.data : [])
      setFollowing(Array.isArray(follg?.data) ? follg.data : [])
    } catch (e: any) {
      setErr(e?.message || 'Failed to load followers')
      error('Failed to load followers.')
    } finally {
      setLoading(false)
    }
  }, [user, error])

  useEffect(() => { refetch() }, [refetch])

  return useMemo(() => ({ followers, following, loading, error: err, refetch }), [followers, following, loading, err, refetch])
}
