'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Calendar, 
  Clock,
  Star,
  ChevronRight,
  ChevronLeft,
  Globe,
  MessageCircle,
  Heart,
  Share2,
  User,
  Crown,
  Sparkles,
  MapPin,
  Search,
  
  Settings,
  LogOut,
  Shield,
  Zap,
  Dot,
  UserCircle,
  UserCheck,
  UserPlus,
  Mail,
  Check,
  X
} from 'lucide-react'
import UsersSidebar from './UsersSidebar'

interface RightSidebarProps {
  onlineUsers: any[]
  followingUsers?: any[] // Add following users prop
  followersUsers?: any[] // Add followers users prop for mutual relationships
  trendingTopics: string[]
  onUserClick: (user: any) => void
  currentUser: {
    id: number
    name: string
    username: string
    avatar?: string
    isPrivate: boolean
    followers: number
    following: number
  } | null
  setActiveTab: (tab: string) => void
  logout: () => void
}

interface StatusOption {
  id: string
  label: string
  color: string
  icon: React.ReactNode
}

export default function RightSidebar({
  onlineUsers,
  followingUsers = [], // Default to empty array
  followersUsers = [], // Default to empty array
  trendingTopics,
  onUserClick,
  currentUser,
  setActiveTab,
  logout
}: RightSidebarProps) {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [userStatus, setUserStatus] = useState('online')
  const [isClient, setIsClient] = useState(false)
  const [expandedSection, setExpandedSection] = useState<'calendar' | 'following'  | null>('calendar')
  
  // Calendar state
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [showEventsSlideUp, setShowEventsSlideUp] = useState(false)
  const [slideUpDate, setSlideUpDate] = useState<Date | null>(null)

  // Update time every minute and handle client-side hydration
  useEffect(() => {
    setIsClient(true)
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getUserGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  // Calendar navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCalendarDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  // Demo events data - in real app this would come from API
  const demoEvents: Record<string, Array<{id: number, title: string, time: string, color: string}>> = {
    '2025-09-11': [
      { id: 1, title: 'Team Meeting', time: '2:00 PM', color: 'bg-blue-400' },
      { id: 2, title: 'Social Network Update', time: '4:30 PM', color: 'bg-emerald-400' }
    ],
    '2025-09-15': [
      { id: 3, title: 'Project Review', time: '10:00 AM', color: 'bg-purple-400' }
    ],
    '2025-09-20': [
      { id: 4, title: 'Client Call', time: '3:00 PM', color: 'bg-orange-400' },
      { id: 5, title: 'Workshop', time: '5:00 PM', color: 'bg-pink-400' }
    ]
  }

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0]
    return demoEvents[dateKey] || []
  }

  // Handle date click to show events slide-up
  const handleDateClick = (date: Date) => {
    const eventsForDate = getEventsForDate(date)
    if (eventsForDate.length > 0) {
      setSlideUpDate(date)
      setShowEventsSlideUp(true)
    } else {
      // Just update selected date for navigation, don't show slide-up
      setSelectedDate(date)
    }
  }

  // Close events slide-up
  const closeEventsSlideUp = () => {
    setShowEventsSlideUp(false)
    setSlideUpDate(null)
  }

  // Check if date has events
  const hasEvents = (date: Date) => {
    return getEventsForDate(date).length > 0
  }

  const toggleSection = (section: 'calendar' | 'following' ) => {
    setExpandedSection(expandedSection === section ? null : section)
  }


  // Check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString()
  }

  return (
    <div className="fixed-right-sidebar">
      <div className="space-y-4">
        {/* User Profile Dropdown Container */}
  <div className="rounded-2xl">
          <div className="p-4">
            {/* User Profile Dropdown - Integrated */}
            <button
              onClick={() => setProfileDropdownOpen(!isProfileDropdownOpen)}
              className="w-full group transition-all duration-300"
            >
              <div className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/10 transition-all duration-300">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full p-0.5 flex-shrink-0 transition-all duration-300 hover:scale-105 ${userStatus === 'online' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                      userStatus === 'busy' ? 'bg-gradient-to-r from-red-400 to-red-500' :
                        userStatus === 'away' ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                          'bg-gradient-to-r from-gray-400 to-gray-500'
                    }`}>
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
                  {/* Status indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${statusOptions.find(s => s.id === userStatus)?.color || 'bg-gray-500'
                    }`}>
                    {statusOptions.find(s => s.id === userStatus)?.icon}
                  </div>
                </div>

                <div className="flex-1 text-left">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white truncate text-sm">
                      {currentUser?.name || 'User'}
                    </span>
                    {currentUser?.isPrivate && (
                      <div title="Private account">
                        <Shield className="w-3 h-3 text-yellow-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-white/60 truncate">@{currentUser?.username || 'username'}</p>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-xs text-white/60">
                      <span className="font-medium text-white">{currentUser?.followers || 0}</span> followers
                    </span>
                    <span className="text-xs text-white/60">
                      <span className="font-medium text-white">{currentUser?.following || 0}</span> following
                    </span>
                  </div>
                </div>

                {/* Chevron removed */}
              </div>
            </button>

            {/* Enhanced Profile Dropdown - Inline */}
            {isProfileDropdownOpen && (
              <div className="mt-4 space-y-3">
                {/* Status Section */}
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-xs font-semibold text-white/70 mb-3 flex items-center">
                    <Zap className="w-3 h-3 mr-2 text-emerald-400" />
                    Status
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.map((status) => (
                      <button
                        key={status.id}
                        onClick={() => setUserStatus(status.id)}
                        className={`flex items-center space-x-2 p-2 rounded-lg text-xs transition-all duration-200 ${userStatus === status.id
                            ? 'bg-white/20 text-white'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
                        <span>{status.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-1">
                  <button
                    onClick={() => {
                      router.push(`/profile/${currentUser?.id}`)
                      setProfileDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white rounded-lg flex items-center space-x-3 transition-all duration-200 group"
                  >
                    <User className="w-4 h-4 group-hover:text-emerald-400 transition-colors" />
                    <span>My Profile</span>
                    <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('settings')
                      setProfileDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white rounded-lg flex items-center space-x-3 transition-all duration-200 group"
                  >
                    <Settings className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
                    <span>Settings</span>
                    <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  <hr className="border-white/10 my-2" />

                  <button
                    onClick={() => {
                      logout()
                      setProfileDropdownOpen(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg flex items-center space-x-3 transition-all duration-200 group"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Time, Greeting, and Calendar Container */}
        <div className={`sidebar-section bg-gradient-to-br from-blue-500/10 via-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-blue-400/20 shadow-xl ${
          expandedSection === 'calendar' ? 'expandable' : 'collapsed'
        }`}>
          <div className="p-4">
            {/* Header with collapse toggle */}
            <div 
              className={`flex items-center justify-between cursor-pointer ${expandedSection === 'calendar' ? 'mb-4' : 'mb-2 h-16'}`}
              onClick={() => toggleSection('calendar')}
            >
              <div>
                <div className="text-xl font-bold text-white mb-1">
                  {isClient ? formatTime(currentTime) : '--:--'}
                </div>
                <div className="text-white/60 text-xs font-medium">
                  {isClient ? formatDate(currentTime) : 'Loading...'}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                {/* Chevrons removed */}
              </div>
            </div>

            {/* Greeting */}
            <div className="text-center mb-4">
              <div className="text-white/80 text-sm">
                {getUserGreeting()}, {currentUser?.name?.split(' ')[0] || 'User'}!
              </div>
              <div className="text-white/60 text-xs mt-1">
                {(() => {
                  // Count events for selected date
                  const selectedEvents = getEventsForDate(selectedDate)
                  if (selectedEvents.length === 0) {
                    const isSameDay = (date1: Date, date2: Date) => {
                      return date1.getDate() === date2.getDate() && 
                             date1.getMonth() === date2.getMonth() && 
                             date1.getFullYear() === date2.getFullYear();
                    };
                    return isSameDay(selectedDate, new Date()) 
                      ? "No events for today" 
                      : `No events for ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                  } else if (selectedEvents.length === 1) {
                    const isSameDay = (date1: Date, date2: Date) => {
                      return date1.getDate() === date2.getDate() && 
                             date1.getMonth() === date2.getMonth() && 
                             date1.getFullYear() === date2.getFullYear();
                    };
                    return isSameDay(selectedDate, new Date())
                      ? "You have 1 event today"
                      : `1 event on ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                  } else {
                    const isSameDay = (date1: Date, date2: Date) => {
                      return date1.getDate() === date2.getDate() && 
                             date1.getMonth() === date2.getMonth() && 
                             date1.getFullYear() === date2.getFullYear();
                    };
                    return isSameDay(selectedDate, new Date())
                      ? `You have ${selectedEvents.length} events today`
                      : `${selectedEvents.length} events on ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                  }
                })()}
              </div>
            </div>

            {expandedSection === 'calendar' && (
              <div className="section-content calendar-content flex flex-col flex-1 min-h-0">
                {/* Calendar Header with Navigation */}
                <div className="flex items-center justify-between mb-3 pt-2 border-t border-white/10">
                  <h3 className="text-white font-bold text-base flex items-center">
                    Calendar
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigateMonth('prev'); }}
                      className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                      title="Previous month"
                    >
                      <ChevronLeft className="w-4 h-4 text-blue-400" />
                    </button>
                    <div className="text-blue-400 text-xs font-medium min-w-[80px] text-center">
                      {calendarDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigateMonth('next'); }}
                      className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                      title="Next month"
                    >
                      <ChevronRight className="w-4 h-4 text-blue-400" />
                    </button>
                  </div>
                </div>
                
                {/* Mini Calendar - Fixed size */}
                <div className="flex-shrink-0">
                  {/* Calendar Header */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                      <div key={index} className="text-white/60 text-xs font-medium py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1 mb-3">
                    {(() => {
                      const today = new Date();
                      const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
                      const lastDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
                      const startDate = new Date(firstDay);
                      startDate.setDate(startDate.getDate() - firstDay.getDay());
                      
                      const days = [];
                      for (let i = 0; i < 42; i++) {
                        const currentDate = new Date(startDate);
                        currentDate.setDate(startDate.getDate() + i);
                        
                        const isCurrentMonth = currentDate.getMonth() === calendarDate.getMonth();
                        const isToday = currentDate.toDateString() === today.toDateString();
                        const isSelected = currentDate.toDateString() === selectedDate.toDateString();
                        const hasEventDots = hasEvents(currentDate);
                        
                        days.push(
                          <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); handleDateClick(new Date(currentDate)); }}
                            className={`
                              relative text-center text-xs py-2 rounded-lg transition-all duration-200 cursor-pointer aspect-square flex items-center justify-center
                              ${isCurrentMonth 
                                ? isSelected
                                  ? 'bg-blue-500/50 text-blue-200 font-bold border border-blue-400'
                                  : isToday 
                                    ? 'bg-blue-500/30 text-blue-300 font-bold border border-blue-400/50' 
                                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                                : 'text-white/30 hover:text-white/50'
                              }
                            `}
                          >
                            {currentDate.getDate()}
                            {hasEventDots && isCurrentMonth && (
                              <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full"></div>
                            )}
                          </button>
                        );
                      }
                      
                      return days.slice(0, 35); // Show 5 weeks
                    })()}
                  </div>
                </div>
                
                {/* Events Slide-Up Modal - Overflowing calendar container */}
                {showEventsSlideUp && slideUpDate && (
                  <div className="events-overflow-modal transform transition-all duration-300 ease-out animate-slide-up">
                    <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 rounded-2xl shadow-2xl border border-slate-600/30 overflow-hidden backdrop-blur-sm">
                      {/* Overlay for extra depth */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5 rounded-2xl"></div>
                      {/* Content wrapper */}
                      <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-center justify-between p-4 border-b border-white/20">
                        <div>
                          <h3 className="text-white font-bold text-base">
                            {(() => {
                              const isSameDay = (date1: Date, date2: Date) => {
                                return date1.getDate() === date2.getDate() &&
                                       date1.getMonth() === date2.getMonth() &&
                                       date1.getFullYear() === date2.getFullYear();
                              };

                              return isSameDay(slideUpDate, new Date())
                                ? "Today's Events"
                                : `Events for ${slideUpDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                            })()}
                          </h3>
                          <p className="text-white/80 text-xs mt-1">
                            {slideUpDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                        <button
                          onClick={closeEventsSlideUp}
                          className="p-2 rounded-lg hover:bg-white/15 transition-colors"
                          title="Close events"
                        >
                          <X className="w-5 h-5 text-white/80" />
                        </button>
                      </div>

                      {/* Events List */}
                      <div className="max-h-60 overflow-y-auto p-4 space-y-3">
                        {(() => {
                          const eventsForDate = getEventsForDate(slideUpDate);
                          return eventsForDate.map((event) => (
                            <div key={event.id} className="bg-white/15 rounded-lg p-3 border border-white/20 hover:bg-white/25 transition-colors">
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-sm text-white font-medium flex-1">{event.title}</span>
                                <span className="text-xs text-white/70 ml-2 flex-shrink-0">{event.time}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 ${event.color} rounded-full`}></div>
                                <span className="text-xs text-white/80 capitalize">{event.color.replace('bg-', '').replace('-400', '')} event</span>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Calendar is now non-scrollable - events shown in slide-up modal */}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Following Users Section */}
        <div className={`sidebar-section bg-gradient-to-br from-emerald-500/10 via-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-emerald-400/20 shadow-xl ${
          expandedSection === 'following' ? 'expandable' : 'collapsed'
        }`}>
          <div className="p-4">
            <div 
              className={`flex items-center justify-between cursor-pointer ${expandedSection === 'following' ? 'mb-4' : 'mb-2 h-12'}`}
              onClick={() => toggleSection('following')}
            >
              <h3 className="text-white font-bold text-base flex items-center">
                <Users className="w-4 h-4 text-emerald-400 mr-2.5" />
                Following
                <span className="ml-2 bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {(() => {
                    // Combine followingUsers and onlineUsers, prioritizing followingUsers
                    const allFollowing = followingUsers.length > 0 ? followingUsers : onlineUsers;
                    return allFollowing.filter(user => user.username !== currentUser?.username).length;
                  })()}
                </span>
              </h3>
              <div className="flex items-center space-x-2">
                {(() => {
                  // Count online users excluding current user
                  const onlineCount = onlineUsers.filter(user => 
                    (user.username !== currentUser?.username) && 
                    (user.id !== currentUser?.id) &&
                    (user.user_id !== currentUser?.id)
                  ).length;
                  
                  // Only show online indicator if there are online users
                  if (onlineCount > 0) {
                    return (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-emerald-400 text-xs font-medium">
                          {onlineCount} online
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
                {/* Chevrons removed */}
              </div>
            </div>

            {expandedSection === 'following' && (
              <div className="section-content flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-2">
                    {(() => {
                      // Use followingUsers if available, otherwise fall back to onlineUsers
                      const allFollowing = followingUsers.length > 0 ? followingUsers : onlineUsers;
                      const filteredUsers = allFollowing.filter(user => 
                        (user.username !== currentUser?.username) && 
                        (user.id !== currentUser?.id) &&
                        (user.user_id !== currentUser?.id)
                      );
                      
                      // Create online users set for quick lookup
                      const onlineUserIds = new Set(onlineUsers.map(u => u.id || u.user_id));
                      
                      // Create followers set for mutual friendship detection
                      const followerIds = new Set(followersUsers.map(u => u.id || u.user_id));
                      
                      // Separate online and offline users
                      const onlineFollowing = filteredUsers.filter(user => 
                        onlineUserIds.has(user.id || user.user_id)
                      );
                      const offlineFollowing = filteredUsers.filter(user => 
                        !onlineUserIds.has(user.id || user.user_id)
                      );
                      
                      // Sort both groups by name
                      const sortByName = (a: any, b: any) => {
                        const nameA = (a.display_name || a.name || a.first_name + ' ' + a.last_name || a.username || '').toLowerCase();
                        const nameB = (b.display_name || b.name || b.first_name + ' ' + b.last_name || b.username || '').toLowerCase();
                        return nameA.localeCompare(nameB);
                      };
                      
                      const sortedOnline = onlineFollowing.sort(sortByName);
                      const sortedOffline = offlineFollowing.sort(sortByName);
                      
                      // Combine: online first, then offline
                      const sortedUsers = [...sortedOnline, ...sortedOffline];
                      
                      if (sortedUsers.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Users className="w-8 h-8 text-white/40" />
                            </div>
                            <p className="text-white/60 text-base font-medium mb-2">No following users</p>
                            <p className="text-white/40 text-sm">Start following people to see them here</p>
                          </div>
                        );
                      }
                      
                      return (
                        <>
                          {/* Online Users Section */}
                          {sortedOnline.length > 0 && (
                            <div className="mb-4">
                              <div className="flex items-center space-x-2 mb-3 px-2">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wide">
                                  Online ({sortedOnline.length})
                                </span>
                              </div>
                              <div className="space-y-1">
                                {sortedOnline.map((followingUser, index) => {
                                  const isMutualFriend = followerIds.has(followingUser.id || followingUser.user_id);
                                  const userName = followingUser.display_name || 
                                                 followingUser.name || 
                                                 (followingUser.first_name && followingUser.last_name ? 
                                                   `${followingUser.first_name} ${followingUser.last_name}` : '') ||
                                                 followingUser.username || 
                                                 'Unknown User';
                                  
                                  return (
                                    <div
                                      key={`online-${index}`}
                                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-emerald-500/10 transition-all duration-300 cursor-pointer group border border-transparent hover:border-emerald-400/20"
                                      onClick={(e) => { e.stopPropagation(); onUserClick(followingUser); }}
                                    >
                                      <div className="relative flex-shrink-0">
                                        <img
                                          src={followingUser.avatar || followingUser.profile_image || '/default-avatar.png'}
                                          alt={followingUser.username || 'User'}
                                          className="w-11 h-11 rounded-full border-2 border-emerald-400/50 group-hover:border-emerald-400 group-hover:scale-105 transition-all duration-300"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/default-avatar.png';
                                          }}
                                        />
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <p className="text-sm font-semibold text-white group-hover:text-emerald-200 transition-colors truncate">
                                            {userName}
                                          </p>
                                          {isMutualFriend && (
                                            <div title="Friend (Follows you back)" className="flex-shrink-0">
                                              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                                            </div>
                                          )}
                                        </div>
                                        <p className="text-white/70 text-xs truncate">
                                          @{followingUser.username || followingUser.nickname || 'user'}
                                        </p>
                                      </div>
                                      <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-emerald-300 transition-colors" />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Offline Users Section */}
                          {sortedOffline.length > 0 && (
                            <div>
                              <div className="flex items-center space-x-2 mb-3 px-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                                  Offline ({sortedOffline.length})
                                </span>
                              </div>
                              <div className="space-y-1">
                                {sortedOffline.map((followingUser, index) => {
                                  const isMutualFriend = followerIds.has(followingUser.id || followingUser.user_id);
                                  const userName = followingUser.display_name || 
                                                 followingUser.name || 
                                                 (followingUser.first_name && followingUser.last_name ? 
                                                   `${followingUser.first_name} ${followingUser.last_name}` : '') ||
                                                 followingUser.username || 
                                                 'Unknown User';
                                  
                                  return (
                                    <div
                                      key={`offline-${index}`}
                                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer group border border-transparent hover:border-white/10 opacity-75"
                                      onClick={(e) => { e.stopPropagation(); onUserClick(followingUser); }}
                                    >
                                      <div className="relative flex-shrink-0">
                                        <img
                                          src={followingUser.avatar || followingUser.profile_image || '/default-avatar.png'}
                                          alt={followingUser.username || 'User'}
                                          className="w-11 h-11 rounded-full border-2 border-gray-400/50 group-hover:border-gray-400 group-hover:scale-105 transition-all duration-300"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/default-avatar.png';
                                          }}
                                        />
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gray-500 rounded-full border-2 border-white"></div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <p className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors truncate">
                                            {userName}
                                          </p>
                                          {isMutualFriend && (
                                            <div title="Friend (Follows you back)" className="flex-shrink-0">
                                              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                                            </div>
                                          )}
                                        </div>
                                        <p className="text-white/50 text-xs truncate">
                                          @{followingUser.username || followingUser.nickname || 'user'}
                                        </p>
                                      </div>
                                      <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/50 transition-colors" />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div> 
      </div>
    </div>             
  )
}