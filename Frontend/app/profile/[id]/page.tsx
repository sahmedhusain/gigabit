'use client'
import { useCallback, useEffect, useState, use } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import ProfileSection from '@/components/dashboard/ProfileSection'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { api, User, Post } from '@/lib/api'

function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { error } = useToast()
  const userId = (params as { id: string }).id

  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [followers, setFollowers] = useState<unknown[]>([])
  const [following, setFollowing] = useState<unknown[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [isFollowing, setIsFollowing] = useState<boolean>(false)
  const [showPrivacyOverlay, setShowPrivacyOverlay] = useState<boolean>(false)
  const handleLikePost = async (postId: number) => {
    const post = userPosts.find((p) => p.id === postId)
    const wasLiked = post?.isLiked || false

    try {
      if (wasLiked) {
        await api.unlikePost(postId)
      } else {
        await api.likePost(postId)
      }

      setUserPosts(userPosts.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !wasLiked, likes: p.likes + (wasLiked ? -1 : 1) }
          : p
      ))
    } catch (err) {
      console.error('Error toggling like:', err)
      setUserPosts(userPosts.map((p) =>
        p.id === postId
          ? { ...p, isLiked: wasLiked, likes: p.likes }
          : p
      ))
      error('Unable to update like right now.')
    }
  }

  const handleBookmarkPost = async (postId: number) => {
    const post = userPosts.find((p) => p.id === postId)
    const wasBookmarked = post?.isBookmarked || false

    try {
      if (wasBookmarked) {
        await api.unbookmarkPost(postId)
      } else {
        await api.toggleBookmark(postId)
      }

      setUserPosts(userPosts.map((p) =>
        p.id === postId
          ? { ...p, isBookmarked: !wasBookmarked }
          : p
      ))
    } catch (err) {
      console.error('Error toggling bookmark:', err)
      setUserPosts(userPosts.map((p) =>
        p.id === postId
          ? { ...p, isBookmarked: wasBookmarked }
          : p
      ))
      error('Unable to update bookmark right now.')
    }
  }

  const handlePostPrivacyUpdate = async (postId: number, privacy: string) => {
    setUserPosts(prevPosts => {
      const updatedPosts = prevPosts.map((p) =>
        p.id === postId
          ? { ...p, privacy: privacy }
          : p
      )
      return updatedPosts
    })
  } 


  const fetchUserProfile = useCallback(async (userIdNum: number) => {
    try {
      setIsLoading(true)

      // First try to get basic profile info
      try {
        const profileData = await api.getProfile(userIdNum)
        setProfileUser(profileData)
        console.log('Profile data:', profileData)
        // Check if profile data includes follower/following counts
        const profileDataRec = profileData as unknown as Record<string, unknown>
        if (profileDataRec['follower_count'] !== undefined) {
          // followerCount not used, skip setting
        }
        if (profileDataRec['following_count'] !== undefined) {
          // followingCount not used, skip setting
        }

        // Get follow status between current user and profile user
        if (currentUser && currentUser.id !== userIdNum) {
          try {
            const followStatusData = await api.getFollowStatus(userIdNum)
            setIsFollowing(followStatusData.is_following)
            // Determine if privacy overlay should be shown
            setShowPrivacyOverlay(profileData.is_private && !followStatusData.is_following)
          } catch (followError) {
            console.warn('Failed to get follow status:', followError)
            // If we can't get follow status, assume not following for privacy overlay
            setIsFollowing(false)
            setShowPrivacyOverlay(profileData.is_private)
          }
        } else {
          // Own profile or no current user
          setIsFollowing(false)
          setShowPrivacyOverlay(false)
        }

        // get more data
        const [postsResponse, followersResponse, followingResponse] = await Promise.allSettled([
          api.getUserPosts(userIdNum),
          api.getFollowers(userIdNum),
          api.getFollowing(userIdNum)
        ])

        // Handle posts response (can fail for private profiles)
        if (postsResponse.status === 'fulfilled') {
          setUserPosts(postsResponse.value.posts || [])
        } else {
          console.warn('Failed to load user posts:', postsResponse.reason)
          setUserPosts([])
        }

        // Handle followers response - always extract count even if followers list is restricted
        if (followersResponse.status === 'fulfilled') {
          const followersData = followersResponse.value.followers || []
          setFollowers(followersData)
          // followerCount not used, skip setting
        } else {
          console.warn('Failed to load followers:', followersResponse.reason)
          setFollowers([])
        }

        // Handle following response - always extract count even if following list is restricted
        if (followingResponse.status === 'fulfilled') {
          const followingData = followingResponse.value.following || []
          setFollowing(followingData)
          // followingCount not used, skip setting
        } else {
          console.warn('Failed to load following:', followingResponse.reason)
          setFollowing([])
        }

        // Remove the incorrect follow status logic - let FollowHandler handle it
        setIsFollowing(false) // Reset to false, FollowHandler will set correct status
      } catch (profileError: unknown) {
        console.error('Profile fetch failed:', profileError)

        const profileErr = profileError as Record<string, unknown>

        // Check if it's a private profile error
        if (profileErr['status'] === 403) {

          // Try to get basic user info from the users list
          try {
            const usersResponse = await api.getUsers()
            const targetUser = (usersResponse.users as unknown[]).find((u: unknown) => {
              const uu = u as Record<string, unknown>
              return Number(uu['id']) === userIdNum
            })

            if (targetUser) {
              // Create a basic user object for private profile display
              const basicUser = {
                ...(targetUser as User),
                is_private: true // Ensure it's marked as private
              }
              setProfileUser(basicUser)

              setIsFollowing(false)
              setShowPrivacyOverlay(true) // Always show overlay for private profiles when we can't access full data

              // Don't try to fetch posts for private profiles
              setUserPosts([])
            } else {
              error('User not found.')
              return
            }
          } catch (usersError) {
            console.error('Failed to get basic user info:', usersError)
            error('This profile is private and you do not have permission to view it.')
            return
          }
        } else if (profileErr['status'] === 404) {
          error('User not found.')
          return
        } else {
          error('Failed to load user profile.')
          return
        }
      }
    } catch (err: unknown) {
      console.error('Error fetching user profile:', err)
      const errRec = err as Record<string, unknown>
      if (errRec['status'] === 403) {
        error('This profile is private and you do not have permission to view it.')
      } else if (errRec['status'] === 404) {
        error('User not found.')
      } else {
        error('Failed to load user profile.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [currentUser, error])

  useEffect(() => {
    if (userId && currentUser) {
      const userIdNum = parseInt(userId)
      if (isNaN(userIdNum) || userId === 'undefined') {
        error('Invalid user ID')
        router.push('/feed/all')
        return
      }
      setIsOwnProfile(userIdNum === currentUser.id)
      fetchUserProfile(userIdNum)
    }
  }, [userId, currentUser, error, fetchUserProfile, router])

  if (!currentUser) {
    return (
      <AppLayout activeTab="profile">
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </AppLayout>
    )
  }

  if (isLoading) {
    return (
      <AppLayout activeTab="profile">
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800 flex items-center justify-center">
          <div className="text-white text-xl">Loading profile...</div>
        </div>
      </AppLayout>
    )
  }

  if (!profileUser) {
    return (
      <AppLayout activeTab="profile">
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800 flex items-center justify-center">
          <div className="text-white text-xl">Profile not found</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout activeTab="profile">
      <ProfileSection
        currentUser={profileUser ? {
          id: profileUser.id,
          name: profileUser.is_deleted ? 'Deleted Account' : `${profileUser.first_name} ${profileUser.last_name}`,
          username: profileUser.is_deleted ? 'deleted' : (profileUser.nickname || profileUser.email?.split('@')[0] || 'user'),
          avatar: profileUser.avatar,
          isPrivate: profileUser.is_private,
          email: profileUser.is_deleted ? 'deleted@example.com' : profileUser.email,
          firstName: profileUser.is_deleted ? 'Deleted' : profileUser.first_name,
          lastName: profileUser.is_deleted ? 'Account' : profileUser.last_name,
          dateOfBirth: profileUser.date_of_birth,
          nickname: profileUser.is_deleted ? 'deleted' : profileUser.nickname,
          aboutMe: profileUser.is_deleted ? 'This account has been deleted' : profileUser.about_me,
          gender: profileUser.gender,
          memberSince: profileUser.created_at,
          genderPrivacy: profileUser.gender_privacy,
          birthdayPrivacy: profileUser.birthday_privacy,
          is_private: profileUser.is_private,
          first_name: profileUser.is_deleted ? 'Deleted' : profileUser.first_name,
          last_name: profileUser.is_deleted ? 'Account' : profileUser.last_name,
          is_deleted: profileUser.is_deleted
        } : null}
        followers={followers}
        following={following}
        posts={userPosts}
        isOwnProfile={isOwnProfile}
        showPrivacyOverlay={showPrivacyOverlay}
        onPostLike={handleLikePost}
        onPostBookmark={handleBookmarkPost}
        onPostPrivacyUpdate={handlePostPrivacyUpdate}
      />
    </AppLayout>
  )
}

function ProtectedProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  )
}

export default ProtectedProfilePage
