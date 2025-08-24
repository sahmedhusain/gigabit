'use client'
import { 
  User, Users, Plus, MessageCircle, Calendar, MapPin, Search, 
  Heart, MessageSquare, Activity, Filter, TrendingUp 
} from 'lucide-react'
import CategoryBadge from '@/components/ui/CategoryBadge'
import { CategoryResponse, Post } from '@/lib/api'

// Categories Section
interface CategoriesSectionProps {
  categories: CategoryResponse[]
  trendingCategories: CategoryResponse[]
  selectedCategory: number | null
  setSelectedCategory: (categoryId: number | null) => void
  categorySearchQuery: string
  setCategorySearchQuery: (query: string) => void
  categorySearchResults: CategoryResponse[]
  isSearching: boolean
  posts: Post[]
  searchCategories: (query: string) => void
}

export function CategoriesSection({
  categories,
  selectedCategory,
  setSelectedCategory,
  categorySearchQuery,
  setCategorySearchQuery,
  categorySearchResults,
  isSearching,
  posts,
  searchCategories
}: CategoriesSectionProps) {
  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-xl lg:text-2xl font-bold text-white">Categories</h2>
          <div className="flex items-center space-x-3">
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-3 lg:px-4 py-2 bg-white/10 border border-white/30 rounded-lg lg:rounded-xl text-white hover:bg-white/20 transition-all duration-200 text-sm lg:text-base"
              >
                Show All
              </button>
            )}
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
          <input
            type="text"
            placeholder="Search categories..."
            value={categorySearchQuery}
            onChange={(e) => {
              setCategorySearchQuery(e.target.value)
              searchCategories(e.target.value)
            }}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4 mb-6">
          {(categorySearchQuery ? categorySearchResults : categories).map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`bg-white/5 hover:bg-white/10 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-left transition-all duration-200 border ${
                selectedCategory === category.id ? 'border-emerald-400/50 ring-2 ring-emerald-400/20' : 'border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <CategoryBadge category={category} size="sm" />
                <span className="text-white/60 text-sm">{category.post_count} posts</span>
              </div>
              <h3 className="text-white font-medium text-base lg:text-lg mb-2">{category.name}</h3>
              {category.description && (
                <p className="text-white/70 text-sm lg:text-base">{category.description}</p>
              )}
            </button>
          ))}
        </div>

        {selectedCategory && (
          <div className="border-t border-white/20 pt-6">
            <h3 className="text-lg lg:text-xl font-semibold text-white mb-4">
              Posts in {categories.find(c => c.id === selectedCategory)?.name}
            </h3>
            <div className="space-y-4">
              {posts.filter(post => post.category?.id === selectedCategory).map((post) => (
                <div key={post.id} className="bg-white/5 rounded-xl lg:rounded-2xl p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-sm lg:text-base">{post.user.name}</h4>
                        <p className="text-white/60 text-xs lg:text-sm">@{post.user.username} • {post.timeAgo}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-white mb-3 lg:mb-4 text-sm lg:text-base">{post.content}</p>
                  <div className="flex items-center space-x-4 text-white/60">
                    <span className="flex items-center space-x-1 text-xs lg:text-sm">
                      <Heart className="w-3 h-3 lg:w-4 lg:h-4" />
                      <span>{post.likes}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-xs lg:text-sm">
                      <MessageSquare className="w-3 h-3 lg:w-4 lg:h-4" />
                      <span>{post.comments}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Followers Section
interface FollowersSectionProps {
  followers: any[]
  following: any[]
  isLoadingFollowers: boolean
}

export function FollowersSection({ followers, following, isLoadingFollowers }: FollowersSectionProps) {
  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-xl lg:text-2xl font-bold text-white">Followers & Following</h2>
          <div className="flex space-x-2">
            <button className="px-3 lg:px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg lg:rounded-xl text-sm lg:text-base">
              Followers
            </button>
            <button className="px-3 lg:px-4 py-2 text-white/70 hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200 text-sm lg:text-base">
              Following
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {isLoadingFollowers ? (
            <div className="col-span-full text-center text-white/60 py-8">
              Loading followers...
            </div>
          ) : (followers?.length ?? 0) === 0 ? (
            <div className="col-span-full text-center text-white/60 py-8">
              No followers yet
            </div>
          ) : (
            (followers || []).map((follower) => (
              <div key={follower.id} className="bg-white/5 rounded-xl lg:rounded-2xl p-3 lg:p-4">
                <div className="flex items-center space-x-3 lg:space-x-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium text-sm lg:text-base truncate">
                      {follower.first_name} {follower.last_name}
                    </h4>
                    <p className="text-white/60 text-xs lg:text-sm truncate">
                      @{follower.nickname || follower.email.split('@')[0]}
                    </p>
                  </div>
                  <button className="px-2 lg:px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg text-white text-xs lg:text-sm hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 flex-shrink-0">
                    Message
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Groups Section
interface Group {
  id: number
  name: string
  description: string
  members: number
  isJoined: boolean
  lastActivity: string
}

interface GroupsSectionProps {
  groups: Group[]
}

export function GroupsSection({ groups }: GroupsSectionProps) {
  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-xl lg:text-2xl font-bold text-white">My Groups</h2>
          <button className="flex items-center px-3 lg:px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg lg:rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {groups.length === 0 ? (
            <div className="col-span-full text-center text-white/60 py-8">
              <p className="text-lg">No groups yet</p>
              <p className="text-sm mt-2">Create or join groups to connect with like-minded people!</p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.id} className="bg-white/5 rounded-xl lg:rounded-2xl p-4 lg:p-6">
                <div className="flex items-start justify-between mb-3 lg:mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg lg:text-xl font-semibold text-white mb-2">{group.name}</h3>
                    <p className="text-white/70 mb-3 text-sm lg:text-base">{group.description}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs lg:text-sm text-white/60">
                      <span>{group.members} members</span>
                      <span>Last activity: {group.lastActivity}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg lg:rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base">
                    View Group
                  </button>
                  <button className="px-3 lg:px-4 py-2 border border-white/30 rounded-lg lg:rounded-xl text-white hover:bg-white/10 transition-all duration-200 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Events Section
interface Event {
  id: number
  title: string
  description: string
  date: string
  time: string
  location: string
  group: string
  going: number
  notGoing: number
  userResponse: string
}

interface EventsSectionProps {
  events: Event[]
}

export function EventsSection({ events }: EventsSectionProps) {
  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-xl lg:text-2xl font-bold text-white">Upcoming Events</h2>
          <button className="flex items-center px-3 lg:px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg lg:rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </button>
        </div>
        
        <div className="space-y-3 lg:space-y-4">
          {events.length === 0 ? (
            <div className="text-center text-white/60 py-8">
              <p className="text-lg">No upcoming events</p>
              <p className="text-sm mt-2">Create or join events to stay connected with your community!</p>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="bg-white/5 rounded-xl lg:rounded-2xl p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0 mb-3 lg:mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg lg:text-xl font-semibold text-white mb-2">{event.title}</h3>
                    <p className="text-white/70 mb-3 text-sm lg:text-base">{event.description}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-xs lg:text-sm text-white/60">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                        {event.date} at {event.time}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                        {event.location}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center lg:text-right">
                    <div className="text-xs lg:text-sm text-white/60 mb-2">From: {event.group}</div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <button className={`px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm ${
                        event.userResponse === 'going' 
                          ? 'bg-emerald-500 text-white' 
                          : 'border border-white/30 text-white hover:bg-white/10'
                      }`}>
                        Going ({event.going})
                      </button>
                      <button className={`px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm ${
                        event.userResponse === 'not_going' 
                          ? 'bg-red-500 text-white' 
                          : 'border border-white/30 text-white hover:bg-white/10'
                      }`}>
                        Not Going ({event.notGoing})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Settings Section
interface SettingsSectionProps {
  currentUser: {
    isPrivate: boolean
  } | null
  testTokenExpiration: () => void
}

export function SettingsSection({ currentUser, testTokenExpiration }: SettingsSectionProps) {
  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
        <h2 className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6">Settings</h2>
        
        <div className="space-y-4 lg:space-y-6">
          {/* Privacy Settings */}
          <div className="bg-white/5 rounded-xl lg:rounded-2xl p-4 lg:p-6">
            <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Privacy & Security</h3>
            <div className="space-y-3 lg:space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <h4 className="text-white font-medium text-sm lg:text-base">Private Profile</h4>
                  <p className="text-white/60 text-xs lg:text-sm">Only followers can see your posts</p>
                </div>
                <button className={`w-10 h-5 lg:w-12 lg:h-6 rounded-full transition-all duration-200 flex-shrink-0 ${
                  currentUser?.isPrivate ? 'bg-emerald-500' : 'bg-white/20'
                }`}>
                  <div className={`w-3 h-3 lg:w-4 lg:h-4 bg-white rounded-full transition-all duration-200 ${
                    currentUser?.isPrivate ? 'translate-x-6 lg:translate-x-7' : 'translate-x-1'
                  }`}></div>
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <h4 className="text-white font-medium text-sm lg:text-base">Show Online Status</h4>
                  <p className="text-white/60 text-xs lg:text-sm">Let others see when you're active</p>
                </div>
                <button className="w-10 h-5 lg:w-12 lg:h-6 bg-emerald-500 rounded-full flex-shrink-0">
                  <div className="w-3 h-3 lg:w-4 lg:h-4 bg-white rounded-full translate-x-6 lg:translate-x-7"></div>
                </button>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white/5 rounded-xl lg:rounded-2xl p-4 lg:p-6">
            <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Notifications</h3>
            <div className="space-y-3 lg:space-y-4">
              <div className="text-white/60 text-sm text-center py-4">
                Notification preferences would be loaded from user settings
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="bg-white/5 rounded-xl lg:rounded-2xl p-4 lg:p-6">
            <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Account</h3>
            <div className="space-y-2 lg:space-y-3">
              <button 
                onClick={testTokenExpiration}
                className="w-full text-left px-3 lg:px-4 py-2 lg:py-3 text-yellow-400 hover:bg-yellow-500/10 rounded-lg lg:rounded-xl transition-all duration-200 text-sm lg:text-base"
              >
                🔍 Test Token Expiration (Check Console)
              </button>
              <button className="w-full text-left px-3 lg:px-4 py-2 lg:py-3 text-white hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200 text-sm lg:text-base">
                Change Password
              </button>
              <button className="w-full text-left px-3 lg:px-4 py-2 lg:py-3 text-white hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200 text-sm lg:text-base">
                Download My Data
              </button>
              <button className="w-full text-left px-3 lg:px-4 py-2 lg:py-3 text-red-400 hover:bg-red-500/10 rounded-lg lg:rounded-xl transition-all duration-200 text-sm lg:text-base">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
