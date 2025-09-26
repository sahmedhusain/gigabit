'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Home, 
  MessageCircle, 
  Activity, 
  Users, 
  Calendar, 
  X, 
  Sparkles, 
  Bell, 
  LogOut, 
  Heart, 
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
  Compass,
  Filter,
  RefreshCw,
  Dot,
  CheckCircle,
  XCircle,
  MessageSquare
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
  chatSubTab: string
  setChatSubTab: (subTab: string) => void
  eventsSubTab: string
  setEventsSubTab: (subTab: string) => void
  tempPostSubTab?: string
  onTempPostClose?: () => void
  chatUnreadAll?: number
  chatUnreadDirect?: number
  chatUnreadGroups?: number
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

interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<any>
  description: string
  color: string
  count?: number | string
  onClick: () => void
  isActive: boolean
  isTemp?: boolean
  onClose?: () => void
}

interface MenuSection {
  id: 'chats' | 'feed' | 'activity' | 'events'
  title: string
  icon: React.ReactNode
  description: string
  items: MenuItem[]
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
  chatSubTab,
  setChatSubTab,
  eventsSubTab,
  setEventsSubTab,
  tempPostSubTab,
  onTempPostClose,
  chatUnreadAll = 0,
  chatUnreadDirect = 0,
  chatUnreadGroups = 0,
  fetchEvents,
  currentUser,
  logout,
  isCollapsed: _isCollapsed = false,
  setIsCollapsed: _setIsCollapsed
}: SidebarProps) {
  const router = useRouter()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [userStatus, setUserStatus] = useState('online')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [expandedSection, setExpandedSection] = useState<'feed' | 'chats' | 'activity' | 'events' | null>(
    activeTab === 'events' ? 'events' : 
    activeTab === 'chats' ? 'chats' : 
    activeTab === 'activity' ? 'activity' :
    activeTab === 'feed' ? 'feed' :
    null
  )

  // Disable collapse functionality entirely
  const isCollapsed = false

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Removed automatic default setting to prevent interference with other pages

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
      onClick: () => router.push('/chats')
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-4 h-4" />,
      color: 'from-purple-500 to-pink-600',
      count: 7,
      onClick: () => router.push('/notifications')
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: <Compass className="w-4 h-4" />,
      color: 'from-orange-500 to-red-600',
      onClick: () => router.push('/search')
    }
  ]

  const menuSections: MenuSection[] = [
    {
      id: 'chats' as const,
      title: 'Chats',
      icon: <MessageCircle className="w-4 h-4" />,
      description: 'Messages and groups',
      items: [
        {
          id: 'all',
          label: 'All',
          icon: Grid3X3,
          description: 'All conversations',
          color: 'from-blue-500 to-cyan-600',
          count: undefined,
          onClick: () => {
            router.push('/chats/all')
          },
          isActive: activeTab === 'chats' && (typeof chatSubTab !== 'undefined' ? chatSubTab === 'all' : false)
        },
        {
          id: 'private',
          label: 'Direct Messages',
          icon: MessageCircle,
          description: 'Private conversations',
          color: 'from-blue-500 to-cyan-600',
          count: undefined,
          onClick: () => {
            router.push('/chats/private')
          },
          isActive: activeTab === 'chats' && (typeof chatSubTab !== 'undefined' ? chatSubTab === 'private' : false)
        },
        {
          id: 'groups',
          label: 'Groups',
          icon: Users,
          description: 'Group chats',
          color: 'from-blue-500 to-cyan-600',
          count: undefined,
          onClick: () => {
            router.push('/chats/groups')
          },
          isActive: activeTab === 'chats' && (typeof chatSubTab !== 'undefined' ? chatSubTab === 'groups' : false)
        }
      ]
    },
    {
      id: 'feed' as const,
      title: 'Feed',
      icon: <Home className="w-4 h-4" />,
      description: 'Your personalized content',
      items: [
        ...(tempPostSubTab ? [{
          id: `post-${tempPostSubTab}`,
          label: `Post #${tempPostSubTab}`,
          icon: MessageSquare,
          description: 'Current post view',
          color: 'from-emerald-500 to-teal-600',
          count: undefined,
          onClick: () => {
            // Stay on current page
          },
          isActive: true,
          isTemp: true,
          onClose: onTempPostClose
        }] : []),
        {
          id: 'all',
          label: 'All Posts',
          icon: Grid3X3,
          description: 'See all public posts',
          color: 'from-emerald-500 to-teal-600',
          count: '2.1k',
          onClick: () => {
            router.push('/feed/all')
          },
          isActive: activeTab === 'feed' && feedSubTab === 'all' && !tempPostSubTab
        },
        {
          id: 'following',
          label: 'Following',
          icon: UserCheck,
          description: 'Posts from people you follow',
          color: 'from-emerald-500 to-teal-600',
          count: '342',
          onClick: () => {
            router.push('/feed/following')
          },
          isActive: activeTab === 'feed' && feedSubTab === 'following' && !tempPostSubTab
        },
        {
          id: 'friends',
          label: 'Friends',
          icon: Users,
          description: 'Posts from your friends',
          color: 'from-emerald-500 to-teal-600',
          count: '89',
          onClick: () => {
            router.push('/feed/friends')
          },
          isActive: activeTab === 'feed' && feedSubTab === 'friends' && !tempPostSubTab
        }
      ]
    },
    {
      id: 'activity' as const,
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
            router.push('/activity/liked')
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
            router.push('/activity/commented')
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
            router.push('/activity/saved')
          },
          isActive: activeTab === 'activity' && activitySubTab === 'saved'
        }
      ]
    },
    {
      id: 'events' as const,
      title: 'Events',
      icon: <Calendar className="w-4 h-4" />,
      description: 'Upcoming events',
      items: [
        {
          id: 'all',
          label: 'All Events',
          icon: Calendar,
          description: 'Browse all events',
          color: 'from-purple-500 to-violet-600',
          count: '5',
          onClick: () => {
            router.push('/events/all')
          },
          isActive: activeTab === 'events' && eventsSubTab === 'all'
        },
        {
          id: 'going',
          label: 'Going',
          icon: CheckCircle,
          description: 'Events you\'re attending',
          color: 'from-purple-500 to-violet-600',
          count: undefined,
          onClick: () => {
            router.push('/events/going')
          },
          isActive: activeTab === 'events' && eventsSubTab === 'going'
        },
        {
          id: 'not-going',
          label: 'Not Going',
          icon: XCircle,
          description: 'Events you\'re not attending',
          color: 'from-purple-500 to-violet-600',
          count: undefined,
          onClick: () => {
            router.push('/events/not-going')
          },
          isActive: activeTab === 'events' && eventsSubTab === 'not-going'
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
        sidebar-layout w-[320px] min-w-[320px] max-w-[320px] bg-transparent transform transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full relative">
          {/* Header: Logo card (non-scrolling) */}
      <div className="p-4">
            <div className="rounded-2xl">
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => router.push('/')}
      className="w-full group transition-all duration-300 text-center"
                  aria-label="Go to homepage"
                >
          <div className="flex items-center justify-center h-14 box-border p-0 rounded-xl hover:bg-white/10 transition-all duration-300">
                    <img
                      src="/logo.png"
                      alt="Gigabit Logo"
                      className="h-full w-auto max-w-full rounded-xl object-contain drop-shadow-xl transition-all duration-300 group-hover:drop-shadow-2xl transform translate-y-[3px]"
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Navigation */}
          <nav className="flex-1 overflow-y-auto scrollbar-thin">
            <div className={`p-4 space-y-4 ${isCollapsed ? 'lg:px-4' : ''}`}>
              {menuSections.map((section) => {
                const containerClass = section.id === 'chats'
                  ? 'bg-gradient-to-br from-blue-500/10 via-white/10 to-white/5 border-blue-400/20'
                  : section.id === 'feed'
                  ? 'bg-gradient-to-br from-emerald-500/10 via-white/10 to-white/5 border-emerald-400/20'
                  : section.id === 'activity'
                  ? 'bg-gradient-to-br from-rose-500/10 via-white/10 to-white/5 border-rose-400/20'
                  : section.id === 'events'
                  ? 'bg-gradient-to-br from-purple-500/10 via-white/10 to-white/5 border-purple-400/20'
                  : 'bg-gradient-to-br from-indigo-500/10 via-white/10 to-white/5 border-indigo-400/20'
                return (
                  <div
                    key={section.title}
                    className={`sidebar-section backdrop-blur-xl rounded-2xl border shadow-xl ${containerClass}`}
                  >
                    <div className="p-4">
                      {/* Section Header (clickable) */}
                      {!isCollapsed && (
                        <button
                          type="button"
                          className="w-full"
                          onClick={() => {
                            const willExpand = expandedSection !== section.id
                            setExpandedSection(willExpand ? section.id : null)
                            // Navigate to first sub-route by default
                            if (section.id === 'chats') {
                              router.push('/chats/all')
                            } else if (section.id === 'feed') {
                              router.push('/feed/all')
                            } else if (section.id === 'activity') {
                              router.push('/activity/liked')
                            } else if (section.id === 'events') {
                              router.push('/events/all')
                            }
                          }}
                        >
                          <div className={`flex items-center justify-between cursor-pointer ${expandedSection === section.id ? 'mb-3' : 'mb-3 h-14'}`}>
                            <div className="flex items-center space-x-2">
                              <div className="p-1.5 rounded-lg bg-white/10">
                                {section.icon}
                              </div>
                              <div className="text-left">
                                <h3 className="text-white font-bold text-sm">
                                  {section.title}
                                </h3>
                                <p className="text-white/60 text-xs">
                                  {section.description}
                                </p>
                              </div>
                            </div>
                            {section.id === 'chats' && expandedSection !== 'chats' && chatUnreadAll > 0 && (
                              <span className="text-xs px-2 py-1 rounded-full font-medium bg-white/20 text-white">
                                {chatUnreadAll}
                              </span>
                            )}
                          </div>
                        </button>
                      )}

                      {/* Section Items */}
                      {expandedSection === section.id && (
                        <div className="space-y-1">
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
                          className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ${
                            isCollapsed ? 'w-auto mx-auto' : 'w-full'
                          } ${
                            isActive 
                              ? 'bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-xl shadow-lg scale-[1.01] transform border border-white/20' 
                              : 'hover:bg-white/10 hover:scale-[1.01] hover:shadow-md border border-transparent hover:border-white/20'
                          }`}
                          title={isCollapsed ? item.label : undefined}
                        >
                          <div className={`flex items-center ${isCollapsed ? 'justify-center py-3 px-2' : 'p-4 space-x-4'}`}>
                            <div className={`relative flex-shrink-0 transition-all duration-300 p-2 rounded-xl ${
                              isActive ? 'bg-white/20' : 'bg-white/10 group-hover:bg-white/20'
                            }`}>
                              <Icon className={`w-5 h-5 transition-all duration-300 ${
                                isActive ? 'text-white' : 'text-white/80 group-hover:text-white'
                              } ${isHovered ? 'scale-110' : ''}`} />
                            </div>
                            
                            {!isCollapsed && (
                              <div className="flex-1 text-left">
                                <div className={`flex items-center ${section.id === 'chats' ? 'justify-between' : ''}`}>
                                  <span className={`font-semibold text-sm transition-colors ${
                                    isActive ? 'text-white' : 'text-white/90 group-hover:text-white'
                                  }`}>
                                    {item.label}
                                  </span>
                                  {item.isTemp && item.onClose && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        item.onClose!()
                                      }}
                                      className="ml-auto p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-105"
                                      title="Close"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  )}
                                  {section.id === 'chats' && (() => {
                                    let count = 0
                                    if (item.id === 'all') count = chatUnreadAll
                                    else if (item.id === 'private') count = chatUnreadDirect
                                    else if (item.id === 'groups') count = chatUnreadGroups
                                    return count > 0 ? (
                                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                        isActive 
                                          ? 'bg-white/20 text-white' 
                                          : 'bg-white/10 text-white/70 group-hover:bg-white/20 group-hover:text-white'
                                      }`}>
                                        {count}
                                      </span>
                                    ) : null
                                  })()}
                                </div>
                                {/* Description removed for cleaner subtab items */}
                              </div>
                            )}
                          </div>

                          {/* Active subtle overlay */}
                          {isActive && !isCollapsed && (
                            <div className="absolute inset-0 rounded-2xl pointer-events-none"></div>
                          )}
                        </button>
                      )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </nav>

          {/* Footer removed: collapse/uncollapse feature disabled */}
        </div>

        {/* Enhanced floating particles effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`absolute animate-float floating-particle particle-${i + 1}`}
            >
              <Sparkles className="w-1 h-1 text-white/10" />
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}
