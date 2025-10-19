'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, type PostResponse } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import { useWebSocket } from '@/context/WebSocketContext'

export interface FeedItem {
  id: number
  user: { name: string; username: string; avatar: string }
  content: string
  image?: string
  likes: number
  comments: number
  shares: number
  timeAgo: string
  privacy: string
  isLiked: boolean
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return date.toLocaleDateString()
}

export function useFeed(options: { pageSize?: number; autoRefresh?: boolean } = {}) {
  const { error } = useToast()
  const { addMessageListener, isConnected } = useWebSocket()
  const pageSize = options.pageSize ?? 20

  const [items, setItems] = useState<FeedItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const mapPost = useCallback((post: PostResponse): FeedItem => ({
    id: post.id,
    user: {
      name: `${post.user.first_name} ${post.user.last_name}`,
      username: post.user.nickname || post.user.email.split('@')[0],
      avatar: post.user.avatar
    },
    content: post.content,
    image: post.image_url,
    likes: post.like_count,
    comments: post.comment_count,
    shares: post.share_count,
    timeAgo: formatTimeAgo(post.created_at),
    privacy: post.privacy,
    isLiked: post.is_liked
  }), [])

  const fetchPage = useCallback(async (reset = false) => {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      const nextOffset = reset ? 0 : offset
      const resp = await api.getFeed(pageSize, nextOffset)
      const arr = Array.isArray(resp.data) ? resp.data : []
      const mapped = arr.map(mapPost)
      setItems(prev => reset ? mapped : [...prev, ...mapped])
      setHasMore(mapped.length === pageSize)
      if (reset) setOffset(pageSize)
      else setOffset(prev => prev + mapped.length)
    } catch (e: any) {
      const msg = e?.message || 'Failed to load feed'
      setErrorMessage(msg)
      error('Failed to load feed.')
    } finally {
      setIsLoading(false)
    }
  }, [pageSize, offset, mapPost, error])

  const refresh = useCallback(async () => {
    await fetchPage(true)
  }, [fetchPage])

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return
    await fetchPage(false)
  }, [hasMore, isLoading, fetchPage])

  // Auto refresh on realtime updates
  useEffect(() => {
    if (!options.autoRefresh) return
    const remove = addMessageListener((msg) => {
      if (msg.type === 'post_update' || msg.type === 'like_update' || msg.type === 'like') {
        // Light refresh
        refresh()
      }
    })
    return remove
  }, [addMessageListener, options.autoRefresh, isConnected, refresh])

  // Initial load
  useEffect(() => {
    fetchPage(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return useMemo(() => ({
    items,
    isLoading,
    error: errorMessage,
    hasMore,
    refresh,
    loadMore,
    setItems,
  }), [items, isLoading, errorMessage, hasMore, refresh, loadMore])
}
