'use client'
import { useState } from 'react'
import { Home, User, MessageCircle, Activity, Users, Calendar, Settings, X, Sparkles, Bell, LogOut, Heart, ChevronDown } from 'lucide-react'

interface SidebarProps {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  feedSubTab: string
  setFeedSubTab: (subTab: string) => void
  activitySubTab: string
  setActivitySubTab: (subTab: string) => void
  communitySubTab: string
  setCommunitySubTab: (subTab: string) => void
  fetchEvents: () => void
  currentUser: {
    id: number
    name: string
    username: string
    avatar?: string
    isPrivate: boolean
    followers: number
    following: number
  } | null
  logout: () => void
}

export default function Sidebar({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  activeTab,
  setActiveTab,
  feedSubTab,
  setFeedSubTab,
  activitySubTab,
  setActivitySubTab,
  communitySubTab,
  setCommunitySubTab,
  fetchEvents,
  currentUser,
  logout
}: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [userStatus, setUserStatus] = useState('online')

  const menuSections = [
    {
      title: 'Feed',
      items: [
        {
          id: 'all',
          label: 'All Posts',
          icon: Home,
          description: 'See all public posts',
          color: 'from-emerald-500 to-teal-600',
          onClick: () => {
            setActiveTab('feed')
            setFeedSubTab('all')
          },
          isActive: activeTab === 'feed' && feedSubTab === 'all'
        },
        {
          id: 'following',
          label: 'Following',
          icon: Users,
          description: 'Posts from people you follow',
          color: 'from-emerald-500 to-teal-600',
          onClick: () => {
            setActiveTab('feed')
            setFeedSubTab('following')
          },
          isActive: activeTab === 'feed' && feedSubTab === 'following'
        },
        {
          id: 'friends',
          label: 'Friends',
          icon: Heart,
          description: 'Posts from your friends',
          color: 'from-emerald-500 to-teal-600',
          onClick: () => {
            setActiveTab('feed')
            setFeedSubTab('friends')
          },
          isActive: activeTab === 'feed' && feedSubTab === 'friends'
        }
      ]
    },
    {
      title: 'Your Activity',
      items: [
        {
          id: 'liked',
          label: 'Liked Posts',
          icon: Heart,
          description: 'Posts you\'ve liked',
          color: 'from-teal-500 to-cyan-600',
          onClick: () => {
            setActiveTab('activity')
            setActivitySubTab('liked')
          },
          isActive: activeTab === 'activity' && activitySubTab === 'liked'
        },
        {
          id: 'commented',
          label: 'Commented Posts',
          icon: MessageCircle,
          description: 'Posts you\'ve commented on',
          color: 'from-teal-500 to-cyan-600',
          onClick: () => {
            setActiveTab('activity')
            setActivitySubTab('commented')
          },
          isActive: activeTab === 'activity' && activitySubTab === 'commented'
        },
        {
          id: 'saved',
          label: 'Saved Posts',
          icon: Sparkles,
          description: 'Your bookmarked posts',
          color: 'from-teal-500 to-cyan-600',
          onClick: () => {
            setActiveTab('activity')
            setActivitySubTab('saved')
          },
          isActive: activeTab === 'activity' && activitySubTab === 'saved'
        }
      ]
    },
    {
      title: 'Community',
      items: [
        {
          id: 'events',
          label: 'Events',
          icon: Calendar,
          description: 'Upcoming events',
          color: 'from-cyan-500 to-emerald-600',
          onClick: () => {
            setActiveTab('community')
            setCommunitySubTab('events')
            fetchEvents()
          },
          isActive: activeTab === 'community' && communitySubTab === 'events'
        },
        {
          id: 'activity-history',
          label: 'Activity History',
          icon: Activity,
          description: 'Your recent activity',
          color: 'from-cyan-500 to-emerald-600',
          onClick: () => {
            setActiveTab('community')
            setCommunitySubTab('activity')
          },
          isActive: activeTab === 'community' && communitySubTab === 'activity'
        }
      ]
    }
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed top-16 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        sidebar-layout bg-gradient-to-br from-emerald-900/95 via-teal-900/95 to-cyan-800/95 backdrop-blur-xl border-r border-emerald-400/20 shadow-2xl transform transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Profile Dropdown */}
          <div className="p-4 border-b border-emerald-400/20">
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!isProfileDropdownOpen)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/10 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full p-1 flex-shrink-0 ring-2 ${userStatus === 'online' ? 'ring-green-500' : userStatus === 'busy' ? 'ring-red-500' : 'ring-gray-500'}`}>
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                        {currentUser?.name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-white truncate block">
                      {currentUser?.name || 'User'}
                    </span>
                    <p className="text-xs text-emerald-100/60 truncate">@{currentUser?.username || 'username'}</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-white/70 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileDropdownOpen && (
                <div className="bg-black/20 backdrop-blur-lg rounded-lg shadow-xl py-2 mt-2">
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-white/70 mb-2">Status</p>
                    <div className="flex items-center justify-around">
                      <button onClick={() => setUserStatus('online')} className={`p-2 rounded-full ${userStatus === 'online' ? 'bg-green-500/50' : ''}`} title="Online"><div className="w-3 h-3 bg-green-500 rounded-full"></div></button>
                      <button onClick={() => setUserStatus('busy')} className={`p-2 rounded-full ${userStatus === 'busy' ? 'bg-red-500/50' : ''}`} title="Busy"><div className="w-3 h-3 bg-red-500 rounded-full"></div></button>
                      <button onClick={() => setUserStatus('offline')} className={`p-2 rounded-full ${userStatus === 'offline' ? 'bg-gray-500/50' : ''}`} title="Offline"><div className="w-3 h-3 bg-gray-500 rounded-full"></div></button>
                    </div>
                  </div>
                  <hr className="border-white/10 my-2" />
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>My Profile</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('settings')}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <hr className="border-white/10 my-2" />
                  <button 
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-400/20 scrollbar-track-transparent">
            <div className="p-4 space-y-4">
              {menuSections.map((section) => (
                <div key={section.title} className="space-y-2">
                  {/* Section Title */}
                  <div className="px-3 py-2">
                    <h3 className="text-emerald-100/70 text-sm font-semibold uppercase tracking-wider">
                      {section.title}
                    </h3>
                  </div>

                  {/* Section Items */}
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      const isActive = item.isActive
                      const isHovered = hoveredItem === item.id

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            item.onClick()
                            setIsMobileMenuOpen(false)
                          }}
                          onMouseEnter={() => setHoveredItem(item.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className={`w-full group relative overflow-hidden rounded-md transition-all duration-300 ${isActive ? `bg-gradient-to-r ${item.color} shadow-md scale-101 transform` : 'hover:bg-emerald-500/10 hover:scale-100 hover:shadow-sm'}`}
                        >
                          <div className={`flex items-center space-x-3 p-3 ${isActive ? 'text-white' : 'text-emerald-100/80 group-hover:text-white'}`}>
                            <div className={`p-1.5 rounded-md transition-all duration-300 ${isActive ? 'bg-white/20 shadow-sm' : 'bg-emerald-400/10 group-hover:bg-emerald-400/20'}`}>
                              <Icon className={`w-4 h-4 transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`} />
                            </div>
                            <div className="text-left flex-1">
                              <span className="font-semibold text-sm">{item.label}</span>
                            </div>
                          </div>

                          {/* Active item glow effect */}
                          {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50 animate-pulse"></div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-0.5 h-0.5 bg-emerald-400/20 rounded-full animate-float particle-${i + 1}`}
            />
          ))}
        </div>
      </aside>
    </>
  )
}
