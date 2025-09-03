'use client'
import { User, Settings, Lock, Globe } from 'lucide-react'
import { Post } from '@/lib/api'
import { useRealTimePosts, useFollowers, useConnectionStatus } from '@/hooks'

interface ProfileSectionProps {
  currentUser: {
    id: number
    name: string
    username: string
    avatar?: string
    isPrivate: boolean
  } | null
  followers: any[]
  following: any[]
  posts: Post[]
  isLoadingFollowers: boolean
}

export default function ProfileSection({
  currentUser,
  followers,
  following,
  posts,
  isLoadingFollowers
}: ProfileSectionProps) {
  const { posts: realTimePosts, isConnected } = useRealTimePosts()
  const { followers: liveFollowers, following: liveFollowing } = useFollowers()
  const { isConnected: connectionStatus } = useConnectionStatus()
  
  // Use real-time data when connected, fallback to provided data
  const displayPosts = isConnected ? realTimePosts.filter(p => p.user_id === currentUser?.id) : posts
  const displayFollowers = isConnected ? liveFollowers : followers
  const displayFollowing = isConnected ? liveFollowing : following

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-8">
        <div className="flex flex-col items-center space-y-4 lg:flex-row lg:items-start lg:space-y-0 lg:space-x-8">
          <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center overflow-hidden">
            {currentUser?.avatar ? (
              <img 
                src={currentUser.avatar.startsWith('http') ? 
                  currentUser.avatar : 
                  `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${currentUser.avatar}`
                }
                alt={`${currentUser.name}'s avatar`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to default User icon on error
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <User className={`w-12 h-12 lg:w-16 lg:h-16 text-white ${currentUser?.avatar ? 'hidden' : ''}`} />
          </div>
          
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">{currentUser?.name || 'User'}</h2>
            <p className="text-emerald-300 text-base lg:text-lg mb-4">@{currentUser?.username || 'username'}</p>
            
            <div className="flex justify-center lg:justify-start space-x-6 lg:space-x-8 mb-4 lg:mb-6">
              <div className="text-center">
                <div className="text-xl lg:text-2xl font-bold text-white">
                  {displayFollowers?.length ?? 0}
                  {connectionStatus && (
                    <span className="ml-1 text-xs text-emerald-400">●</span>
                  )}
                </div>
                <div className="text-white/60 text-sm lg:text-base">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-xl lg:text-2xl font-bold text-white">
                  {displayFollowing?.length ?? 0}
                  {connectionStatus && (
                    <span className="ml-1 text-xs text-emerald-400">●</span>
                  )}
                </div>
                <div className="text-white/60 text-sm lg:text-base">Following</div>
              </div>
              <div className="text-center">
                <div className="text-xl lg:text-2xl font-bold text-white">
                  {displayPosts?.length ?? 0}
                  {connectionStatus && (
                    <span className="ml-1 text-xs text-emerald-400">●</span>
                  )}
                </div>
                <div className="text-white/60 text-sm lg:text-base">Posts</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
              <button className="flex items-center justify-center px-4 lg:px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base">
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
              
              <button className={`flex items-center justify-center px-4 lg:px-6 py-2 border border-white/30 rounded-xl text-white hover:bg-white/10 transition-all duration-200 text-sm lg:text-base`}>
                {currentUser?.isPrivate ? (
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
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h3 className="text-lg lg:text-xl font-semibold text-white">My Posts</h3>
              {!connectionStatus && (
                <span className="text-xs text-red-400">Offline</span>
              )}
            </div>
            <div className="space-y-3 lg:space-y-4">
              {displayPosts.slice(0, 2).map((post) => (
                <div key={post.id} className="bg-white/5 rounded-xl lg:rounded-2xl p-3 lg:p-4">
                  <p className="text-white mb-2 lg:mb-3 text-sm lg:text-base">{post.content}</p>
                  <div className="flex items-center justify-between text-xs lg:text-sm text-white/60">
                    <span>Just now</span>
                    <div className="flex space-x-3 lg:space-x-4">
                      <span>0 likes</span>
                      <span>0 comments</span>
                    </div>
                  </div>
                </div>
              ))}
              {displayPosts.length === 0 && (
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
  )
}
