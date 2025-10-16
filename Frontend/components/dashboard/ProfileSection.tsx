'use client'
import Image from 'next/image'
import { User, Lock, Globe } from 'lucide-react'
import { Post, api } from '@/lib/api'
import { useRealTimePosts, useFollowers, useConnectionStatus, useFollowerCounts } from '@/hooks'
import { getAvatarUrl } from '@/utils/avatarUtils'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/context/ToastContext'
import FollowHandler, { FollowStatus, getFollowStatusFromAPI } from './FollowHandler'

interface ProfileSectionProps {
  currentUser: {
    id: number
    name: string
    username: string
    avatar?: string
    isPrivate: boolean
    email: string
    firstName: string
    lastName: string
    dateOfBirth: string
    nickname: string
    aboutMe: string
    memberSince: string
    is_private?: boolean
    first_name?: string
    last_name?: string
  } | null
  followers: unknown[]
  following: unknown[]
  posts: Post[]
  isOwnProfile?: boolean
  showPrivacyOverlay?: boolean
  isFollowing?: boolean
  initialFollowerCount?: number
  initialFollowingCount?: number
}

export default function ProfileSection({
  currentUser,
  followers,
  following,
  posts,
  isOwnProfile = true,
  showPrivacyOverlay = false,
  isFollowing = false,
  initialFollowerCount,
  initialFollowingCount
}: ProfileSectionProps) {
  const router = useRouter()
  const { posts: realTimePosts, isConnected } = useRealTimePosts()
  const { followers: liveFollowers, following: liveFollowing } = useFollowers()
  const { isConnected: connectionStatus } = useConnectionStatus()
  const { followerCounts, isConnected: countsConnected } = useFollowerCounts(
    followers?.length || 0,
    following?.length || 0
  )

  // Add follow status state management
  const [followStatus, setFollowStatus] = useState<FollowStatus>(
    getFollowStatusFromAPI(isFollowing)
  )

  // Add privacy toggle state
  const [showPrivacyConfirm, setShowPrivacyConfirm] = useState(false)
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false)
  const [currentPrivacySetting, setCurrentPrivacySetting] = useState(currentUser?.isPrivate || false)
  const { success, error } = useToast()
  
  // User list overlay state
  const [showUserListOverlay, setShowUserListOverlay] = useState(false)
  const [userListType, setUserListType] = useState<'followers' | 'following' | null>(null)
  const [userListData, setUserListData] = useState<any[]>([])
  const [isLoadingUserList, setIsLoadingUserList] = useState(false)

  // Handle follow status changes
  const handleFollowStatusChange = (newStatus: FollowStatus) => {
    setFollowStatus(newStatus)
  }

  // Handle user list overlay
  const handleShowUserList = async (type: 'followers' | 'following') => {
    if (!currentUser) return

    // Check if profile is private and is not my own profile
    if (currentUser.isPrivate && !isOwnProfile) {
      setUserListType(type)
      setUserListData([])
      setShowUserListOverlay(true)
      return
    }

    setIsLoadingUserList(true)
    setUserListType(type)
    setShowUserListOverlay(true)

    try {
      let response
      if (type === 'followers') {
        response = await api.getFollowers(currentUser.id)
        setUserListData(response.followers || [])
      } else {
        response = await api.getFollowing(currentUser.id)
        setUserListData(response.following || [])
      }
    } catch (err) {
      console.error(`Error fetching ${type}:`, err)
      error(`Failed to load ${type}`)
      setUserListData([])
    } finally {
      setIsLoadingUserList(false)
    }
  }

  const handleCloseUserList = () => {
    setShowUserListOverlay(false)
    setUserListType(null)
    setUserListData([])
    setIsLoadingUserList(false)
  }

  const handleUserClick = (user: any) => {
    // Navigate to user's profile
    router.push(`/profile/${user.id}`)
  }

  // Handle privacy toggle
  const handlePrivacyToggle = () => {
    if (currentPrivacySetting) {
      // If currently private, show confirmation to make public
      setShowPrivacyConfirm(true)
    } else {
      // If currently public, directly make private (no confirmation needed)
      updatePrivacySetting(true)
    }
  }

  const updatePrivacySetting = async (makePrivate: boolean) => {
    if (!currentUser) return

    setIsUpdatingPrivacy(true)
    try {
      // Call the API to update privacy setting
      await api.updateUserPrivacy(currentUser.id, makePrivate)

      success(`Profile is now ${makePrivate ? 'private' : 'public'}`)

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
      error('Failed to update privacy setting. Please try again.')
    } finally {
      setIsUpdatingPrivacy(false)
      setShowPrivacyConfirm(false)
    }
  }  // Use real-time data when connected, fallback to provided data
  const displayPosts = posts // Use fetched posts for profile, real-time is for feed
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

  return (
    <div className="h-full flex flex-col">
      {/* Profile Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-8 mb-4 lg:mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center overflow-hidden">
              {getAvatarUrl(currentUser?.avatar) ? (
                <>
                  <Image
                    src={getAvatarUrl(currentUser?.avatar)!}
                    alt={`${currentUser?.name}&apos;s avatar`}
                    width={128}
                    height={128}
                    unoptimized={getAvatarUrl(currentUser?.avatar)!.includes('/svg')}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to default User icon on error
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <User className="w-12 h-12 lg:w-16 lg:h-16 text-white hidden" />
                </>
              ) : (
                <User className="w-12 h-12 lg:w-16 lg:h-16 text-white" />
              )}
            </div>

            {/* Follow/Unfollow Button - Only show for other users' profiles */}
            {!isOwnProfile && currentUser && (
              <div className="mt-4">
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
                    updated_at: new Date().toISOString(),
                    status: 'online',
                    last_status_change: new Date().toISOString()
                  }}
                  currentFollowStatus={followStatus}
                  onStatusChange={handleFollowStatusChange}
                  disabled={!connectionStatus}
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* Middle Column - Name, Username, Email */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">{currentUser?.name || 'User'}</h2>
            <p className="text-emerald-300 text-base lg:text-lg mb-2">@{currentUser?.username || 'username'}</p>
            <p className="text-white/60 text-xs">✉️ {currentUser?.email || 'No email'}</p>

            <div className="flex justify-center lg:justify-start space-x-6 lg:space-x-8 mb-4 lg:mb-6 mt-6">

              <div className="text-center p-2">
                <div className="text-xl lg:text-2xl font-bold text-white">
                  {displayPosts?.length ?? 0}
                </div>
                <div className="text-white/60 text-sm lg:text-base">Posts</div>
              </div>

              <div className="text-center cursor-pointer hover:bg-white/5 rounded-lg p-2 transition-colors" onClick={() => handleShowUserList('following')}>
                <div className="text-xl lg:text-2xl font-bold text-white">
                  {followingCount}
                </div>
                <div className="text-white/60 text-sm lg:text-base">Following</div>
              </div>

              <div className="text-center cursor-pointer hover:bg-white/5 rounded-lg p-2 transition-colors" onClick={() => handleShowUserList('followers')}>
                <div className="text-xl lg:text-2xl font-bold text-white">
                  {followersCount}
                </div>
                <div className="text-white/60 text-sm lg:text-base">Followers</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
              {isOwnProfile && (
                <button
                  onClick={handlePrivacyToggle}
                  disabled={isUpdatingPrivacy}
                  className={`flex items-center justify-center px-4 lg:px-6 py-2 border border-white/30 rounded-xl text-white hover:bg-white/10 transition-all duration-200 text-sm lg:text-base ${isUpdatingPrivacy ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  {isUpdatingPrivacy ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : currentPrivacySetting ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Private Profile
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      Public Profile
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Right Column - Bio and Date of Birth */}
          <div className="text-center lg:text-left">
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Bio</h4>
              <p className="text-white/80 text-sm">
                {currentUser?.aboutMe || 'This user hasn&apos;t written a bio yet.'}
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Date of Birth</h4>
              <p className="text-white/80 text-sm">
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
          </div>
        </div>







      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Privacy Overlay for Private Profiles */}
        {showPrivacyOverlay && !isOwnProfile && !isFollowing && (
          <div className="absolute inset-0 bg-gray-900 rounded-2xl lg:rounded-3xl flex items-center justify-center z-10">
            <div className="text-center p-6">
              <Lock className="w-12 h-12 text-white/70 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-white mb-2">Private Profile</h4>
              <p className="text-white/70">This user&apos;s profile is private. Follow them to see their details.</p>
            </div>
          </div>
        )}

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6 relative">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <h3 className="text-lg lg:text-xl font-semibold text-white">Posts</h3>
                {!connectionStatus && (
                  <span className="text-xs text-red-400">Offline</span>
                )}
              </div>

              <div className="space-y-3 lg:space-y-4">
                {displayPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white/5 rounded-xl lg:rounded-2xl p-3 lg:p-4 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handlePostClick(post.id)}
                  >
                    <p className="text-white mb-2 lg:mb-3 text-sm lg:text-base">{post.content}</p>
                    <div className="flex items-center justify-between text-xs lg:text-sm text-white/60">
                      <span>Just now</span>
                      <div className="flex space-x-3 lg:space-x-4">
                        <span>{(post as { like_count?: number; likes?: number }).like_count || (post as { like_count?: number; likes?: number }).likes || 0} likes</span>
                        <span>{Array.isArray((post as unknown as { comments?: unknown[] }).comments) ? (post as unknown as { comments?: unknown[] }).comments!.length : ((post as unknown as { comment_count?: number; comments?: number }).comment_count || (post as unknown as { comment_count?: number; comments?: number }).comments || 0)} comments</span>
                      </div>
                    </div>
                  </div>
                ))}
                {displayPosts.length === 0 && !showPrivacyOverlay && (
                  <div className="text-white/60 text-center py-8">
                    <p className="text-sm">No posts yet</p>
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

          <div className="space-y-4 lg:space-y-6">
            {/* Activity */}
            <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
              <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Recent Activity</h3>
              <div className="space-y-2 lg:space-y-3">
                <div className="text-white/60 text-xs lg:text-sm text-center py-4">
                  No recent activity
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User List Overlay */}
      {showUserListOverlay && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-w-md w-full mx-4 max-h-[70vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                {userListType === 'followers' ? 'Followers' : 'Following'}
              </h3>
              <button
                onClick={handleCloseUserList}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <span className="text-white text-xl">×</span>
              </button>
            </div>

            <div className="overflow-y-auto max-h-96">
              {/* If its a private profile */}
              {currentUser?.isPrivate && !isOwnProfile ? (
                <div className="text-center py-8">
                  <Lock className="w-12 h-12 text-white/70 mx-auto mb-4" />
                  <p className="text-white/70 mb-2">Private Account</p>
                  <p className="text-white/50 text-sm">
                    We want to protect our community. {currentUser?.firstName + ' ' + currentUser?.lastName} has a private {userListType} list.
                  </p>
                </div>
              ) : isLoadingUserList ? (
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
              ) : userListData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/70">
                    No {userListType} yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {userListData.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-3 p-3 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
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
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-white/60 text-sm truncate">
                          @{user.nickname || user.email.split('@')[0]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Privacy Confirmation Modal */}
      {showPrivacyConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-w-md mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Make Profile Public?</h3>
            <p className="text-white/70 mb-6">
              Are you sure you want to make your account public? Anyone will be able to see your profile and posts.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPrivacyConfirm(false)}
                className="flex-1 px-4 py-2 border border-white/30 rounded-xl text-white hover:bg-white/10 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => updatePrivacySetting(false)}
                disabled={isUpdatingPrivacy}
                className={`flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 ${isUpdatingPrivacy ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {isUpdatingPrivacy ? 'Updating...' : 'Make Public'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}