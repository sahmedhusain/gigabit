'use client'
import { useState, useEffect } from 'react'
import { 
  Home, 
  User, 
  MessageCircle, 
  Activity, 
  Users, 
  Calendar, 
  Settings, 
  X, 
  Sparkles, 
  Bell, 
  LogOut, 
  Heart, 
  ChevronDown, 
  ChevronRight, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Grid3X3, 
  UserCheck, 
  Bookmark,
  Plus,
  Search,
  TrendingUp,
  Clock,
  Globe,
  Shield,
  Zap,
  Star,
  Award,
  Target,
  Layers,
  BarChart3,
  Compass,
  Filter,
  RefreshCw,
  Dot
} from 'lucide-react'

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

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  count?: number
  onClick: () => void
}

interface StatusOption {
  id: string
  label: string
  color: string
  icon: React.ReactNode
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
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showQuickActions, setShowQuickActions] = useState(false)

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const statusOptions: StatusOption[] = [
    { id: 'online', label: 'Online', color: 'bg-green-500', icon: <Dot className="w-3 h-3 animate-pulse" /> },
    { id: 'busy', label: 'Busy', color: 'bg-red-500', icon: <Dot className="w-3 h-3" /> },
    { id: 'away', label: 'Away', color: 'bg-yellow-500', icon: <Dot className="w-3 h-3" /> },
    { id: 'invisible', label: 'Invisible', color: 'bg-gray-500', icon: <Dot className="w-3 h-3" /> }
  ]

  const quickActions: QuickAction[] = [
    {
      id: 'create-post',
      label: 'New Post',
      icon: <Plus className="w-4 h-4" />,
      color: 'from-emerald-500 to-teal-600',
      onClick: () => console.log('Create post')
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageCircle className="w-4 h-4" />,
      color: 'from-blue-500 to-cyan-600',
      count: 3,
      onClick: () => setActiveTab('chats')
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-4 h-4" />,
      color: 'from-purple-500 to-pink-600',
      count: 7,
      onClick: () => console.log('Open notifications')
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: <Compass className="w-4 h-4" />,
      color: 'from-orange-500 to-red-600',
      onClick: () => setActiveTab('search')
    }
  ]

  const menuSections = [
    {
      title: 'Feed',
      icon: <Home className="w-4 h-4" />,
      description: 'Your personalized content',
      items: [
        {
          id: 'all',
          label: 'All Posts',
          icon: Grid3X3,
          description: 'See all public posts',
          color: 'from-emerald-500 to-teal-600',
          count: '2.1k',
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
          count: '342',
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
          count: '89',
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
      icon: <Activity className="w-4 h-4" />,
      description: 'Track your engagement',
      items: [
        {
          id: 'liked',
          label: 'Liked Posts',
          icon: Heart,
          description: 'Posts you\'ve liked',
          color: 'from-rose-500 to-pink-600',
          count: '156',
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
          color: 'from-blue-500 to-cyan-600',
          count: '78',
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
          color: 'from-amber-500 to-orange-600',
          count: '23',
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
      icon: <Globe className="w-4 h-4" />,
      description: 'Connect and discover',
      items: [
        {
          id: 'discover',
          label: 'Discover',
          icon: Search,
          description: 'Find new people to connect with',
          color: 'from-purple-500 to-pink-600',
          count: 'New',
          onClick: () => {
            setActiveTab('discover')
          },
          isActive: activeTab === 'discover'
        },
        {
          id: 'events',
          label: 'Events',
          icon: Calendar,
          description: 'Upcoming events',
          color: 'from-purple-500 to-violet-600',
          count: '5',
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
          icon: BarChart3,
          description: 'Your recent activity',
          color: 'from-indigo-500 to-purple-600',
          count: '12',
          onClick: () => {
            setActiveTab('community')
            setCommunitySubTab('activity')
          },
          isActive: activeTab === 'community' && communitySubTab === 'activity'
        }
      ]
    }
  ]

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const getUserGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed top-16 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Enhanced Sidebar */}
      <aside className={`
        sidebar-layout bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-zinc-900/95 backdrop-blur-xl border-r border-gray-700/30 shadow-2xl transform transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${isCollapsed ? 'collapsed' : ''}
      `}>
        <div className="flex flex-col h-full relative">
          {/* Enhanced Navigation */}
          <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600/30 scrollbar-track-transparent pt-4">
            <div className={`p-4 space-y-4 ${isCollapsed ? 'lg:px-4' : ''}`}>
              {menuSections.map((section, sectionIndex) => (
                <div key={section.title} className="space-y-2">
                  {/* Enhanced Section Header */}
                  {!isCollapsed && (
                    <div className="px-3 py-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-white/10">
                          {section.icon}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-sm">
                            {section.title}
                          </h3>
                          <p className="text-white/60 text-xs">
                            {section.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Section Items */}
                  <div className="space-y-1">
                    {section.items.map((item, itemIndex) => {
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
                          className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${
                            isCollapsed ? 'w-auto mx-auto' : 'w-full'
                          } ${
                            isActive 
                              ? `bg-gradient-to-r ${item.color} shadow-lg scale-[1.02] transform border border-white/20` 
                              : 'hover:bg-white/10 hover:scale-[1.01] hover:shadow-md border border-transparent hover:border-white/20'
                          }`}
                          title={isCollapsed ? item.label : undefined}
                        >
                          <div className={`flex items-center ${isCollapsed ? 'justify-center py-3 px-2' : 'p-4 space-x-4'}`}>
                            <div className={`relative flex-shrink-0 transition-all duration-300 ${
                              isActive && isCollapsed 
                                ? `p-2 rounded-xl bg-gradient-to-r ${item.color} shadow-md` 
                                : 'p-2 rounded-xl bg-white/10 group-hover:bg-white/20'
                            }`}>
                              <Icon className={`w-5 h-5 transition-all duration-300 ${
                                isActive ? 'text-white' : 'text-white/80 group-hover:text-white'
                              } ${isHovered ? 'scale-110' : ''}`} />
                              
                              {/* Active indicator for collapsed mode */}
                              {isActive && isCollapsed && (
                                <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse"></div>
                              )}
                            </div>
                            
                            {!isCollapsed && (
                              <div className="flex-1 text-left">
                                <div className="flex items-center justify-between">
                                  <span className={`font-semibold text-sm transition-colors ${
                                    isActive ? 'text-white' : 'text-white/90 group-hover:text-white'
                                  }`}>
                                    {item.label}
                                  </span>
                                  {item.count && (
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                      isActive 
                                        ? 'bg-white/20 text-white' 
                                        : 'bg-white/10 text-white/70 group-hover:bg-white/20 group-hover:text-white'
                                    }`}>
                                      {item.count}
                                    </span>
                                  )}
                                </div>
                                <p className={`text-xs mt-0.5 transition-colors ${
                                  isActive ? 'text-white/80' : 'text-white/60 group-hover:text-white/80'
                                }`}>
                                  {item.description}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Enhanced active item effects */}
                          {isActive && !isCollapsed && (
                            <>
                              <div className="absolute inset-0 bg-white/10 animate-pulse rounded-xl"></div>
                              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                            </>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* Enhanced Footer Section */}
          <div className="p-4 border-t border-gray-700/30">
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setIsCollapsed?.(!isCollapsed)}
                className={`group p-2 rounded-xl transition-all duration-300 ${
                  isCollapsed 
                    ? 'bg-white/10 hover:bg-white/20' 
                    : 'bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20'
                }`}
                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                <div className="flex items-center space-x-2">
                  {isCollapsed ? (
                    <PanelLeftOpen className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
                  ) : (
                    <>
                      <PanelLeftClose className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
                      <span className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">
                        Collapse
                      </span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced floating particles effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`absolute animate-float floating-particle`}
              style={{
                left: `${10 + (i % 3) * 30}%`,
                top: `${20 + (i % 4) * 20}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${4 + i}s`
              }}
            >
              <Sparkles className="w-1 h-1 text-white/10" />
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}
