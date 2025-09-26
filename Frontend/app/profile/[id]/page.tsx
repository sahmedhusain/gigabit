'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import ProfileSection from '@/components/dashboard/ProfileSection'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useNotifications } from '@/hooks'
import { api, User, Post } from '@/lib/api'

function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { error } = useToast()
  const { isConnected, onlineUsers } = useWebSocket()
  const { items: liveNotifications, unread: liveUnreadCount } = useNotifications()

  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [followers, setFollowers] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [followerCount, setFollowerCount] = useState<number>(0)
  const [followingCount, setFollowingCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [isFollowing, setIsFollowing] = useState<boolean>(false)

  const userId = params.id as string

  useEffect(() => {
    if (userId && currentUser) {
      const userIdNum = parseInt(userId)
      if (isNaN(userIdNum)) {
        error('Invalid user ID')
        router.push('/feed/all')
        return
      }
      setIsOwnProfile(userIdNum === currentUser.id)
      fetchUserProfile(userIdNum)
    }
  }, [userId, currentUser])

  const fetchUserProfile = async (userIdNum: number) => {
    try {
      setIsLoading(true)

      // First try to get basic profile info
      try {
        const profileData = await api.getProfile(userIdNum)
        setProfileUser(profileData)

        // Check if profile data includes follower/following counts
        const profileDataAny = profileData as any
        if (profileDataAny.follower_count !== undefined) {
          setFollowerCount(profileDataAny.follower_count)
        }
        if (profileDataAny.following_count !== undefined) {
          setFollowingCount(profileDataAny.following_count)
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
          setFollowerCount(followersResponse.value.count || followersData.length || 0)
        } else {
          console.warn('Failed to load followers:', followersResponse.reason)
          setFollowers([])
        }

        // Handle following response - always extract count even if following list is restricted
        if (followingResponse.status === 'fulfilled') {
          const followingData = followingResponse.value.following || []
          setFollowing(followingData)
          setFollowingCount(followingResponse.value.count || followingData.length || 0)
        } else {
          console.warn('Failed to load following:', followingResponse.reason)
          setFollowing([])
        }

        // Check if current user is following this profile user
        if (followersResponse.status === 'fulfilled') {
          const isCurrentUserFollowing = followersResponse.value.followers?.some(
            (follower: any) => follower.id === currentUser?.id
          )
          setIsFollowing(isCurrentUserFollowing || false)
        }      } catch (profileError: any) {
        console.error('Profile fetch failed:', profileError)

        // Check if it's a private profile error
        if (profileError?.status === 403) {

          // Try to get basic user info from the users list
          try {
            const usersResponse = await api.getUsers()
            const targetUser = usersResponse.users.find((u: any) => u.id === userIdNum)

            if (targetUser) {
              // Create a basic user object for private profile display
              const basicUser = {
                ...targetUser,
                is_private: true // Ensure it's marked as private
              }
              setProfileUser(basicUser)

              setIsFollowing(false)

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
        } else if (profileError?.status === 404) {
          error('User not found.')
          return
        } else {
          error('Failed to load user profile.')
          return
        }
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err)
      if (err.status === 403) {
        error('This profile is private and you do not have permission to view it.')
      } else if (err.status === 404) {
        error('User not found.')
      } else {
        error('Failed to load user profile.')
      }
    } finally {
      setIsLoading(false)
    }
  }

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
          name: `${profileUser.first_name} ${profileUser.last_name}`,
          username: profileUser.nickname || profileUser.email.split('@')[0],
          avatar: profileUser.avatar,
          isPrivate: profileUser.is_private,
          email: profileUser.email,
          firstName: profileUser.first_name,
          lastName: profileUser.last_name,
          dateOfBirth: profileUser.date_of_birth,
          nickname: profileUser.nickname,
          aboutMe: profileUser.about_me,
          memberSince: profileUser.created_at
        } : null}
        followers={followers}
        following={following}
        posts={userPosts}
        isLoadingFollowers={isLoading}
        isOwnProfile={isOwnProfile}
        showPrivacyOverlay={profileUser.is_private && !isOwnProfile}
        isFollowing={isFollowing}
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
