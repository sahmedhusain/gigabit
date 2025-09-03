'use client'
import { useState } from 'react'
import { Home, User, MessageCircle, Activity, Users, Calendar, Settings, X, Sparkles, Bell, Search, LogOut, Heart } from 'lucide-react'

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
  const [searchQuery, setSearchQuery] = useState('')

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
          {/* Search Bar */}
          <div className="p-2 border-b border-emerald-400/20">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-emerald-100/60 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search navigation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-emerald-400/10 backdrop-blur-sm rounded-md border border-emerald-400/20 text-white placeholder-emerald-100/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition-all duration-200 text-sm"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-400/20 scrollbar-track-transparent">
            <div className="p-2 space-y-3">
              {menuSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  {/* Section Title */}
                  <div className="px-2 py-1">
                    <h3 className="text-emerald-100/70 text-xs font-semibold uppercase tracking-wider">
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
                          className={`w-full group relative overflow-hidden rounded-md transition-all duration-300 ${
                            isActive
                              ? `bg-gradient-to-r ${item.color} shadow-md scale-101 transform`
                              : 'hover:bg-emerald-500/10 hover:scale-100 hover:shadow-sm'
                          }`}
                        >
                          <div className={`flex items-center space-x-2.5 p-2.5 ${
                            isActive ? 'text-white' : 'text-emerald-100/80 group-hover:text-white'
                          }`}>
                            <div className={`relative p-1 rounded-md transition-all duration-300 ${
                              isActive 
                                ? 'bg-white/20 shadow-sm' 
                                : 'bg-emerald-400/10 group-hover:bg-emerald-400/20'
                            }`}>
                              <Icon className={`w-3.5 h-3.5 transition-transform duration-300 ${
                                isHovered ? 'scale-110' : ''
                              }`} />
                            </div>
                            <div className="text-left flex-1">
                              <span className="font-semibold text-xs">{item.label}</span>
                              <p className={`text-xs ${
                                isActive ? 'text-white/80' : 'text-emerald-100/60'
                              }`}>{item.description}</p>
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

          {/* Profile */}
          <div className="p-2 border-t border-emerald-400/20 bg-gradient-to-r from-teal-800/50 to-cyan-700/50">
            <div className="flex items-center space-x-2.5">
              {/* Profile Button */}
              <button
                onClick={() => {
                  setActiveTab('profile')
                  setIsMobileMenuOpen(false)
                }}
                onMouseEnter={() => setHoveredItem('profile')}
                onMouseLeave={() => setHoveredItem(null)}
                className={`flex-1 group relative overflow-hidden rounded-md transition-all duration-300 ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md scale-101 transform text-white'
                    : 'hover:bg-emerald-500/10 hover:scale-100 hover:shadow-sm text-emerald-100/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2 p-2.5">
                  <div className={`relative transition-all duration-300 ${
                    activeTab === 'profile' ? 'shadow-sm' : 'group-hover:shadow-sm'
                  }`}>
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-7 h-7 rounded-full object-cover border-2 border-white/20"
                      />
                    ) : (
                      <div className="w-7 h-7 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {currentUser?.name?.[0]?.toUpperCase() || <User className="w-3.5 h-3.5" />}
                      </div>
                    )}
                    {/* Online status indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-emerald-900"></div>
                  </div>
                  <div className="text-left flex-1">
                    <span className="font-semibold text-xs truncate block">
                      {currentUser?.name || 'User'}
                    </span>
                    <p className={`text-xs truncate ${
                      activeTab === 'profile' ? 'text-white/80' : 'text-emerald-100/60'
                    }`}>@{currentUser?.username || 'username'}</p>
                  </div>
                </div>

                {/* Active item glow effect */}
                {activeTab === 'profile' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50 animate-pulse"></div>
                )}
              </button>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-1">
                {/* Settings Button */}
                <button
                  onClick={() => {
                    setActiveTab('settings')
                    setIsMobileMenuOpen(false)
                  }}
                  className={`p-1 rounded-sm transition-all duration-200 ${
                    activeTab === 'settings'
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'bg-emerald-400/10 text-emerald-100/70 hover:bg-emerald-400/20 hover:text-white'
                  }`}
                  title="Settings"
                >
                  <Settings className="w-3 h-3" />
                </button>
                {/* Logout Button */}
                <button
                  onClick={() => logout()}
                  className="p-1 rounded-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200"
                  title="Logout"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            </div>
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
