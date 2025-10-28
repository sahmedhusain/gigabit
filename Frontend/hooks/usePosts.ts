import { useState, useEffect } from 'react'
import { api } from '@/lib/api' 

export function usePosts() {
  const [posts, setPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await api.getPosts() 
      
      
      if (response && response.posts) {
        setPosts(Array.isArray(response.posts) ? response.posts : [])
      } else if (Array.isArray(response)) {
        
        setPosts(response)
      } else {
        setPosts([])
      }
    } catch (err: any) {
      console.error('Failed to fetch posts:', err)
      
      
      if (err.response) {
        
        const status = err.response.status
        if (status === 401) {
          setError('Please log in to view posts')
        } else if (status === 403) {
          setError('You do not have permission to view posts')
        } else if (status === 500) {
          setError('Server error. Please try again later.')
        } else {
          setError(`Error ${status}: ${err.response.data?.error || 'Failed to fetch posts'}`)
        }
      } else if (err.request) {
        
        setError('Network error. Please check your connection.')  
      } else {
        setError(err.message || 'Failed to fetch posts')
      }
      
      setPosts([])
    } finally {
      setIsLoading(false)
    }
  }

  const createPost = async (postData: any) => {
    try {
      const response = await api.createPost(postData) 
      
      
      const newPost = (response as any).post || response
      
      if (newPost) {
        setPosts(prevPosts => [newPost, ...(prevPosts || [])])
      }
      
      return response
    } catch (err: any) {
      console.error('Failed to create post:', err)
      throw err
    }
  }

  const likePost = async (post: { id: number; group_id?: number; liked_by_user?: boolean; like_count?: number }) => {
    try {
      const wasLiked = post.liked_by_user || false
      
      
      await api.toggleLike(post, !wasLiked)
      
      
      setPosts(prevPosts => 
        (prevPosts || []).map(p => 
          p.id === post.id 
            ? { 
                ...p, 
                liked_by_user: !wasLiked,
                like_count: wasLiked 
                  ? Math.max(0, (p.like_count || 0) - 1)
                  : (p.like_count || 0) + 1
              }
            : p
        )
      )
      
      return { success: true }
    } catch (err: any) {
      console.error('Failed to like post:', err)
      throw err
    }
  }

  const refreshPosts = async () => {
    await fetchPosts()
  }

  
  useEffect(() => {
    fetchPosts()
  }, [])

  return {
    posts,
    isLoading,
    error,
    createPost,
    likePost,
    refreshPosts
  }
}
