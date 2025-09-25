'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import ProfileSection from '@/components/dashboard/ProfileSection'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { useNotifications } from '@/hooks'
import { api, User, Post } from '@/lib/api'

// Import dashboard components
import TopBar from '@/components/dashboard/TopBar'
import Sidebar from '@/components/dashboard/Sidebar'
import RightSidebar from '@/components/dashboard/RightSidebar'

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { error } = useToast()
  const { isConnected, onlineUsers } = useWebSocket()
  const { items: liveNotifications, unread: liveUnreadCount } = useNotifications()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

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

  // Current User Processing for sidebars
  const currentUserData = currentUser ? {
    id: currentUser.id,
    name: `${currentUser.first_name} ${currentUser.last_name}`,
    username: currentUser.nickname || currentUser.email.split('@')[0],
    avatar: currentUser.avatar,
    isPrivate: currentUser.is_private,
    email: currentUser.email,
    firstName: currentUser.first_name,
    lastName: currentUser.last_name,
    dateOfBirth: currentUser.date_of_birth,
    nickname: currentUser.nickname,
    aboutMe: currentUser.about_me,
    memberSince: currentUser.created_at,
    followers: 0,
    following: 0
  } : null

  // Trending topics
  const trendingTopics = [
    '#SocialNetwork', '#TechNews', '#WebDev', '#AI', '#Startups',
    '#React', '#TypeScript', '#NodeJS', '#Python', '#DevOps'
  ]

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

  const handleTabChange = (newTab: string) => {
    router.push(`/${newTab}`)
  }

  const handleNotificationsToggle = () => {
    router.push('/notifications')
  }

  const handleSearchToggle = () => {
    router.push('/search')
  }

  const handleDiscoverToggle = () => {
    router.push('/discover')
  }

  if (!currentUser) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </ProtectedRoute>
    )
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800 flex items-center justify-center">
          <div className="text-white text-xl">Loading profile...</div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!profileUser) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800 flex items-center justify-center">
          <div className="text-white text-xl">Profile not found</div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          activeTab="profile"
          setActiveTab={handleTabChange}
          feedSubTab="all"
          setFeedSubTab={() => {}}
          activitySubTab="liked"
          setActivitySubTab={() => {}}
          chatSubTab="all"
          setChatSubTab={() => {}}
          chatUnreadAll={0}
          chatUnreadDirect={0}
          chatUnreadGroups={0}
          fetchEvents={() => {}}
          currentUser={currentUserData}
          logout={() => router.push('/login')}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        <TopBar
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          activeTab="profile"
          setActiveTab={handleTabChange}
          onNotificationsClick={handleNotificationsToggle}
          unreadCount={liveUnreadCount || 0}
          onSearchClick={handleSearchToggle}
          onDiscoverClick={handleDiscoverToggle}
        />

        {/* Main Content */}
        <div className={`main-content-layout p-2 lg:p-4 relative z-10 has-fixed-sidebar ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <div className="max-w-7xl mx-auto h-full">
            <div className="flex flex-col lg:flex-row gap-6 h-full">
              {/* Main Content Area */}
              <div className="flex-1 min-w-0 h-full">
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
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Right Sidebar */}
        <RightSidebar
          onlineUsers={onlineUsers}
          followingUsers={following}
          followersUsers={followers}
          trendingTopics={trendingTopics}
          onUserClick={(user) => {
            router.push(`/profile/${user.id}`)
          }}
          currentUser={currentUserData}
          setActiveTab={handleTabChange}
          logout={() => router.push('/login')}
        />
      </div>
    </ProtectedRoute>
  )
}
