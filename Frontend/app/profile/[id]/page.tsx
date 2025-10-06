'use client'
import { useCallback, useEffect, useState } from 'react'
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

  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [followers, setFollowers] = useState<unknown[]>([])
  const [following, setFollowing] = useState<unknown[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [isFollowing, setIsFollowing] = useState<boolean>(false)
  const [isListVisible, setIsListVisible] = useState(false)
  const [listType, setListType] = useState<'followers' | 'following' | null>(null)

  const userId = params.id as string

  const handleShowFollowers = () => {
    setListType('followers')
    setIsListVisible(true)
  }

  const handleShowFollowing = () => {
    setListType('following')
    setIsListVisible(true)
  }

  const handleCloseList = () => {
    setListType(null)
    setIsListVisible(false)
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

        // Check if current user is following this profile user
        if (followersResponse.status === 'fulfilled') {
          const followersVal = followersResponse.value as Record<string, unknown>
          const isCurrentUserFollowing = Array.isArray(followersVal['followers'] as unknown) ? (followersVal['followers'] as unknown[]).some((follower: unknown) => {
            const f = follower as Record<string, unknown>
            return Number(f['id']) === currentUser?.id
          }) : false
          setIsFollowing(isCurrentUserFollowing || false)
        }
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
      if (isNaN(userIdNum)) {
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
        isOwnProfile={isOwnProfile}
        showPrivacyOverlay={profileUser.is_private && !isOwnProfile}
        isFollowing={isFollowing}
        onShowFollowers={handleShowFollowers}
        onShowFollowing={handleShowFollowing}
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
