import { useState, useEffect } from 'react'
import { api } from '@/lib/api' // Changed from apiClient to api

export function usePosts() {
  const [posts, setPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Fetching posts...')
      const response = await api.getPosts() // Changed from apiClient to api
      console.log('Posts response:', response)
      
      // Handle different response formats
      if (response && response.posts) {
        setPosts(Array.isArray(response.posts) ? response.posts : [])
      } else if (Array.isArray(response)) {
        // In case the API returns the posts array directly
        setPosts(response)
      } else {
        console.warn('Unexpected response format:', response)
        setPosts([])
      }
    } catch (err: any) {
      console.error('Failed to fetch posts:', err)
      
      // More detailed error handling
      if (err.response) {
        // Server responded with error status
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
        // Network error
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
      console.log('Creating post:', postData)
      const response = await api.createPost(postData) // Changed from apiClient to api
      console.log('Create post response:', response)
      
      // Handle different response formats
      let newPost = response.post || response
      
      if (newPost) {
        setPosts(prevPosts => [newPost, ...(prevPosts || [])])
      }
      
      return response
    } catch (err: any) {
      console.error('Failed to create post:', err)
      throw err
    }
  }

  const likePost = async (postId: number) => {
    try {
      console.log('Liking post:', postId)
      const response = await api.likePost(postId) // Changed from apiClient to api
      console.log('Like post response:', response)
      
      // Update the specific post in the array
      setPosts(prevPosts => 
        (prevPosts || []).map(post => 
          post.id === postId 
            ? { 
                ...post, 
                liked_by_user: !post.liked_by_user,
                like_count: post.liked_by_user 
                  ? Math.max(0, (post.like_count || 0) - 1)
                  : (post.like_count || 0) + 1
              }
            : post
        )
      )
      
      return response
    } catch (err: any) {
      console.error('Failed to like post:', err)
      throw err
    }
  }

  const refreshPosts = async () => {
    await fetchPosts()
  }

  // Only fetch posts when component mounts
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
