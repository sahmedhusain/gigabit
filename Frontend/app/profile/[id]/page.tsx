'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import ProfileSection from '@/components/dashboard/ProfileSection'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { api, User, Post } from '@/lib/api'

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { error } = useToast()
  
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [followers, setFollowers] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)

  const userId = params.id as string

  useEffect(() => {
    if (userId && currentUser) {
      const userIdNum = parseInt(userId)
      if (isNaN(userIdNum)) {
        error('Invalid user ID')
        router.push('/dashboard')
        return
      }
      setIsOwnProfile(userIdNum === currentUser.id)
      fetchUserProfile(userIdNum)
    }
  }, [userId, currentUser])

  const fetchUserProfile = async (userIdNum: number) => {
    try {
      setIsLoading(true)
      console.log('Fetching profile for user:', userIdNum)
      
      // First try to get basic profile info
      try {
        const profileData = await api.getProfile(userIdNum)
        setProfileUser(profileData)
        
        // Try to get additional data - these may fail for private profiles
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
        
        // Handle followers response
        if (followersResponse.status === 'fulfilled') {
          setFollowers(followersResponse.value.followers || [])
        } else {
          console.warn('Failed to load followers:', followersResponse.reason)
          setFollowers([])
        }
        
        // Handle following response
        if (followingResponse.status === 'fulfilled') {
          setFollowing(followingResponse.value.following || [])
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
          console.log('Private profile detected, trying to get basic user info')
          
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
              console.log('Got basic user info for private profile:', basicUser)
              
              // Don't try to fetch posts/followers/following for private profiles
              setUserPosts([])
              setFollowers([])
              setFollowing([])
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
      error('Failed to load user profile.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackClick = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
          <div className="text-white text-xl">Loading profile...</div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!profileUser) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
          <div className="text-white text-xl">Profile not found</div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header with Back Button */}
          <div className="flex items-center mb-6">
            <button
              onClick={handleBackClick}
              className="flex items-center text-white hover:text-emerald-300 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-white">
              {isOwnProfile ? 'My Profile' : `${profileUser.first_name} ${profileUser.last_name}'s Profile`}
            </h1>
          </div>

          {/* Profile Content - Use ProfileSection but without edit buttons for other users */}
          <UserProfileSection
            profileUser={profileUser}
            followers={followers}
            following={following}
            posts={userPosts}
            isOwnProfile={isOwnProfile}
            isLoadingFollowers={isLoading}
            isFollowing={isFollowing}
          />
        </div>
      </div>
    </ProtectedRoute>
  )
}

// Custom ProfileSection for user profiles (excludes edit buttons for other users)
interface UserProfileSectionProps {
  profileUser: User
  followers: any[]
  following: any[]
  posts: Post[]
  isOwnProfile: boolean
  isLoadingFollowers: boolean
  isFollowing: boolean
}

function UserProfileSection({
  profileUser,
  followers,
  following,
  posts,
  isOwnProfile,
  isLoadingFollowers,
  isFollowing
}: UserProfileSectionProps) {
  // Transform the User data to match ProfileSection expectations
  const transformedUser = {
    id: profileUser.id,
    name: `${profileUser.first_name} ${profileUser.last_name}`,
    username: profileUser.nickname || `user${profileUser.id}`,
    avatar: profileUser.avatar,
    isPrivate: profileUser.is_private,
    email: profileUser.email,
    firstName: profileUser.first_name,
    lastName: profileUser.last_name,
    dateOfBirth: profileUser.date_of_birth,
    nickname: profileUser.nickname || '',
    aboutMe: profileUser.about_me || '',
    memberSince: profileUser.created_at
  }

  // Determine if we should show privacy overlay
  const shouldShowPrivacyOverlay = profileUser.is_private && !isOwnProfile

  return (
    <ProfileSection
      currentUser={transformedUser}
      followers={followers}
      following={following}
      posts={posts}
      isLoadingFollowers={isLoadingFollowers}
      isOwnProfile={isOwnProfile}
      showPrivacyOverlay={shouldShowPrivacyOverlay}
      isFollowing={isFollowing} // Pass the actual follow status
    />
  )
}
