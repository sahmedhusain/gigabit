'use client'
import Image from 'next/image'
import { User, Lock, Globe, MessageSquare, Edit, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2, EyeOff, UserPlus, UserMinus, X, UserX, Mail, Calendar, CalendarDays, FileText, Plus, Users, Search, Venus, Mars } from 'lucide-react'
import { Post } from '@/types/posts'
import { api, CreatePostRequest, User as ApiUser } from '@/lib/api'
import { useRealTimePosts, useFollowers, useConnectionStatus, useFollowerCounts } from '@/hooks'
import { getAvatarUrl, getUserInitials } from '@/utils/avatarUtils'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { WebSocketMessage } from '@/types/contexts'
import FollowHandler, { getFollowStatusFromAPI } from './FollowHandler'
import { FollowStatus } from '@/types/profile'
import ManagePrivacy from './ManagePrivacy'
import SharePopup from '../ui/SharePopup'
import CreatePost from '../posts/CreatePost'
import ImagePreviewModal from '../ui/ImagePreviewModal'
import { UserOption, FollowWebSocketData, ProfileSectionProps } from '@/types/profile'
import { motion, AnimatePresence } from 'framer-motion'

export default function ProfileSection({
  currentUser,
  followers,
  following,
  posts,
  isOwnProfile = true,
  showPrivacyOverlay = false,
  initialFollowerCount,
  initialFollowingCount,
  onPostLike,
  onPostBookmark,
  onPostPrivacyUpdate
}: ProfileSectionProps) {
  const router = useRouter()
  const { isConnected } = useRealTimePosts()
  const { followers: liveFollowers, following: liveFollowing } = useFollowers()
  const { isConnected: connectionStatus } = useConnectionStatus()
  const { followerCounts, isConnected: countsConnected } = useFollowerCounts(
    followers?.length || 0,
    following?.length || 0
  )

  
  const [followStatus, setFollowStatus] = useState<FollowStatus>({
    isFollowing: false,
    isPending: false,
    isFollowedBy: false,
    status: 'not_following'
  })

  
  useEffect(() => {
    if (!onPostLike || !onPostBookmark) {
      setLocalPosts(posts)
    }
  }, [posts, onPostLike, onPostBookmark])

  
  const [showPrivacyConfirm, setShowPrivacyConfirm] = useState(false)
  const [showPrivateConfirm, setShowPrivateConfirm] = useState(false)
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false)
  const [currentPrivacySetting, setCurrentPrivacySetting] = useState(currentUser?.isPrivate || false)
  const { success, error } = useToast()
  
  
  const [activeTab, setActiveTab] = useState<'posts' | 'following' | 'followers'>('posts')
  const [tabData, setTabData] = useState<{ following: ApiUser[], followers: ApiUser[] }>({ following: [], followers: [] })
  const [isLoadingTabData, setIsLoadingTabData] = useState(false)

  
  const [followRelationships, setFollowRelationships] = useState<{[userId: number]: {isFollowing: boolean, isFollowedBy: boolean, isPending?: boolean}}>({})
  const [isUpdatingFollow, setIsUpdatingFollow] = useState<{[userId: number]: boolean}>({})

  
  const [openMenu, setOpenMenu] = useState<{[postId: number]: boolean}>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{[postId: number]: boolean}>({})
  const [isDeleting, setIsDeleting] = useState<{[postId: number]: boolean}>({})
  const [showManagePrivacy, setShowManagePrivacy] = useState<{[postId: number]: boolean}>({})
  const [currentSelectedUsers, setCurrentSelectedUsers] = useState<{[postId: number]: number[]}>({})


  
  const [localPosts, setLocalPosts] = useState<Post[]>(posts)

  
  const [sharePost, setSharePost] = useState<Post | null>(null)

  
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<{ userId: number; userName: string } | null>(null)
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState<{ userId: number; userName: string } | null>(null)
  const [showProfileUnfollowConfirm, setShowProfileUnfollowConfirm] = useState<{ userId: number; userName: string } | null>(null)
  const [showListUnfollowConfirm, setShowListUnfollowConfirm] = useState<{ userId: number; userName: string } | null>(null)

  
  const [sortOption, setSortOption] = useState<'latest' | 'oldest' | 'most_comments' | 'most_likes'>('latest')
  const [privacyFilter, setPrivacyFilter] = useState<'all' | 'public' | 'followers' | 'friends' | 'listed'>('all')

  
  const [followingSort, setFollowingSort] = useState<'latest' | 'oldest'>('latest')
  const [followersSort, setFollowersSort] = useState<'latest' | 'oldest'>('latest')

  
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostImage, setNewPostImage] = useState<File | null>(null)
  const [postPrivacy, setPostPrivacy] = useState<'public' | 'followers' | 'friends' | 'listed'>('public')
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [availableUsers, ] = useState<UserOption[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  
  const [imagePreviewState, setImagePreviewState] = useState<{
    isOpen: boolean;
    imageUrl: string;
    alt: string;
  }>({
    isOpen: false,
    imageUrl: '',
    alt: ''
  })

  // Chat functionality
  const { user: currentUserAuth } = useAuth()
  const { sendMessage, addMessageListener } = useWebSocket()

  // Fetch follow status on mount for other users' profiles
  useEffect(() => {
    if (!isOwnProfile && currentUser) {
      
      api.getFollowStatus(currentUser.id).then((status) => {
        setFollowStatus(getFollowStatusFromAPI(
          status.is_following,
          status.status,
          status.is_followed_by
        ))
      }).catch((error) => {
        console.error('Failed to get follow status:', error)
      })
    }
  }, [isOwnProfile, currentUser])

  
  useEffect(() => {
    if (!currentUser) return

    const removeListener = addMessageListener((message: WebSocketMessage) => {
      if (message.type === 'follow_update' && message.data) {
        const data = message.data as FollowWebSocketData

        
        if (data.action === 'follow' && data.follower_id === currentUser.id) {
          
          const newUser: ApiUser = {
            id: data.user_id,
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            nickname: data.nickname || '',
            email: data.email || '',
            avatar: data.avatar || '',
            is_private: data.is_private || false,
            created_at: data.created_at || '',
            about_me: data.about_me || '',
            date_of_birth: data.date_of_birth || '',
            updated_at: new Date().toISOString(),
            gender: '', // Default empty
            status: 'online', 
            last_status_change: new Date().toISOString(),
            gender_privacy: 'everyone', 
            birthday_privacy: 'everyone' 
          }
          setTabData(prev => ({
            ...prev,
            following: [...prev.following, newUser]
          }))
          setFollowRelationships(prev => ({
            ...prev,
            [data.user_id]: { 
              isFollowing: true, 
              isFollowedBy: data.is_followed_by || false,
              isPending: false  
            }
          }))
        } else if (data.action === 'unfollow' && data.follower_id === currentUser.id) {
          
          setTabData(prev => ({
            ...prev,
            following: prev.following.filter((user: Partial<ApiUser>) => user.id !== data.user_id)
          }))
          setFollowRelationships(prev => {
            const newRelationships = { ...prev }
            delete newRelationships[data.user_id]
            return newRelationships
          })
        }

        
        if (data.action === 'follow' && data.user_id === currentUser.id) {
          
          const newUser: ApiUser = {
            id: data.follower_id!,
            first_name: data.follower_first_name || '',
            last_name: data.follower_last_name || '',
            nickname: data.follower_nickname || '',
            email: data.follower_email || '',
            avatar: data.follower_avatar || '',
            is_private: data.follower_is_private || false,
            created_at: data.follower_created_at || '',
            about_me: data.follower_about_me || '',
            date_of_birth: data.follower_date_of_birth || '',
            updated_at: new Date().toISOString(),
            gender: '', // Default empty
            status: 'online', 
            last_status_change: new Date().toISOString(),
            gender_privacy: 'everyone', 
            birthday_privacy: 'everyone' 
          }
          setTabData(prev => ({
            ...prev,
            followers: [...prev.followers, newUser]
          }))
          setFollowRelationships(prev => ({
            ...prev,
            [data.follower_id]: { 
              isFollowing: data.is_following_back || false, 
              isFollowedBy: true,
              isPending: false  
            }
          }))
        } else if (data.action === 'unfollow' && data.user_id === currentUser.id) {
          
          setTabData(prev => ({
            ...prev,
            followers: prev.followers.filter((user: Partial<ApiUser>) => user.id !== data.follower_id)
          }))
          setFollowRelationships(prev => {
            const newRelationships = { ...prev }
            delete newRelationships[data.follower_id]
            return newRelationships
          })
        }

        
        if (data.action === 'accept' && data.user_id === currentUser.id) {
          
          setFollowRelationships(prev => ({
            ...prev,
            [data.follower_id]: { 
              isFollowing: true,  
              isFollowedBy: true, 
              isPending: false    
            }
          }))
        }

        
        if (data.action === 'accept' && data.follower_id === currentUser.id) {
          
          setFollowRelationships(prev => ({
            ...prev,
            [data.user_id]: { 
              isFollowing: true,  
              isFollowedBy: data.is_followed_by || false,
              isPending: false    
            }
          }))
        }
      }
    })

    return removeListener
  }, [currentUser, addMessageListener])

  
  const handleFollowStatusChange = (newStatus: FollowStatus) => {
    setFollowStatus(newStatus)
  }

  
  const handleProfileUnfollowConfirm = (userId: number, userName: string) => {
    setShowProfileUnfollowConfirm({ userId, userName })
  }

  
  const handleListUnfollowConfirm = (userId: number, userName: string) => {
    setShowListUnfollowConfirm({ userId, userName })
  }

  
  const handleConfirmedProfileUnfollow = async () => {
    if (!showProfileUnfollowConfirm) return

    
    const newStatus: FollowStatus = {
      isFollowing: false,
      isPending: false,
      isFollowedBy: followStatus.isFollowedBy,
      status: followStatus.isFollowedBy ? 'follow_back' : 'not_following'
    }
    setFollowStatus(newStatus)

    
    sendMessage({
      type: 'unfollow' as const,
      to: showProfileUnfollowConfirm.userId,
      action: 'unfollow',
      data: {
        user_id: showProfileUnfollowConfirm.userId,
        user_name: showProfileUnfollowConfirm.userName,
        is_private: currentUser?.isPrivate || currentUser?.is_private || false
      }
    })

    setShowProfileUnfollowConfirm(null)
  }

  
  const handleConfirmedListUnfollow = async () => {
    if (!showListUnfollowConfirm) return

    
    setFollowRelationships(prev => ({
      ...prev,
      [showListUnfollowConfirm.userId]: { 
        isFollowing: false, 
        isFollowedBy: prev[showListUnfollowConfirm.userId]?.isFollowedBy || false,
        isPending: false
      }
    }))

    
    sendMessage({
      type: 'unfollow' as const,
      to: showListUnfollowConfirm.userId,
      action: 'unfollow',
      data: {
        user_id: showListUnfollowConfirm.userId,
        user_name: showListUnfollowConfirm.userName,
        is_private: false 
      }
    })

    setShowListUnfollowConfirm(null)
  }

  
  const handleTabChange = async (tab: 'posts' | 'following' | 'followers') => {
    setActiveTab(tab)

    if (tab !== 'posts' && tabData[tab].length === 0 && !isLoadingTabData) {
      await loadTabData(tab)
    }
  }

  
  const loadTabData = async (tab: 'following' | 'followers') => {
    if (!currentUser) return

    setIsLoadingTabData(true)
    try {
      if (tab === 'followers') {
        const response = await api.getFollowers(currentUser.id)
        setTabData(prev => ({ ...prev, followers: response.followers || [] }))


        const relationships: { [key: number]: {isFollowing: boolean, isFollowedBy: boolean, isPending?: boolean} } = {}
        if (response.followers && response.followers.length > 0) {
          if (isOwnProfile) {
            
            const followStatusPromises = response.followers.map(async (user: ApiUser) => {
              try {
                const followStatus = await api.getFollowStatus(user.id)
                return { userId: user.id, isFollowing: followStatus.is_following, isFollowedBy: followStatus.is_followed_by, isPending: followStatus.is_pending }
              } catch (error) {
                console.warn(`Failed to get follow status for user ${user.id}:`, error)
                return { userId: user.id, isFollowing: false, isFollowedBy: false, isPending: false }
              }
            })

            const followStatuses = await Promise.all(followStatusPromises)
            followStatuses.forEach(({ userId, isFollowing, isFollowedBy, isPending }) => {
              relationships[userId] = { isFollowing, isFollowedBy, isPending }
            })
          } else {
            
            const followStatusPromises = response.followers.map(async (user: ApiUser) => {
              try {
                const followStatus = await api.getFollowStatus(user.id)
                return { userId: user.id, isFollowing: followStatus.is_following, isFollowedBy: followStatus.is_followed_by, isPending: followStatus.is_pending }
              } catch (error) {
                console.warn(`Failed to get follow status for user ${user.id}:`, error)
                return { userId: user.id, isFollowing: false, isFollowedBy: false, isPending: false }
              }
            })

            const followStatuses = await Promise.all(followStatusPromises)
            followStatuses.forEach(({ userId, isFollowing, isFollowedBy, isPending }) => {
              relationships[userId] = { isFollowing, isFollowedBy, isPending }
            })
          }
        }
        setFollowRelationships(relationships)
      } else {
        const response = await api.getFollowing(currentUser.id)
        setTabData(prev => ({ ...prev, following: response.following || [] }))

        
        const relationships: { [key: number]: {isFollowing: boolean, isFollowedBy: boolean, isPending?: boolean} } = {}
        if (response.following && response.following.length > 0) {
          if (isOwnProfile) {
            
            const followStatusPromises = response.following.map(async (user: ApiUser) => {
              try {
                const followStatus = await api.getFollowStatus(user.id)
                return { userId: user.id, isFollowing: followStatus.is_following, isFollowedBy: followStatus.is_followed_by, isPending: followStatus.is_pending }
              } catch (error) {
                console.warn(`Failed to get follow status for user ${user.id}:`, error)
                return { userId: user.id, isFollowing: false, isFollowedBy: false, isPending: false }
              }
            })

            const followStatuses = await Promise.all(followStatusPromises)
            followStatuses.forEach(({ userId, isFollowing, isFollowedBy, isPending }) => {
              relationships[userId] = { isFollowing, isFollowedBy, isPending }
            })
          } else {
            
            const followStatusPromises = response.following.map(async (user: ApiUser) => {
              try {
                const followStatus = await api.getFollowStatus(user.id)
                return { userId: user.id, isFollowing: followStatus.is_following, isFollowedBy: followStatus.is_followed_by, isPending: followStatus.is_pending }
              } catch (error) {
                console.warn(`Failed to get follow status for user ${user.id}:`, error)
                return { userId: user.id, isFollowing: false, isFollowedBy: false, isPending: false }
              }
            })

            const followStatuses = await Promise.all(followStatusPromises)
            followStatuses.forEach(({ userId, isFollowing, isFollowedBy, isPending }) => {
              relationships[userId] = { isFollowing, isFollowedBy, isPending }
            })
          }
        }
        setFollowRelationships(relationships)
      }
    } catch (err) {
      console.error(`Error loading ${tab}:`, err)
      error(`Failed to load ${tab}`)
    } finally {
      setIsLoadingTabData(false)
    }
  }

  
  const handleStartChat = () => {
    
    router.push(`/chats/all?user=${currentUser?.id}`)
  }

  
  const handleEditProfile = () => {
    router.push('/settings')
  }

  
  const handleUserFollowAction = async (userId: number, isCurrentlyFollowing: boolean) => {
    
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId

    
    if (!numericUserId || numericUserId <= 0 || !Number.isInteger(numericUserId)) {
      console.error('Invalid user ID:', userId)
      error('Invalid user ID')
      return
    }

    if (!currentUserAuth || isUpdatingFollow[numericUserId]) return

    setIsUpdatingFollow(prev => ({ ...prev, [numericUserId]: true }))

    try {
      
      if (followRelationships[numericUserId]?.isPending) {
        
        await api.unfollowUser(numericUserId)
        setFollowRelationships(prev => ({ ...prev, [numericUserId]: { ...prev[numericUserId], isFollowing: false, isPending: false } }))
        success('Request cancelled!')
      } else if (isCurrentlyFollowing) {
        
        await api.unfollowUser(numericUserId)
        setFollowRelationships(prev => ({ ...prev, [numericUserId]: { ...prev[numericUserId], isFollowing: false } }))
        success('Unfollowed!')
      } else {
        
        const response = await api.sendFollowRequest(numericUserId)
        if (response.status === 'pending') {
          
          setFollowRelationships(prev => ({ ...prev, [numericUserId]: { ...prev[numericUserId], isFollowing: false, isPending: true } }))
          success('Request sent!')
        } else {
          
          setFollowRelationships(prev => ({ ...prev, [numericUserId]: { ...prev[numericUserId], isFollowing: true, isPending: false } }))
          success('Following!')
        }
      }
    } catch (err: unknown) {
      console.error('Error updating follow status:', err)
      
      
      if (err instanceof Error && (err.name === 'ValidationError' || err.constructor?.name === 'ValidationError')) {
        error(err.message || 'Validation failed')
      } else {
        error('Failed to update follow status!')
      }
    } finally {
      setIsUpdatingFollow(prev => ({ ...prev, [numericUserId]: false }))
    }
  }

  
  const handleRemoveFollower = async (userId: number) => {
    
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId

    
    if (!numericUserId || numericUserId <= 0 || !Number.isInteger(numericUserId)) {
      console.error('Invalid user ID:', userId)
      error('Invalid user ID')
      return
    }

    if (!currentUser || isUpdatingFollow[numericUserId]) return

    setIsUpdatingFollow(prev => ({ ...prev, [numericUserId]: true }))

    try {
      
      await api.respondToFollowRequest(numericUserId, 'remove')
      
      
      setTabData(prev => ({
        ...prev,
        followers: prev.followers.filter((user: Partial<ApiUser>) => user.id !== numericUserId)
      }))
      
      success('Follower removed!')
    } catch (err: unknown) {
      console.error('Error removing follower:', err)
      
      
      if (err instanceof Error && (err.name === 'ValidationError' || err.constructor?.name === 'ValidationError')) {
        error(err.message || 'Validation failed')
      } else {
        error('Failed to remove follower!')
      }
    } finally {
      setIsUpdatingFollow(prev => ({ ...prev, [numericUserId]: false }))
    }
  }

  


  
  const canDeletePost = (post: Post) => {
    return currentUserAuth && currentUserAuth.id === post.user.id
  }

  
  const canSeeGender = () => {

    
    
    const genderValue = currentUser?.gender?.toLowerCase()?.trim()
    const isPreferNotToSay = genderValue === 'prefer_not_to_say' ||
                            genderValue === '' ||
                            genderValue === ' '

    if (isPreferNotToSay) {
      return false
    }

    // Always show for own profile
    if (isOwnProfile) {
      return true
    }

    // Don't show if gender is not set
    if (!currentUser?.gender) {
      return false
    }

    const privacy = currentUser?.genderPrivacy || 'everyone'

    switch (privacy) {
      case 'everyone':
        return true
      case 'followers only':
        
        const canSee = followStatus.isFollowing
        return canSee
      case 'friends':
        
        const canSeeFriends = followStatus.isFollowing && followStatus.isFollowedBy
        return canSeeFriends
      case 'only_me':
        return false
      default:
        return false
    }
  }

  
  const canSeeBirthday = () => {
    
    if (isOwnProfile) return true

    const privacy = currentUser?.birthdayPrivacy || 'everyone'

    switch (privacy) {
      case 'everyone':
        return true
      case 'followers only':
        
        return followStatus.isFollowing
      case 'friends':
        
        return followStatus.isFollowing && followStatus.isFollowedBy
      case 'only_me':
        return false
      default:
        return false
    }
  }

  
  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public':
        return <Globe className="w-4 h-4" />
      case 'followers':
        return <EyeOff className="w-4 h-4" />
      case 'friends':
        return <Lock className="w-4 h-4" />
      case 'listed':
        return <User className="w-4 h-4" />
      default:
        return <Globe className="w-4 h-4" />
    }
  }

  
  const handleDeletePost = (postId: number) => {
    setShowDeleteConfirm(prev => ({ ...prev, [postId]: true }))
  }

  
  const confirmDeletePost = async (postId: number) => {
    setIsDeleting(prev => ({ ...prev, [postId]: true }))
    try {
      await api.deletePost(postId)
      success('Post deleted!')
      
      window.location.reload() 
    } catch (err) {
      console.error('Failed to delete post:', err)
      error('Failed to delete post!')
    } finally {
      setIsDeleting(prev => ({ ...prev, [postId]: false }))
      setShowDeleteConfirm(prev => ({ ...prev, [postId]: false }))
      setOpenMenu(prev => ({ ...prev, [postId]: false }))
    }
  }

  
  const handleManagePrivacy = async (postId: number) => {
    try {
      const postDetails = await api.getPost(postId)
      setCurrentSelectedUsers(prev => ({
        ...prev,
        [postId]: postDetails.specific_user_ids || []
      }))
    } catch (err) {
      console.error('Failed to fetch post details:', err)
      setCurrentSelectedUsers(prev => ({
        ...prev,
        [postId]: []
      }))
    }
    setShowManagePrivacy(prev => ({ ...prev, [postId]: true }))
    setOpenMenu(prev => ({ ...prev, [postId]: false }))
  }

  const handleUpdatePrivacy = async (postId: number, privacy: 'public' | 'followers' | 'friends' | 'listed', selectedUsers: number[]) => {
    try {
      
      const currentPost = displayPosts.find(p => p.id === postId)
      
      await api.updatePost(postId, {
        content: currentPost?.content, 
        privacy: privacy,
        specific_user_ids: selectedUsers
      })

      
      if (onPostPrivacyUpdate) {
        onPostPrivacyUpdate(postId, privacy)
      } else {
        
        setLocalPosts(prevPosts => prevPosts.map(p =>
          p.id === postId
            ? { ...p, privacy: privacy }
            : p
        ))
      }

      success('Privacy updated!')
    } catch (err) {
      console.error('Failed to update privacy:', err)
      error('Failed to update privacy!')
    }
  }

  
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      error('Post content cannot be empty')
      return
    }

    setLoadingUsers(true)
    try {
      const postData: CreatePostRequest = {
        content: newPostContent,
        privacy: postPrivacy,
        image_url: newPostImage ? 'uploaded-image-url' : undefined, 
        specific_user_ids: selectedUsers.length > 0 ? selectedUsers : undefined
      }

      const newPost = await api.createPost(postData)
      
      
      const postWithUser: Post = {
        id: newPost.id,
        user: {
          id: currentUser?.id || 0,
          name: currentUser?.name || '',
          username: currentUser?.username || '',
          avatar: currentUser?.avatar || ''
        },
        content: newPost.content,
        image: newPost.image_url,
        likes: newPost.like_count,
        comments: newPost.comment_count,
        shares: newPost.share_count,
        timeAgo: 'Just now',
        privacy: newPost.privacy,
        isLiked: Boolean(newPost.is_liked),
        isBookmarked: Boolean(newPost.is_bookmarked),
        created_at: newPost.created_at
      }
      
      setLocalPosts(prevPosts => [postWithUser, ...prevPosts])
      
      success('Post created!')
      
      
      setShowCreatePost(false)
      setNewPostContent('')
      setNewPostImage(null)
      setPostPrivacy('public')
      setSelectedUsers([])
      
    } catch (err) {
      console.error('Failed to create post:', err)
      error('Failed to create post!')
    } finally {
      setLoadingUsers(false)
    }
  }

  
  const handlePostLike = async (postId: number) => {
    if (onPostLike) {
      onPostLike(postId)
    } else {
      
      try {
        const post = displayPosts.find(p => p.id === postId)
        const wasLiked = post?.isLiked || false

        if (post) {
          await api.toggleLike(post, !wasLiked)
        }

        
        setLocalPosts(prevPosts => prevPosts.map(p =>
          p.id === postId
            ? { ...p, isLiked: !wasLiked, likes: p.likes + (wasLiked ? -1 : 1) }
            : p
        ))
      } catch (err) {
        console.error('Error toggling like:', err)
        error('Failed to update like')
      }
    }
  }

  
  const handlePostBookmark = async (postId: number) => {
    if (onPostBookmark) {
      onPostBookmark(postId)
    } else {
      
      try {
        const post = displayPosts.find(p => p.id === postId)
        const wasBookmarked = post?.isBookmarked || false

        if (wasBookmarked) {
          await api.unbookmarkPost(postId)
        } else {
          await api.toggleBookmark(postId)
        }

        
        setLocalPosts(prevPosts => prevPosts.map(p =>
          p.id === postId
            ? { ...p, isBookmarked: !wasBookmarked }
            : p
        ))
      } catch (err) {
        console.error('Error toggling bookmark:', err)
        error('Failed to update bookmark')
      }
    }
  }

  
  const handleShareClick = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation()
    setSharePost(post)
  }

  const handleUserClick = (user: Partial<ApiUser>) => {
    
    router.push(`/profile/${user.id}`)
  }

  
  const handleUserAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentUser?.avatar && getAvatarUrl(currentUser.avatar)) {
      setImagePreviewState({
        isOpen: true,
        imageUrl: getAvatarUrl(currentUser.avatar)!,
        alt: `${currentUser.name}'s avatar`
      })
    }
  }

  
  const handleImagePreviewClose = () => {
    setImagePreviewState({
      isOpen: false,
      imageUrl: '',
      alt: ''
    })
  }

  // Handle privacy toggle
  const handlePrivacyToggle = () => {
    if (currentPrivacySetting) {
      // If currently private, show confirmation to make public
      setShowPrivacyConfirm(true)
    } else {
      // If currently public, show confirmation to make private
      setShowPrivateConfirm(true)
    }
  }

  const updatePrivacySetting = async (makePrivate: boolean) => {
    if (!currentUser) return

    setIsUpdatingPrivacy(true)
    try {
      // Call the API to update privacy setting
      await api.updateUserPrivacy(currentUser.id, makePrivate)

      success(`Profile is now ${makePrivate ? 'private' : 'public'}!`)

      // Update the local privacy state to trigger re-render
      setCurrentPrivacySetting(makePrivate)

      // Update the current user object in place
      if (currentUser) {
        currentUser.isPrivate = makePrivate
        // Also update the alternate property name if it exists
        if ('is_private' in currentUser) {
          (currentUser as { is_private?: boolean }).is_private = makePrivate
        }
      }

    } catch (err: unknown) {
      console.error('Failed to update privacy setting:', err)
      error('Failed to update privacy!')
    } finally {
      setIsUpdatingPrivacy(false)
      setShowPrivacyConfirm(false)
      setShowPrivateConfirm(false)
    }
  }  // Use local state when callbacks are not provided, otherwise use props
  const basePosts = onPostLike && onPostBookmark ? posts : localPosts

  // Apply sorting and filtering to posts
  const displayPosts = useMemo(() => {
    let filteredPosts = basePosts

    // Apply privacy filter
    if (privacyFilter !== 'all') {
      filteredPosts = filteredPosts.filter(post => post.privacy === privacyFilter)
    }

    // Apply sorting
    const sortedPosts = [...filteredPosts].sort((a, b) => {
      switch (sortOption) {
        case 'latest':
          // Assuming posts have a created_at or similar date field, but since we don't see it,
          // we'll use the id as a proxy (higher id = newer post)
          return b.id - a.id
        case 'oldest':
          return a.id - b.id
        case 'most_comments':
          return b.comments - a.comments
        case 'most_likes':
          return b.likes - a.likes
        default:
          return 0
      }
    })

    return sortedPosts
  }, [basePosts, sortOption, privacyFilter])

  // Apply sorting to following
  const sortedFollowing = useMemo(() => {
    let filtered = [...tabData.following]
    
    // For own profile, exclude current user from following list
    if (isOwnProfile && currentUserAuth?.id) {
      filtered = filtered.filter(user => user.id !== currentUserAuth.id)
    }
    
    const sorted = filtered.sort((a, b) => {
      switch (followingSort) {
        case 'latest':
          // Assuming users have created_at or similar date field, using id as proxy
          return b.id - a.id
        case 'oldest':
          return a.id - b.id
        default:
          return 0
      }
    })
    return sorted
  }, [tabData.following, followingSort, isOwnProfile, currentUserAuth?.id])

  // Apply sorting to followers
  const sortedFollowers = useMemo(() => {
    let filtered = [...tabData.followers]
    
    // For own profile, exclude current user from followers list
    if (isOwnProfile && currentUserAuth?.id) {
      filtered = filtered.filter(user => user.id !== currentUserAuth.id)
    }
    
    const sorted = filtered.sort((a, b) => {
      switch (followersSort) {
        case 'latest':
          // Assuming users have created_at or similar date field, using id as proxy
          return b.id - a.id
        case 'oldest':
          return a.id - b.id
        default:
          return 0
      }
    })
    return sorted
  }, [tabData.followers, followersSort, isOwnProfile, currentUserAuth?.id])

  const displayFollowers = isConnected ? liveFollowers : followers
  const displayFollowing = isConnected ? liveFollowing : following

  // Use real-time counts when connected, but prioritize initial counts for private profiles
  const followersCount = (initialFollowerCount !== undefined)
    ? initialFollowerCount // Use provided initial count for private profiles
    : (countsConnected
      ? followerCounts.followers_count
      : (displayFollowers?.length ?? followers?.length ?? 0))
  const followingCount = (initialFollowingCount !== undefined)
    ? initialFollowingCount // Use provided initial count for private profiles
    : (countsConnected
      ? followerCounts.following_count
      : (displayFollowing?.length ?? following?.length ?? 0))

  const handlePostClick = (postId: number) => {
    const url = `/post/${postId}?from=profile&userId=${currentUser?.id || ''}`
    router.push(url)
  }

  // Render post function (similar to HomeFeed)
  const renderPost = (post: Post, index: number) => {
    const animationDelay = index < 6 ? `animation-delay-${index * 100}` : 'animation-delay-500'
    return (
      <motion.div
        key={post.id}
        className={`bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-4 mb-4 hover:shadow-emerald-500/10 transition-all duration-500 group cursor-pointer animate-fade-in animate-slide-in-from-bottom ${animationDelay}`}
        onClick={(e) => {
          
          if ((e.target as HTMLElement).closest('button')) {
            return
          }
          handlePostClick(post.id)
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1">
            {/* Clickable Avatar */}
            <div
              className="relative group cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                if (post.user.id && post.user.id !== 0) {
                  router.push(`/profile/${post.user.id}`)
                }
              }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white/20 group-hover:ring-emerald-400/50 transition-all duration-300">
                {getAvatarUrl(post.user.avatar) ? (
                  <Image
                    src={getAvatarUrl(post.user.avatar)!}
                    alt={`${post.user.name}&apos;s avatar`}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                    {getUserInitials({
                      first_name: post.user.name?.split(' ')[0],
                      last_name: post.user.name?.split(' ')[1] || post.user.name?.split(' ')[0]
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              {/* Clickable Full Name */}
              <div
                className="group cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  if (post.user.id && post.user.id !== 0) {
                    router.push(`/profile/${post.user.id}`)
                  }
                }}
              >
                <span
                  className="text-white font-semibold text-lg hover:text-emerald-300 transition-colors duration-200"
                >
                  {post.user.name}
                </span>
              </div>

              {/* Clickable Username and Time */}
              <p
                className="text-white/70 text-sm cursor-pointer hover:text-white/90 transition-colors duration-200"
                onClick={(e) => {
                  e.stopPropagation()
                  if (post.user.id && post.user.id !== 0) {
                    router.push(`/profile/${post.user.id}`)
                  }
                }}
              >
                @{post.user.username} • {post.timeAgo}
              </p>
            </div>
          </div>

          {/* Privacy Indicator */}
          <div className="flex items-center space-x-2 text-white/60">
            {getPrivacyIcon(post.privacy)}
            <span className="text-xs capitalize">{post.privacy}</span>
          </div>

          {canDeletePost(post) && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenMenu(prev => ({ ...prev, [post.id]: !prev[post.id] }))
                }}
                className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-105"
                title="More options"
                aria-label="More options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {openMenu[post.id] && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleManagePrivacy(post.id)}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-blue-400 hover:bg-blue-500/10 transition-all duration-200"
                    >
                      <Lock className="w-4 h-4" />
                      <span className="text-sm font-medium">Manage Privacy</span>
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Delete Post</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* Post Image */}
        {post.image && (
          <div className="mb-4 flex justify-center">
            <div className="inline-block border border-white/20 rounded-2xl overflow-hidden">
              <Image
                src={post.image}
                alt="Post image"
                width={640}
                height={256}
                unoptimized={post.image.includes('/svg')}
                className="max-h-64 sm:max-h-80 md:max-h-96 object-contain hover:scale-105 transition-transform duration-500 rounded-2xl"
              />
            </div>
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center space-x-4">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePostLike(post.id)
              }}
              className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-2xl transition-all duration-300 hover:scale-105 ${
                post.isLiked
                  ? 'text-red-400 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30'
                  : 'text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/10'
              }`}
              title="Like"
            >
              <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current animate-pulse' : ''}`} />
              <span className="text-sm font-medium">{post.likes}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                
                handlePostClick(post.id)
              }}
              className="flex items-center justify-center space-x-2 px-4 py-2 text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/10 rounded-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
              title="Comment"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{post.comments}</span>
            </button>

              <button
                onClick={(e) => handleShareClick(post, e)}
                className="flex items-center justify-center space-x-2 px-4 py-2 text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/10 rounded-2xl transition-all duration-300 hover:scale-105"
                title="Share"
              >
                <Send className="w-5 h-5" />
                <span className="text-sm font-medium">{post.shares}</span>
              </button>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              handlePostBookmark(post.id)
            }}
            className={`flex items-center justify-center px-4 py-2 rounded-2xl transition-all duration-300 hover:scale-105 ${
              post.isBookmarked
                ? 'text-yellow-400 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30'
                : 'text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/10'
            }`}
            title="Bookmark"
          >
            <Bookmark className={`w-5 h-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Profile Header */}
      <div className="flex-shrink-0 bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl shadow-white/10 p-4 lg:p-6 mb-4 lg:mb-6 relative overflow-hidden group hover:shadow-white/15 transition-all duration-700">
        {/* Enhanced background effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-teal-500/5 rounded-2xl"></div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/8 to-teal-400/8 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-1000"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-blue-400/8 to-cyan-400/8 rounded-full blur-xl group-hover:blur-2xl transition-all duration-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-cyan-400/3 to-blue-400/3 rounded-full blur-3xl group-hover:blur-4xl transition-all duration-1500"></div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 relative z-10">
          {/* Left Column - Avatar and Action Buttons */}
          <div className="flex flex-col items-center space-y-4">
            {/* Avatar */}
            <div className="w-20 h-20 lg:w-28 lg:h-28 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-full flex items-center justify-center overflow-hidden shadow-2xl shadow-emerald-500/40 ring-3 ring-white/30 ring-offset-3 ring-offset-slate-900/90 hover:ring-emerald-400/60 hover:shadow-emerald-500/60 transition-all duration-500 group-hover:scale-110 group-hover:rotate-1 cursor-pointer hover:scale-105"
              onClick={handleUserAvatarClick}
              title="Click to view full-size avatar"
            >
              {getAvatarUrl(currentUser?.avatar) ? (
                <>
                  <Image
                    src={getAvatarUrl(currentUser?.avatar)!}
                    alt={`${currentUser?.name}&apos;s avatar`}
                    width={112}
                    height={112}
                    unoptimized={getAvatarUrl(currentUser?.avatar)!.includes('/svg')}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:rotate-1"
                    onError={(e) => {
                      
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <User className="w-10 h-10 lg:w-14 lg:h-14 text-white hidden" />
                </>
              ) : (
                <span className="text-white font-bold text-xl lg:text-2xl drop-shadow-xl transition-all duration-300 group-hover:scale-110">
                  {getUserInitials({
                    first_name: currentUser?.firstName || currentUser?.first_name,
                    last_name: currentUser?.lastName || currentUser?.last_name,
                    nickname: currentUser?.nickname,
                    email: currentUser?.email
                  })}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            {!isOwnProfile && currentUser && !currentUser.is_deleted && (
              <div className="flex flex-col items-center gap-3 w-full">
                <FollowHandler
                  targetUser={{
                    id: currentUser.id,
                    first_name: currentUser.firstName || currentUser.first_name || '',
                    last_name: currentUser.lastName || currentUser.last_name || '',
                    nickname: currentUser.nickname || '',
                    email: currentUser.email,
                    avatar: currentUser.avatar || '',
                    is_private: currentUser.isPrivate || currentUser.is_private || false,
                    created_at: currentUser.memberSince || '',
                    about_me: currentUser.aboutMe || '',
                    date_of_birth: currentUser.dateOfBirth || '',
                    gender: currentUser.gender || '',
                    gender_privacy: currentUser.genderPrivacy || 'everyone',
                    birthday_privacy: currentUser.birthdayPrivacy || 'everyone',
                    updated_at: new Date().toISOString(),
                    status: 'online',
                    last_status_change: new Date().toISOString()
                  }}
                  currentFollowStatus={followStatus}
                  onStatusChange={handleFollowStatusChange}
                  disabled={!connectionStatus}
                  confirmUnfollow={true}
                  onUnfollowConfirm={handleProfileUnfollowConfirm}
                  fullWidth={true}
                />
                {/* Send Message button - only show if following */}
                {followStatus.isFollowing && (
                  <button
                    onClick={handleStartChat}
                    className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-sm rounded-xl transition-all duration-300 shadow-xl hover:shadow-emerald-500/60 hover:scale-110 active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </button>
                )}
              </div>
            )}

            {/* Edit Profile and Privacy Buttons - Only show for own profile */}
            {isOwnProfile && (
              <div className="flex flex-col items-center gap-3 w-full">
                <button
                  onClick={handleEditProfile}
                  className="w-full flex items-center justify-center px-6 py-3 text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-2xl transition-all duration-300 hover:scale-105"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
                <button
                  onClick={handlePrivacyToggle}
                  disabled={isUpdatingPrivacy}
                  className="w-full flex items-center justify-center px-6 py-3 text-white/70 hover:text-white hover:bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingPrivacy ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : currentPrivacySetting ? (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      Make Public
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Make Private
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Middle Column - User Info and Stats */}
          <div className="flex flex-col justify-center space-y-4">
            {/* User Identity */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                <h2 className="text-2xl lg:text-3xl font-bold text-white drop-shadow-lg group-hover:text-white/95 transition-colors duration-500">
                  {currentUser?.name || 'User'}
                </h2>
                {(currentUser?.isPrivate || currentUser?.is_private) && (
                  <span title="Private Profile">
                    <Lock className="w-5 h-5 lg:w-6 lg:h-6 text-amber-400 flex-shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-emerald-300 text-base lg:text-lg font-medium drop-shadow-md mb-3">
                @{currentUser?.username || 'username'}
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              {!currentUser?.is_deleted && (
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <p className="text-white/80 text-sm truncate">{currentUser?.email || 'No email'}</p>
                </div>
              )}
              {!showPrivacyOverlay && !currentUser?.is_deleted && (
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <Calendar className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  <p className="text-white/70 text-xs">
                    Member since {currentUser?.memberSince
                      ? new Date(currentUser.memberSince).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short'
                      })
                      : 'Unknown'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Stats Buttons */}
            {!currentUser?.is_deleted && (
              <div className="flex justify-center lg:justify-start space-x-4 lg:space-x-6">
                <button
                  onClick={() => !showPrivacyOverlay && handleTabChange('posts')}
                  disabled={showPrivacyOverlay}
                  className={`text-center p-3 rounded-3xl transition-all duration-300 hover:scale-110 active:scale-95 min-w-[80px] ${
                    activeTab === 'posts' && !showPrivacyOverlay
                      ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 shadow-xl  border border-emerald-400/40'
                      : 'hover:bg-white/10 hover:shadow-lg hover:shadow-white/20'
                  } ${showPrivacyOverlay ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <div className="text-xl lg:text-2xl font-bold text-white drop-shadow-md">
                    {displayPosts?.length ?? 0}
                  </div>
                  <div className="text-white/70 text-sm lg:text-base font-medium">Posts</div>
                </button>

                <button
                  onClick={() => !showPrivacyOverlay && handleTabChange('following')}
                  disabled={showPrivacyOverlay}
                  className={`text-center p-3 rounded-3xl transition-all duration-300 hover:scale-110 active:scale-95 min-w-[80px] ${
                    activeTab === 'following' && !showPrivacyOverlay
                      ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 shadow-xl border border-emerald-400/40'
                      : 'hover:bg-white/10 hover:shadow-lg hover:shadow-white/20'
                  } ${showPrivacyOverlay ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <div className="text-xl lg:text-2xl font-bold text-white drop-shadow-md">
                    {followingCount}
                  </div>
                  <div className="text-white/70 text-sm lg:text-base font-medium">Following</div>
                </button>

                <button
                  onClick={() => !showPrivacyOverlay && handleTabChange('followers')}
                  disabled={showPrivacyOverlay}
                  className={`text-center p-3 rounded-3xl transition-all duration-300 hover:scale-110 active:scale-95 min-w-[80px] ${
                    activeTab === 'followers' && !showPrivacyOverlay
                      ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 shadow-xl border border-emerald-400/40'
                      : 'hover:bg-white/10 hover:shadow-lg hover:shadow-white/20'
                  } ${showPrivacyOverlay ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <div className="text-xl lg:text-2xl font-bold text-white drop-shadow-md">
                    {followersCount}
                  </div>
                  <div className="text-white/70 text-sm lg:text-base font-medium">Followers</div>
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Bio and Personal Info */}
          <div className="flex flex-col justify-center space-y-4">
            {/* Bio Section */}
            {!currentUser?.is_deleted && (
              <div>
                <h4 className="text-white font-semibold text-base mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  About
                </h4>
                <p className="text-white/90 text-sm leading-relaxed">
                  {currentUser?.aboutMe || ''}
                </p>
              </div>
            )}

            {/* Date of Birth and Gender */}
            {!showPrivacyOverlay && !currentUser?.is_deleted && (
              <div className="flex flex-row gap-6">
                {canSeeBirthday() && (
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-base mb-2 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-teal-400" />
                      Birthday
                    </h4>
                    <p className="text-white/90 text-sm">
                      {currentUser?.dateOfBirth
                        ? new Date(currentUser.dateOfBirth).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                        : 'Not provided'
                      }
                    </p>
                  </div>
                )}
                {canSeeGender() && (
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-base mb-2 flex items-center gap-2">
                      {currentUser?.gender?.toLowerCase() === 'male' ? (
                        <Mars className="w-4 h-4 text-blue-400" />
                      ) : currentUser?.gender?.toLowerCase() === 'female' ? (
                        <Venus className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Venus className="w-4 h-4 text-blue-400" />
                      )}
                      Gender
                    </h4>
                    <p className="text-white/90 text-sm">
                      {currentUser?.gender
                        ? currentUser.gender.charAt(0).toUpperCase() + currentUser.gender.slice(1)
                        : 'Not specified'
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Privacy Overlay for Private Profiles */}
        {showPrivacyOverlay && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 flex items-center justify-center z-10 shadow-2xl">
            <div className="text-center p-8 max-w-sm mx-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-400/30">
                <Lock className="w-8 h-8 text-emerald-400" />
              </div>
              <h4 className="text-2xl font-bold mb-3 bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
                Private Profile
              </h4>
              <p className="text-white/80 text-base leading-relaxed">
                This user&apos;s profile is private. Follow them to see their details.
              </p>
            </div>
          </div>
        )}

        {/* Profile Content */}
        <div className="grid grid-cols-1 gap-4 lg:gap-6">
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {activeTab === 'posts' && !showPrivacyOverlay && !currentUser?.is_deleted && (
                <motion.div
                  key="posts"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 relative flex flex-col overflow-hidden"
                  style={{ height: 'calc(100vh - 28rem)', borderBottomWidth: '1px' }}
                >
                  {/* Sticky Header */}
                  <div className="flex-shrink-0 rounded-t-2xl lg:rounded-t-3xl px-4 lg:px-6 py-3 lg:py-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base lg:text-lg font-semibold text-white">Posts</h3>
                      <div className="flex items-center gap-2">
                        {/* Sorting and Filtering Controls */}
                        <div className="flex items-center gap-1.5">
                          {/* Sort Label and Dropdown */}
                          <span className="text-white/80 text-xs font-medium">Sort:</span>
                          <div className="relative">
                            <select
                              value={sortOption}
                              onChange={(e) => setSortOption(e.target.value as typeof sortOption)}
                              className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200 hover:bg-white/15 hover:scale-105 min-w-[120px] cursor-pointer appearance-none pr-6"
                              title="Sort posts"
                            >
                              <option value="latest" className="bg-slate-800 text-white">Latest First</option>
                              <option value="oldest" className="bg-slate-800 text-white">Oldest First</option>
                              <option value="most_comments" className="bg-slate-800 text-white">Most Comments</option>
                              <option value="most_likes" className="bg-slate-800 text-white">Most Likes</option>
                            </select>
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>

                          {/* Filter Label and Dropdown - Only show for own profile */}
                          {isOwnProfile && (
                            <>
                              <span className="text-white/80 text-xs font-medium">Filter:</span>
                              <div className="relative">
                                <select
                                  value={privacyFilter}
                                  onChange={(e) => setPrivacyFilter(e.target.value as typeof privacyFilter)}
                                  className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200 hover:bg-white/15 hover:scale-105 min-w-[100px] cursor-pointer appearance-none pr-6"
                                  title="Filter posts by privacy"
                                >
                                  <option value="all" className="bg-slate-800 text-white">All Posts</option>
                                  <option value="public" className="bg-slate-800 text-white">Public</option>
                                  <option value="followers" className="bg-slate-800 text-white">Followers</option>
                                  <option value="friends" className="bg-slate-800 text-white">Friends</option>
                                  <option value="listed" className="bg-slate-800 text-white">Listed</option>
                                </select>
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                  <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        {!connectionStatus && (
                          <span className="text-xs text-red-400 ml-1">Offline</span>
                        )}
                        {/* Add Post Button - Only show for own profile */}
                        {isOwnProfile && (
                          <motion.button
                            onClick={() => setShowCreatePost(true)}
                            className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-sm rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:scale-110 active:scale-95"
                            title="Create New Post"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Plus className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Posts Container */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                    <div className="p-4 lg:p-6 pt-0">
                      <div className="space-y-3 lg:space-y-4">
                        {displayPosts.map((post, index) => renderPost(post, index))}
                        {displayPosts.length === 0 && !showPrivacyOverlay && (
                          <div className="text-center py-12 px-6">
                            {isOwnProfile ? (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="max-w-md mx-auto"
                              >
                                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-400/30">
                                  <Plus className="w-10 h-10 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Create Your First Post</h3>
                                <p className="text-white/70 text-sm mb-6 leading-relaxed">
                                  Share your thoughts, experiences, or moments with your followers. Start building your story!
                                </p>
                                <motion.button
                                  onClick={() => setShowCreatePost(true)}
                                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Create Post
                                </motion.button>
                              </motion.div>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="max-w-md mx-auto"
                              >
                                <div className="w-20 h-20 bg-gradient-to-br from-slate-500/20 to-gray-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-400/30">
                                  <FileText className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">No Posts Yet</h3>
                                <p className="text-white/70 text-sm leading-relaxed">
                                  {currentUser?.name} hasn&apos;t shared any posts yet. Check back later for updates!
                                </p>
                              </motion.div>
                            )}
                          </div>
                        )}
                        {!connectionStatus && displayPosts.length > 0 && (
                          <div className="text-center py-2">
                            <p className="text-xs text-white/50">Posts may not be up to date while offline</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'following' && !showPrivacyOverlay && !currentUser?.is_deleted && (
                <motion.div
                  key="following"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 relative flex flex-col overflow-hidden"
                  style={{ height: 'calc(100vh - 28rem)', borderBottomWidth: '1px' }}
                >
                  {/* Sticky Header */}
                  <div className="flex-shrink-0 rounded-t-2xl lg:rounded-t-3xl px-4 lg:px-6 py-3 lg:py-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base lg:text-lg font-semibold text-white">Following</h3>
                      <div className="flex items-center gap-2">
                        {/* Sorting Controls */}
                        <div className="flex items-center gap-1.5">
                          {/* Sort Label and Dropdown */}
                          <span className="text-white/80 text-xs font-medium">Sort:</span>
                          <div className="relative">
                            <select
                              value={followingSort}
                              onChange={(e) => setFollowingSort(e.target.value as typeof followingSort)}
                              className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200 hover:bg-white/15 hover:scale-105 min-w-[100px] cursor-pointer appearance-none pr-6"
                              title="Sort following"
                            >
                              <option value="latest" className="bg-slate-800 text-white">Latest First</option>
                              <option value="oldest" className="bg-slate-800 text-white">Oldest First</option>
                            </select>
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        {!connectionStatus && (
                          <span className="text-xs text-red-400 ml-1">Offline</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Following Container */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                    <div className="p-4 lg:p-6 pt-0">
                      <div className="space-y-3 lg:space-y-4">
                        {isLoadingTabData ? (
                          <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className="flex items-center space-x-3 p-2 animate-pulse">
                                <div className="w-10 h-10 bg-white/20 rounded-full"></div>
                                <div className="flex-1">
                                  <div className="w-24 h-4 bg-white/20 rounded mb-1"></div>
                                  <div className="w-16 h-3 bg-white/20 rounded"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : sortedFollowing.length > 0 ? (
                          sortedFollowing.map((user: Partial<ApiUser>) => (
                            user.id ? (
                            <div
                              key={user.id}
                              className="flex items-center space-x-3 p-3 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <div
                                className="flex items-center space-x-3 flex-1 cursor-pointer"
                                onClick={() => handleUserClick(user)}
                              >
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center overflow-hidden">
                                  {user.avatar ? (
                                    <Image
                                      src={getAvatarUrl(user.avatar) || ''}
                                      alt={`${user.first_name} ${user.last_name}`}
                                      width={40}
                                      height={40}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-white font-bold text-sm">
                                      {getUserInitials(user)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium truncate">
                                    {user.first_name} {user.last_name}
                                  </p>
                                  <p className="text-white/60 text-sm truncate">
                                    @{user.nickname || user.email?.split('@')[0]}
                                  </p>
                                </div>
                              </div>
                              {/* Action buttons */}
                              {isOwnProfile ? (
                                followRelationships[user.id]?.isPending ? (
                                  // Pending request - show cancel button
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUserFollowAction(user.id!, false) // This will cancel the pending request
                                    }}
                                    disabled={isUpdatingFollow[user.id]}
                                    className="flex items-center px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-semibold text-xs rounded-xl transition-all duration-300 shadow-lg shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isUpdatingFollow[user.id] ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    ) : (
                                      <>
                                        <X className="w-3 h-3 mr-1" />
                                        Requested
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  // Accepted follow - show unfollow button
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setShowUnfollowConfirm({ 
                                        userId: user.id!, 
                                        userName: `${user.first_name} ${user.last_name}` 
                                      })
                                    }}
                                    disabled={isUpdatingFollow[user.id]}
                                    className="flex items-center px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold text-xs rounded-xl transition-all duration-300 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isUpdatingFollow[user.id] ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    ) : (
                                      <>
                                        <UserMinus className="w-3 h-3 mr-1" />
                                        Unfollow
                                      </>
                                    )}
                                  </button>
                                )
                              ) : (
                                /* For other profiles: show follow/unfollow buttons for all users except the current user */
                                user.id !== currentUserAuth?.id && (
                                  <FollowHandler
                                    targetUser={{
                                      id: user.id,
                                      first_name: user.first_name || '',
                                      last_name: user.last_name || '',
                                      nickname: user.nickname || '',
                                      email: user.email || '',
                                      avatar: user.avatar || '',
                                      is_private: user.is_private || false,
                                      created_at: user.created_at || '',
                                      about_me: user.about_me || '',
                                      date_of_birth: user.date_of_birth || '',
                                      gender: user.gender || '',
                                      gender_privacy: user.gender_privacy || 'everyone',
                                      birthday_privacy: user.birthday_privacy || 'everyone',
                                      updated_at: user.updated_at || new Date().toISOString(),
                                      status: 'online',
                                      last_status_change: new Date().toISOString()
                                    }}
                                    currentFollowStatus={getFollowStatusFromAPI(
                                      followRelationships[user.id]?.isFollowing || false,
                                      followRelationships[user.id]?.isPending ? 'pending' : undefined,
                                      followRelationships[user.id]?.isFollowedBy || false
                                    )}
                                    onStatusChange={(newStatus) => {
                                      
                                      setFollowRelationships(prev => ({
                                        ...prev,
                                        [user.id!]: { 
                                          isFollowing: newStatus.isFollowing, 
                                          isFollowedBy: newStatus.isFollowedBy,
                                          isPending: newStatus.isPending
                                        }
                                      }))
                                    }}
                                    disabled={!connectionStatus}
                                    size="sm"
                                    confirmUnfollow={true}
                                    onUnfollowConfirm={handleListUnfollowConfirm}
                                  />
                                )
                              )}
                            </div>
                            ) : null
                          ))
                        ) : (
                          <div className="text-center py-12 px-6">
                            {isOwnProfile ? (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="max-w-md mx-auto"
                              >
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-400/30">
                                  <Users className="w-10 h-10 text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Discover People</h3>
                                <p className="text-white/70 text-sm mb-6 leading-relaxed">
                                  Connect with friends, family, and interesting people. Start following others to see their posts in your feed!
                                </p>
                                <motion.button
                                  onClick={() => router.push('/discover')}
                                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Search className="w-4 h-4 mr-2" />
                                  Discover People
                                </motion.button>
                              </motion.div>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="max-w-md mx-auto"
                              >
                                <div className="w-20 h-20 bg-gradient-to-br from-slate-500/20 to-gray-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-400/30">
                                  <UserPlus className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">No Following Yet</h3>
                                <p className="text-white/70 text-sm leading-relaxed">
                                  {currentUser?.name} hasn&apos;t followed anyone yet. Their following list will appear here when they start connecting with others.
                                </p>
                              </motion.div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'followers' && !showPrivacyOverlay && !currentUser?.is_deleted && (
                <motion.div
                  key="followers"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 relative flex flex-col overflow-hidden"
                  style={{ height: 'calc(100vh - 28rem)', borderBottomWidth: '1px' }}
                >
                  {/* Sticky Header */}
                  <div className="flex-shrink-0 rounded-t-2xl lg:rounded-t-3xl px-4 lg:px-6 py-3 lg:py-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base lg:text-lg font-semibold text-white">Followers</h3>
                      <div className="flex items-center gap-2">
                        {/* Sorting Controls */}
                        <div className="flex items-center gap-1.5">
                          {/* Sort Label and Dropdown */}
                          <span className="text-white/80 text-xs font-medium">Sort:</span>
                          <div className="relative">
                            <select
                              value={followersSort}
                              onChange={(e) => setFollowersSort(e.target.value as typeof followersSort)}
                              className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200 hover:bg-white/15 hover:scale-105 min-w-[100px] cursor-pointer appearance-none pr-6"
                              title="Sort followers"
                            >
                              <option value="latest" className="bg-slate-800 text-white">Latest First</option>
                              <option value="oldest" className="bg-slate-800 text-white">Oldest First</option>
                            </select>
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        {!connectionStatus && (
                          <span className="text-xs text-red-400 ml-1">Offline</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Followers Container */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                    <div className="p-4 lg:p-6 pt-0">
                      <div className="space-y-3 lg:space-y-4">
                        {isLoadingTabData ? (
                          <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className="flex items-center space-x-3 p-2 animate-pulse">
                                <div className="w-10 h-10 bg-white/20 rounded-full"></div>
                                <div className="flex-1">
                                  <div className="w-24 h-4 bg-white/20 rounded mb-1"></div>
                                  <div className="w-16 h-3 bg-white/20 rounded"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : sortedFollowers.length > 0 ? (
                          sortedFollowers.filter(user => user.id).map((user: Partial<ApiUser>) => (
                            <div
                              key={user.id!}
                              className="flex items-center space-x-3 p-3 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <div
                                className="flex items-center space-x-3 flex-1 cursor-pointer"
                                onClick={() => handleUserClick(user)}
                              >
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center overflow-hidden">
                                  {user.avatar ? (
                                    <Image
                                      src={getAvatarUrl(user.avatar) || ''}
                                      alt={`${user.first_name} ${user.last_name}`}
                                      width={40}
                                      height={40}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-white font-bold text-sm">
                                      {getUserInitials(user)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium truncate">
                                    {user.first_name || ''} {user.last_name || ''}
                                  </p>
                                  <p className="text-white/60 text-sm truncate">
                                    @{user.nickname || (user.email ? user.email.split('@')[0] : '')}
                                  </p>
                                </div>
                              </div>
                              {/* Action buttons */}
                              {isOwnProfile ? (
                                <div className="flex space-x-2 flex-nowrap">
                                  {/* Follow Back button - only show if current user is not following back and not pending */}
                                  {!(followRelationships[user.id!]?.isFollowing) && !(followRelationships[user.id!]?.isPending) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleUserFollowAction(user.id!, false)
                                      }}
                                      disabled={isUpdatingFollow[user.id!]}
                                      className="flex items-center px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-xs rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isUpdatingFollow[user.id!] ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                      ) : (
                                        <>
                                          <UserPlus className="w-3 h-3 mr-1" />
                                          Follow Back
                                        </>
                                      )}
                                    </button>
                                  )}
                                  {/* Pending request - show cancel button */}
                                  {followRelationships[user.id!]?.isPending && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleUserFollowAction(user.id!, false) // This will cancel the pending request
                                      }}
                                      disabled={isUpdatingFollow[user.id!]}
                                      className="flex items-center px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-semibold text-xs rounded-xl transition-all duration-300 shadow-lg shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isUpdatingFollow[user.id!] ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                      ) : (
                                        <>
                                          <X className="w-3 h-3 mr-1" />
                                          Requested
                                        </>
                                      )}
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setShowRemoveConfirm({ 
                                        userId: user.id!, 
                                        userName: `${user.first_name || ''} ${user.last_name || ''}` 
                                      })
                                    }}
                                    disabled={isUpdatingFollow[user.id!]}
                                    className="flex items-center px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold text-xs rounded-xl transition-all duration-300 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isUpdatingFollow[user.id!] ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    ) : (
                                      <>
                                        <UserX className="w-3 h-3 mr-1" />
                                        Remove
                                      </>
                                    )}
                                  </button>
                                </div>
                              ) : (
                                /* For other profiles: show follow/unfollow buttons for all users except the current user */
                                user.id !== currentUserAuth?.id && (
                                  <FollowHandler
                                    targetUser={{
                                      id: user.id!,
                                      first_name: user.first_name || '',
                                      last_name: user.last_name || '',
                                      nickname: user.nickname || '',
                                      email: user.email || '',
                                      avatar: user.avatar || '',
                                      is_private: user.is_private || false,
                                      created_at: user.created_at || '',
                                      about_me: user.about_me || '',
                                      date_of_birth: user.date_of_birth || '',
                                      gender: user.gender || '',
                                      gender_privacy: user.gender_privacy || 'everyone',
                                      birthday_privacy: user.birthday_privacy || 'everyone',
                                      updated_at: user.updated_at || new Date().toISOString(),
                                      status: 'online',
                                      last_status_change: new Date().toISOString()
                                    }}
                                    currentFollowStatus={getFollowStatusFromAPI(
                                      followRelationships[user.id!]?.isFollowing || false,
                                      followRelationships[user.id!]?.isPending ? 'pending' : undefined,
                                      followRelationships[user.id!]?.isFollowedBy || false
                                    )}
                                    onStatusChange={(newStatus) => {
                                      
                                      setFollowRelationships(prev => ({
                                        ...prev,
                                        [user.id!]: { 
                                          isFollowing: newStatus.isFollowing, 
                                          isFollowedBy: newStatus.isFollowedBy,
                                          isPending: newStatus.isPending
                                        }
                                      }))
                                    }}
                                    disabled={!connectionStatus}
                                    size="sm"
                                    confirmUnfollow={true}
                                    onUnfollowConfirm={handleListUnfollowConfirm}
                                  />
                                )
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 px-6">
                            {isOwnProfile ? (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="max-w-md mx-auto"
                              >
                                <div className="w-20 h-20 bg-gradient-to-br from-pink-500/20 to-rose-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-pink-400/30">
                                  <Heart className="w-10 h-10 text-pink-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">No Followers Yet</h3>
                                <p className="text-white/70 text-sm leading-relaxed">
                                  Your followers will appear here once people start following you. Keep sharing great content and engaging with the community!
                                </p>
                              </motion.div>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="max-w-md mx-auto"
                              >
                                <div className="w-20 h-20 bg-gradient-to-br from-slate-500/20 to-gray-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-400/30">
                                  <UserPlus className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">No Followers Yet</h3>
                                <p className="text-white/70 text-sm leading-relaxed">
                                  {currentUser?.name} hasn&apos;t gained any followers yet. Be the first to follow them and show your support!
                                </p>
                              </motion.div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Privacy Confirmation Modal */}
      <AnimatePresence>
        {showPrivacyConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPrivacyConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Make Profile Public?</h3>
                <p className="text-white/70 text-sm mb-6">
                  Are you sure you want to make your account public? Anyone will be able to see your profile and posts.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPrivacyConfirm(false)}
                    className="flex-1 px-6 py-3 border border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isUpdatingPrivacy}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updatePrivacySetting(false)}
                    disabled={isUpdatingPrivacy}
                    className={`flex-1 px-6 py-3 rounded-xl text-white font-semibold text-sm lg:text-base transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                      isUpdatingPrivacy
                        ? 'bg-white/20 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
                    }`}
                  >
                    {isUpdatingPrivacy ? 'Updating...' : 'Make Public'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Private Confirmation Modal */}
      <AnimatePresence>
        {showPrivateConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPrivateConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Make Profile Private?</h3>
                <p className="text-white/70 text-sm mb-6">
                  Are you sure you want to make your account private? Only approved followers will be able to see your profile and posts.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPrivateConfirm(false)}
                    className="flex-1 px-6 py-3 border border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isUpdatingPrivacy}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updatePrivacySetting(true)}
                    disabled={isUpdatingPrivacy}
                    className={`flex-1 px-6 py-3 rounded-xl text-white font-semibold text-sm lg:text-base transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                      isUpdatingPrivacy
                        ? 'bg-white/20 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/25'
                    }`}
                  >
                    {isUpdatingPrivacy ? 'Updating...' : 'Make Private'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {Object.entries(showDeleteConfirm).some(([, show]) => show) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm({})}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Delete Post</h3>
                <p className="text-white/70 text-sm mb-6">
                  Are you sure you want to delete this post? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm({})}
                    className="flex-1 px-6 py-3 border border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={Object.values(isDeleting).some(deleting => deleting)}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const postId = Object.keys(showDeleteConfirm).find((key) => showDeleteConfirm[parseInt(key)] !== false)
                      if (postId) {
                        confirmDeletePost(parseInt(postId))
                      }
                    }}
                    className="flex-1 px-6 py-3 rounded-xl text-white font-semibold text-sm lg:text-base transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-red-500/25"
                    disabled={Object.values(isDeleting).some(deleting => deleting)}
                  >
                    {Object.values(isDeleting).some(deleting => deleting) ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Privacy Modals */}
      {displayPosts.map((post) => (
        <ManagePrivacy
          key={`privacy-${post.id}`}
          show={showManagePrivacy[post.id] || false}
          onClose={() => setShowManagePrivacy(prev => ({ ...prev, [post.id]: false }))}
          currentPrivacy={post.privacy as 'public' | 'followers' | 'friends' | 'listed'}
          currentSelectedUsers={currentSelectedUsers[post.id] || []}
          availableUsers={[]} 
          loadingUsers={false}
          onUpdatePrivacy={(privacy: 'public' | 'followers' | 'friends' | 'listed', selectedUsers: number[]) => handleUpdatePrivacy(post.id, privacy, selectedUsers)}
        />
      ))}

      {/* Share Popup Modal */}
      {sharePost && (
        <SharePopup
          postId={sharePost.id}
          isOpen={true}
          onClose={() => setSharePost(null)}
          onShareSuccess={() => {
            
            if (onPostLike && onPostBookmark) {
              
              
            } else {
              
              setLocalPosts(prevPosts => prevPosts.map(p =>
                p.id === sharePost.id
                  ? { ...p, shares: p.shares + 1 }
                  : p
              ))
            }
            setSharePost(null)
            success('Post shared!')
          }}
        />
      )}

      {/* Remove Follower Confirmation Modal */}
      <AnimatePresence>
        {showRemoveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRemoveConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserX className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Remove Follower</h3>
                <p className="text-white/70 text-sm mb-6">
                  Are you sure you want to remove <span className="text-white font-medium">{showRemoveConfirm.userName}</span> from your followers? They will no longer be able to see your private posts.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowRemoveConfirm(null)}
                    className="flex-1 px-6 py-3 border border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium"
                    disabled={isUpdatingFollow[showRemoveConfirm.userId]}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleRemoveFollower(showRemoveConfirm.userId)
                      setShowRemoveConfirm(null)
                    }}
                    disabled={isUpdatingFollow[showRemoveConfirm.userId]}
                    className="flex-1 px-6 py-3 rounded-xl text-white font-semibold text-sm lg:text-base transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-red-500/25"
                  >
                    {isUpdatingFollow[showRemoveConfirm.userId] ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unfollow Confirmation Modal */}
      <AnimatePresence>
        {showUnfollowConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUnfollowConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserMinus className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Unfollow User</h3>
                <p className="text-white/70 text-sm mb-6">
                  Are you sure you want to unfollow <span className="text-white font-medium">{showUnfollowConfirm.userName}</span>? 
                  {(() => {
                    
                    const userInFollowing = tabData.following.find((user: Partial<ApiUser>) => user.id === showUnfollowConfirm.userId)
                    return userInFollowing?.is_private ? 
                      ' This user has a private profile, so you will no longer be able to see their posts.' : 
                      ' You will no longer see their posts in your feed.'
                  })()}
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowUnfollowConfirm(null)}
                    className="flex-1 px-6 py-3 border border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium"
                    disabled={isUpdatingFollow[showUnfollowConfirm.userId]}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleUserFollowAction(showUnfollowConfirm.userId, true)
                      setShowUnfollowConfirm(null)
                    }}
                    disabled={isUpdatingFollow[showUnfollowConfirm.userId]}
                    className="flex-1 px-6 py-3 rounded-xl text-white font-semibold text-sm lg:text-base transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-red-500/25"
                  >
                    {isUpdatingFollow[showUnfollowConfirm.userId] ? 'Unfollowing...' : 'Unfollow'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Header Unfollow Confirmation Modal */}
      <AnimatePresence>
        {showProfileUnfollowConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowProfileUnfollowConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserMinus className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Unfollow User</h3>
                <p className="text-white/70 text-sm mb-6">
                  Are you sure you want to unfollow <span className="text-white font-medium">{showProfileUnfollowConfirm.userName}</span>?
                  {currentUser?.isPrivate || currentUser?.is_private ? 
                    ' This user has a private profile, so you will no longer be able to see their posts.' : 
                    ' You will no longer see their posts in your feed.'
                  }
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowProfileUnfollowConfirm(null)}
                    className="flex-1 px-6 py-3 border border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleConfirmedProfileUnfollow()
                    }}
                    className="flex-1 px-6 py-3 rounded-xl text-white font-semibold text-sm lg:text-base transition-all duration-300 shadow-lg bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-red-500/25"
                  >
                    Unfollow
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List Unfollow Confirmation Modal */}
      <AnimatePresence>
        {showListUnfollowConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowListUnfollowConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserMinus className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Unfollow User</h3>
                <p className="text-white/70 text-sm mb-6">
                  Are you sure you want to unfollow <span className="text-white font-medium">{showListUnfollowConfirm.userName}</span>?
                  You will no longer see their posts in your feed.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowListUnfollowConfirm(null)}
                    className="flex-1 px-6 py-3 border border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleConfirmedListUnfollow()
                    }}
                    className="flex-1 px-6 py-3 rounded-xl text-white font-semibold text-sm lg:text-base transition-all duration-300 shadow-lg bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-red-500/25"
                  >
                    Unfollow
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Post Modal */}
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

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={imagePreviewState.isOpen}
        imageUrl={imagePreviewState.imageUrl}
        alt={imagePreviewState.alt}
        onClose={handleImagePreviewClose}
      />
    </div>
  )
}