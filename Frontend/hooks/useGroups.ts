'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, type GroupResponse, type CreateGroupRequest } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'

export function useGroups() {
  const { user } = useAuth()
  const { error, success } = useToast()
  const [groups, setGroups] = useState<GroupResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const res = await api.getUserGroups(user.id)
      const dataAny: any = res
      const arr: GroupResponse[] = Array.isArray(dataAny?.data) ? dataAny.data : (Array.isArray(dataAny?.groups) ? dataAny.groups : [])
      
      
      const groupsWithRoles = await Promise.all(
        arr.map(async (group) => {
          try {
            const roleData = await api.getUserRole(group.id)
            return { ...group, role: roleData.role as 'admin' | 'member' | 'creator' | undefined, is_admin_or_creator: roleData.is_admin_or_creator }
          } catch {
            return group
          }
        })
      )
      
      setGroups(groupsWithRoles)
    } catch (e: any) {
      const msg = e?.message || 'Failed to load groups'
      setErr(msg)
      error('Failed to load groups!')
    } finally {
      setLoading(false)
    }
  }, [user, error])

  const create = useCallback(async (payload: CreateGroupRequest) => {
    const res = await api.createGroup(payload)
    success('Group created!')
    await refetch()
    return res
  }, [refetch, success])

  const join = useCallback(async (groupId: number) => {
    await api.joinGroup(groupId)
    success('Join request sent!')
    await refetch()
  }, [refetch, success])

  const leave = useCallback(async (groupId: number) => {
    await api.leaveGroup(groupId)
    success('Left group!')
    await refetch()
  }, [refetch, success])

  useEffect(() => { refetch() }, [refetch])

  return useMemo(() => ({ groups, loading, error: err, refetch, create, join, leave }), [groups, loading, err, refetch, create, join, leave])
}
