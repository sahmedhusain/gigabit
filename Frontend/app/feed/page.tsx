'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import HomeFeed from '@/components/dashboard/HomeFeed'
import CreatePost from '@/components/dashboard/CreatePost'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { api, NetworkError, AuthenticationError } from '@/lib/api'
import { getToken } from '@/lib/api'
import { ApiClient, CreatePostRequest, ValidationError, Post } from '@/lib/api'

function FeedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { success, error } = useToast()

  // Get filter from URL params
  const filterParam = searchParams.get('filter') || 'all'
  const [feedSubTab, setFeedSubTab] = useState(filterParam)
  const [showCreatePost, setShowCreatePost] = useState(false)

  // Post Creation State
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostImage, setNewPostImage] = useState<File | null>(null)
  const [postPrivacy, setPostPrivacy] = useState<'public' | 'followers' | 'friends' | 'listed'>('public')
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [availableUsers, setAvailableUsers] = useState<{ id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; display_name?: string; }[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Data State
  const [posts, setPosts] = useState<Post[]>([])

  // Update URL when filter changes
  useEffect(() => {
    const newUrl = feedSubTab === 'all' ? '/feed' : `/feed?filter=${feedSubTab}`
    router.replace(newUrl)
  }, [feedSubTab, router])

  const fetchFeedPosts = useCallback(async () => {
    try {
      // setIsLoadingPosts(true)
      console.log('Fetching feed posts...')
      const response = await api.getFeed(20, 0)
      console.log('Feed API response:', response)
      const respRec = response as Record<string, unknown>
      const postsArr = Array.isArray(respRec['data'] as unknown) ? respRec['data'] as unknown[] : [];

      if (!postsArr.length) {
        setPosts([])
        return
      }

      const mappedPosts = postsArr.map((post: unknown) => {
        const p = post as Record<string, unknown>
        const userObj = p['user'] as Record<string, unknown> | undefined
        const imageUrl = typeof p['image_url'] === 'string' ? String(p['image_url']) : undefined

        return {
          id: Number(p['id']) || 0,
          user: {
            name: userObj ? `${String(userObj['first_name'] ?? '')} ${String(userObj['last_name'] ?? '')}` : 'Unknown',
            username: userObj ? String(userObj['nickname'] ?? userObj['email'] ?? '').split('@')[0] : 'unknown',
            avatar: userObj ? String(userObj['avatar'] ?? '') : ''
          },
          content: typeof p['content'] === 'string' ? String(p['content']) : '',
          image: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${imageUrl}`) : undefined,
          likes: Number(p['like_count']) || 0,
          comments: Number(p['comment_count']) || 0,
          shares: 0,
          timeAgo: formatTimeAgo(String(p['created_at'] ?? '')),
          privacy: String(p['privacy'] ?? ''),
          isLiked: Boolean(p['is_liked'])
        }
      })

      setPosts(mappedPosts)
    } catch (err) {
      console.error('Error fetching posts:', err)
      if (err instanceof NetworkError) {
        error('Failed to load posts. Please check your connection.')
      } else if (err instanceof AuthenticationError) {
        error('Please log in again to continue.')
      } else {
        error('Unable to load posts right now.')
      }
    } finally {
      // setIsLoadingPosts(false)
    }
  }, [error])

  // Fetch data when component loads
  useEffect(() => {
    if (user) {
      fetchFeedPosts()
      fetchUsers()
    }
  }, [user, fetchFeedPosts])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const data = await api.getUsers()
      setAvailableUsers(data.users || [])
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return date.toLocaleDateString()
  }

  const handleCreatePost = async () => {
    const validation = ApiClient.validatePostContent(newPostContent)
    if (!validation.isValid) {
      error(validation.error || 'Invalid post content')
      return
    }

    try {
      let imageUrl = '';

      if (newPostImage) {
        const formData = new FormData();
        formData.append('image', newPostImage);
        const token = getToken();

        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/uploads`, {
          method: 'POST',
          body: formData,
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          credentials: 'include'
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = `/api/images/${uploadData.filename}`;
        } else {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Failed to upload image');
        }
      }

      const postData: CreatePostRequest = {
        content: newPostContent,
        privacy: postPrivacy, // Use the privacy value directly (public, followers, friends, listed)
        image_url: imageUrl
      }

      if (postPrivacy === 'listed' && selectedUsers.length > 0) {
        postData.specific_user_ids = selectedUsers
      }

      await api.createPost(postData)
      setNewPostContent('')
      setNewPostImage(null)
      setPostPrivacy('public')
      setSelectedUsers([])
      setShowCreatePost(false)
      success('Post created successfully!')
      fetchFeedPosts()
    } catch (err) {
      console.error('Error creating post:', err)
      if (err instanceof ValidationError) {
        error(err.message)
      } else if (err instanceof NetworkError) {
        error('Failed to create post. Please try again.')
      } else {
        error('Unable to create post right now.')
      }
    }
  }

  const handleLikePost = async (postId: number) => {
    try {
      const post = posts.find((p: Post) => p.id === postId)
      const wasLiked = post?.isLiked || false

      if (wasLiked) {
        await api.unlikePost(postId)
      } else {
        await api.likePost(postId)
      }

      setPosts(posts.map((p: Post) =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: p.likes + (wasLiked ? -1 : 1) }
          : p
      ))
    } catch (err) {
      console.error('Error toggling like:', err)
      setPosts(posts.map((p: Post) =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: p.likes + (p.isLiked ? -1 : 1) }
          : p
      ))
      error('Unable to update like right now.')
    }
  }

  const handleBookmarkPost = async (postId: number) => {
    try {
      const post = posts.find((p: Post) => p.id === postId)
      const wasBookmarked = post?.isBookmarked || false

      if (wasBookmarked) {
        await api.unbookmarkPost(postId)
      } else {
        await api.toggleBookmark(postId)
      }

      setPosts(posts.map((p: Post) =>
        p.id === postId
          ? { ...p, isBookmarked: !p.isBookmarked }
          : p
      ))
    } catch (err) {
      console.error('Error toggling bookmark:', err)
      setPosts(posts.map((p: Post) =>
        p.id === postId
          ? { ...p, isBookmarked: !p.isBookmarked }
          : p
      ))
      error('Unable to update bookmark right now.')
    }
  }

  return (
    <AppLayout 
      activeTab="feed"
      feedSubTab={feedSubTab}
      setFeedSubTab={setFeedSubTab}
    >
      <CreatePost
        show={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        newPostContent={newPostContent}
        setNewPostContent={setNewPostContent}
        newPostImage={newPostImage}
        setNewPostImage={setNewPostImage}
        postPrivacy={postPrivacy}
        setPostPrivacy={setPostPrivacy}
        selectedUsers={selectedUsers}
        setSelectedUsers={setSelectedUsers}
        availableUsers={availableUsers}
        loadingUsers={loadingUsers}
        onCreatePost={handleCreatePost}
      />

      <HomeFeed
        posts={posts}
        onPostLike={handleLikePost}
        onPostBookmark={handleBookmarkPost}
        showCreatePost={showCreatePost}
        setShowCreatePost={setShowCreatePost}
        newPostContent={newPostContent}
        setNewPostContent={setNewPostContent}
        newPostImage={newPostImage}
        setNewPostImage={setNewPostImage}
        postPrivacy={postPrivacy}
        setPostPrivacy={setPostPrivacy}
        selectedUsers={selectedUsers}
        setSelectedUsers={setSelectedUsers}
        availableUsers={availableUsers}
        loadingUsers={loadingUsers}
        onCreatePost={handleCreatePost}
        feedSubTab={feedSubTab}
      />
    </AppLayout>
  )
}

// Wrap the entire component with ProtectedRoute
function ProtectedFeedPage() {
  return (
    <ProtectedRoute>
      <FeedPage />
    </ProtectedRoute>
  )
}

export default ProtectedFeedPage
