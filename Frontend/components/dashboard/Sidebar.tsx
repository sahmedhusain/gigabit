'use client'
import { useState } from 'react'
import { Home, User, MessageCircle, Activity, Users, Calendar, Settings, X, Sparkles, Bell, LogOut, Heart, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen, Grid3X3, UserCheck, Bookmark } from 'lucide-react'

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
  isCollapsed?: boolean
  setIsCollapsed?: (collapsed: boolean) => void
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
  logout,
  isCollapsed = false,
  setIsCollapsed
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
          icon: Grid3X3,
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
          icon: UserCheck,
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
          icon: Users,
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
          icon: Bookmark,
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
        ${isCollapsed ? 'collapsed' : ''}
      `}>
        <div className="flex flex-col h-full">
          {/* Profile Dropdown */}
          <div className={`p-4 ${isCollapsed ? 'lg:px-4 lg:pt-4' : ''}`}>
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!isProfileDropdownOpen)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${isCollapsed ? 'lg:px-3 lg:justify-center hover:bg-transparent' : 'hover:bg-white/10'}`}
              >
                <div className={`flex items-center ${isCollapsed ? 'lg:space-x-0' : 'space-x-3'}`}>
                  <div className={`w-12 h-12 rounded-full p-1 flex-shrink-0 ring-2 transition-all duration-300 hover:scale-110 hover:ring-4 group-hover:ring-emerald-400/50 ${userStatus === 'online' ? 'ring-green-500 hover:ring-green-400' : userStatus === 'busy' ? 'ring-red-500 hover:ring-red-400' : 'ring-gray-500 hover:ring-gray-400'}`}>
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-full h-full rounded-full object-cover transition-all duration-300 hover:brightness-110"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold transition-all duration-300 hover:from-emerald-300 hover:to-teal-400 hover:shadow-lg">
                        {currentUser?.name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                      </div>
                    )}
                  </div>
                  {!isCollapsed && (
                    <div className="text-left">
                      <span className="font-semibold text-white truncate block">
                        {currentUser?.name || 'User'}
                      </span>
                      <p className="text-xs text-emerald-100/60 truncate">@{currentUser?.username || 'username'}</p>
                    </div>
                  )}
                </div>
                {!isCollapsed && <ChevronDown className={`w-5 h-5 text-white/70 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />}
              </button>

              {/* Profile Dropdown - External when collapsed */}
              {isProfileDropdownOpen && (
                <div className={`bg-black/20 backdrop-blur-lg rounded-lg shadow-xl py-2 mt-2 ${isCollapsed ? 'absolute left-full top-0 ml-2 z-50 min-w-48' : ''}`}>
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
            <div className={`p-4 space-y-4 ${isCollapsed ? 'lg:px-4' : ''}`}>
              {menuSections.map((section) => (
                <div key={section.title} className="space-y-2">
                  {/* Section Title */}
                  {!isCollapsed && (
                    <div className="px-3 py-2">
                      <h3 className="text-emerald-100/70 text-sm font-semibold uppercase tracking-wider">
                        {section.title}
                      </h3>
                    </div>
                  )}

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
                          className={`group relative overflow-hidden rounded-md transition-all duration-300 ${isCollapsed ? 'w-auto mx-auto' : 'w-full'} ${isActive && !isCollapsed ? `bg-gradient-to-r ${item.color} shadow-md scale-101 transform` : 'hover:bg-emerald-500/10 hover:scale-100 hover:shadow-sm'}`}
                          title={isCollapsed ? item.label : undefined}
                        >
                          <div className={`flex items-center justify-center ${isCollapsed ? 'py-2 px-1' : 'p-3 space-x-3'}`}>
                            <div className={`p-1.5 rounded-md transition-all duration-300 flex items-center justify-center relative ${isActive && isCollapsed ? `bg-gradient-to-r ${item.color} shadow-sm` : 'bg-emerald-400/10 group-hover:bg-emerald-400/20'}`}>
                              <Icon className={`w-4 h-4 transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`} />
                              {isActive && isCollapsed && (
                                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50 animate-pulse rounded-md"></div>
                              )}
                            </div>
                            {!isCollapsed && (
                              <div className="text-left flex-1">
                                <span className="font-semibold text-sm">{item.label}</span>
                              </div>
                            )}
                          </div>

                          {/* Active item glow effect for expanded mode */}
                          {isActive && !isCollapsed && (
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

          {/* Sidebar Toggle Buttons - Bottom */}
          <div className="px-4 py-4">
            {!isCollapsed ? (
              <button
                onClick={() => setIsCollapsed?.(!isCollapsed)}
                className="w-full flex items-center justify-center p-1.5 rounded-lg hover:bg-white/10 transition-colors duration-200 group"
                title="Collapse Sidebar"
              >
                <div className="p-1.5 rounded-md bg-emerald-400/10 group-hover:bg-emerald-400/20 transition-all duration-300">
                  <PanelLeftClose className="w-4 h-4 text-emerald-100/80 group-hover:text-white" />
                </div>
              </button>
            ) : (
              <button
                onClick={() => setIsCollapsed?.(!isCollapsed)}
                className="w-full flex items-center justify-center p-1.5 rounded-lg hover:bg-white/10 transition-colors duration-200 group"
                title="Expand Sidebar"
              >
                <div className="p-1.5 rounded-md bg-emerald-400/10 group-hover:bg-emerald-400/20 transition-all duration-300">
                  <PanelLeftOpen className="w-4 h-4 text-emerald-100/80 group-hover:text-white" />
                </div>
              </button>
            )}
          </div>
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
