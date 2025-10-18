'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import HomeFeed from '@/components/dashboard/HomeFeed'
import CreatePost from '@/components/dashboard/CreatePost'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { api, NetworkError, AuthenticationError, ValidationError, PostResponse } from '@/lib/api'
import { getToken } from '@/lib/api'
import { ApiClient, CreatePostRequest, Post } from '@/lib/api'

function FeedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { success, error } = useToast()

  // Get filter from URL params
  const filterParam = searchParams.get('filter') || 'all'
  const sortParam = searchParams.get('sort') || 'newest'
  const [feedSubTab, setFeedSubTab] = useState(filterParam)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>(sortParam as 'newest' | 'oldest')
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
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMoreResults, setHasMoreResults] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Scroll position preservation
  const resultsContainerRef = useRef<HTMLDivElement>(null)

  // Update URL when filter or sort changes
  useEffect(() => {
    const params = new URLSearchParams()
    if (feedSubTab !== 'all') params.set('filter', feedSubTab)
    if (sortOrder !== 'newest') params.set('sort', sortOrder)
    const newUrl = params.toString() ? `/feed?${params.toString()}` : '/feed'
    router.replace(newUrl)
  }, [feedSubTab, sortOrder, router])

  const fetchFeedPosts = useCallback(async (page: number = 0, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true)
      }
      console.log('Fetching feed posts with params...', { page, append, filter: feedSubTab })
      let response: { posts: PostResponse[]; limit: number; offset: number }
      if (feedSubTab === 'following') {
        response = await api.getFollowingFeed(20, page * 20)
      } else if (feedSubTab === 'friends') {
        response = await api.getFriendsFeed(20, page * 20)
      } else {
        response = await api.getFeed(20, page * 20)
      }

      if (!response.posts || response.posts.length === 0) {
        if (!append) {
          setPosts([])
        }
        setHasMoreResults(false)
        return
      }

      const mappedPosts = response.posts.map((post: any) => {
        const userObj = post.user
        const imageUrl = typeof post.image_url === 'string' ? String(post.image_url) : undefined

        return {
          id: Number(post.id) || 0,
          user: {
            id: userObj ? Number(userObj.id ?? 0) : 0,
            name: userObj ? `${String(userObj.first_name ?? '')} ${String(userObj.last_name ?? '')}` : 'Unknown',
            username: userObj ? String(userObj.nickname ?? userObj.email ?? '').split('@')[0] : 'unknown',
            avatar: userObj ? String(userObj.avatar ?? '') : ''
          },
          content: typeof post.content === 'string' ? String(post.content) : '',
          image: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${imageUrl}`) : undefined,
          likes: Number(post.like_count) || 0,
          comments: Number(post.comment_count) || 0,
          shares: 0,
          timeAgo: formatTimeAgo(String(post.created_at ?? '')),
          privacy: String(post.privacy ?? ''),
          isLiked: Boolean(post.is_liked),
          created_at: String(post.created_at ?? '')
        }
      })

      if (append) {
        setPosts(prevPosts => [...prevPosts, ...mappedPosts])
        setCurrentPage(page)
      } else {
        setPosts(mappedPosts)
        setCurrentPage(0)
      }

      // If fewer posts than page size, no more results
      setHasMoreResults(mappedPosts.length === 20)
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
      setIsLoadingMore(false)
    }
  }, [error])

  // Fetch data when component loads or filter changes
  useEffect(() => {
    if (user) {
      fetchFeedPosts(0, false) // Reset to first page
      fetchUsers()
    }
  }, [user, feedSubTab, sortOrder, fetchFeedPosts])

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMoreResults && resultsContainerRef.current) {
      // Save current scroll position
      const scrollTop = resultsContainerRef.current.scrollTop

      fetchFeedPosts(currentPage + 1, true).then(() => {
        // Restore scroll position after new posts are loaded
        requestAnimationFrame(() => {
          if (resultsContainerRef.current) {
            resultsContainerRef.current.scrollTop = scrollTop
          }
        })
      })
    }
  }, [currentPage, hasMoreResults, isLoadingMore, fetchFeedPosts])

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
    } catch (err: unknown) {
      console.error('Error creating post:', err)
      if (err instanceof ValidationError) {
        error(err.message)
      } else if (err instanceof NetworkError) {
        error('Failed to create post. Please try again.')
      } else if (err instanceof Error) {
        error(err.message)
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
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        hasMoreResults={hasMoreResults}
        isLoadingMore={isLoadingMore}
        onLoadMore={handleLoadMore}
        resultsContainerRef={resultsContainerRef}
      />
    </AppLayout>
  )
}

// Wrap the entire component with ProtectedRoute
export default function ProtectedFeedPage() {
  return (
    <ProtectedRoute>
      <FeedPage />
    </ProtectedRoute>
  )
}
