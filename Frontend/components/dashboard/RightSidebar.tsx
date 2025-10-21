'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Users,
  Calendar,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Settings,
  LogOut,
  Shield,
  Zap,
  Dot,
  User,
  UserCheck,
  UserPlus,
  Mail,
  Check,
  X,
  Lock
} from 'lucide-react'
import { useWebSocket } from '@/context/WebSocketContext'
import { api, Event } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import { getAvatarUrl } from '@/utils/avatarUtils'

interface User {
  id?: number
  user_id?: number
  username?: string
  nickname?: string
  name?: string
  display_name?: string
  first_name?: string
  last_name?: string
  avatar?: string
  profile_image?: string
  status?: string
}

// interface FollowRequest {
//   id: number
//   requester?: {
//     id: number
//     first_name?: string
//     last_name?: string
//     nickname?: string
//     username?: string
//     avatar?: string
//   }
//   created_at: string
// }

interface FollowRequest {
  request_id: number
  user: {
    id: number
    first_name?: string
    last_name?: string
    avatar?: string
    nickname?: string
  }
  requested_at: string
}

interface GroupInvitation {
  id: number
  group?: {
    id: number
    title?: string
    creator?: {
      id: number
      first_name?: string
      last_name?: string
      avatar?: string
    }
  }
  created_at: string
  // backend-added fields to distinguish types
  type?: 'invite' | 'join_request'
  request_user?: {
    id: number
    first_name?: string
    last_name?: string
    avatar?: string
    nickname?: string
  } | null
}

interface RightSidebarProps {
  onlineUsers: User[]
  followingUsers?: User[]
  followersUsers?: User[]
  onUserClick: (user: User) => void
  currentUser: {
    id: number
    name: string
    username: string
    avatar?: string
    isPrivate: boolean
    followers: number
    following: number
    posts: number
    status: string
    lastStatusChange: string
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
  onUserClick,
  currentUser,
  setActiveTab,
  logout
}: RightSidebarProps) {
  const router = useRouter()
  const { sendMessage } = useWebSocket()
  const { success, error } = useToast()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [userStatus, setUserStatus] = useState('online')
  const [isClient, setIsClient] = useState(false)
  const [expandedSection, setExpandedSection] = useState<'calendar' | 'following' | 'invitations' | null>('calendar')

  // Calendar state
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [showEventsSlideUp, setShowEventsSlideUp] = useState(false)
  const [slideUpDate, setSlideUpDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false)
  const [tempYear, setTempYear] = useState(new Date().getFullYear())
  const [tempMonth, setTempMonth] = useState(new Date().getMonth())

  // Invitations state
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([])
  const [groupInvitations, setGroupInvitations] = useState<GroupInvitation[]>([])
  const [loadingInvitations, setLoadingInvitations] = useState(false)

  // Update time every minute and handle client-side hydration
  useEffect(() => {
    setIsClient(true)
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Set initial status from currentUser
  useEffect(() => {
    if (currentUser?.status) {
      setUserStatus(currentUser.status)
    }
  }, [currentUser?.status])

  // Fetch user events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!currentUser?.id) return

      try {
        const response = await api.getUserEvents()
        // Filter only events where user is going
        const goingEvents = response.events ? response.events.filter(event => event.user_response === 'going') : []
        setEvents(goingEvents)
      } catch (err) {
        console.error('Failed to fetch events:', err)
        error('Failed to load events')
      }
    }

    fetchEvents()
  }, [currentUser?.id, error])

  // Fetch user invitations
  useEffect(() => {
    const fetchInvitations = async () => {
      if (!currentUser?.id) return

      try {
        setLoadingInvitations(true)

        // Fetch follow requests
        const followResponse = await api.getFollowRequests()
        setFollowRequests(followResponse.requests || [])

        // Fetch group invitations
        const groupResponse = await api.getGroupInvitations()
        setGroupInvitations(groupResponse.invitations || [])

      } catch (err) {
        console.error('Failed to fetch invitations:', err)
        error('Failed to load invitations')
      } finally {
        setLoadingInvitations(false)
      }
    }

    fetchInvitations()
  }, [currentUser?.id, error])

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (!currentUser?.id) return

    try {
      // Call API to update status
      await api.updateUserStatus(newStatus)

      // Update local state
      setUserStatus(newStatus)

      // Send WebSocket message to broadcast status change
      sendMessage({
        type: 'user_status',
        data: {
          user_id: currentUser.id,
          status: newStatus,
          timestamp: new Date().toISOString()
        }
      })

      success(`Status updated to ${statusOptions.find(s => s.id === newStatus)?.label}`)
    } catch (err) {
      console.error('Failed to update status:', err)
      error('Failed to update status. Please try again.')
    }
  }

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

  // Initialize temp values when picker opens
  const openMonthYearPicker = () => {
    setTempYear(calendarDate.getFullYear())
    setTempMonth(calendarDate.getMonth())
    setShowMonthYearPicker(true)
  }

  // Apply temp values when done is pressed
  const applyMonthYearSelection = () => {
    const newDate = new Date(tempYear, tempMonth, 1);
    setCalendarDate(newDate);
    setShowMonthYearPicker(false);
  }

  // Close month/year picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMonthYearPicker) {
        const target = event.target as Element;
        if (!target.closest('.month-year-picker')) {
          setShowMonthYearPicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMonthYearPicker]);

  // Transform events for calendar display
  const getEventsForDate = (date: Date) => {
    return events
      .filter(event => {
        const eventDate = new Date(event.event_time)
        // Compare dates in local timezone to avoid timezone shift issues
        return eventDate.getFullYear() === date.getFullYear() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getDate() === date.getDate()
      })
      .map(event => ({
        id: event.id,
        title: event.title,
        time: new Date(event.event_time).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        color: 'bg-blue-400'
      }))
  }

  // Handle date click to show events slide-up
  const handleDateClick = (date: Date) => {
    const eventsForDate = getEventsForDate(date)
    if (eventsForDate.length > 0) {
      setSelectedDate(date) // Update selected date for greeting text
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
    return events.some(event => {
      const eventDate = new Date(event.event_time)
      return eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
    })
  }

  const toggleSection = (section: 'calendar' | 'following' | 'invitations') => {
    setExpandedSection(expandedSection === section ? null : section)
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
                    {(() => {
                      const avatarUrl = currentUser?.avatar ? getAvatarUrl(currentUser.avatar) : null;
                      return avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={currentUser?.name || 'User'}
                          width={48}
                          height={48}
                          unoptimized={avatarUrl.includes('/svg')}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                          {currentUser?.name?.[0]?.toUpperCase() || '?'}{currentUser?.name?.[1]?.toUpperCase() || ''}
                        </div>
                      );
                    })()}
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
                        <Lock className="w-3 h-3 text-amber-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-white/60 truncate">@{currentUser?.username || 'username'}</p>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-xs text-white/60">
                      <span className="font-medium text-white">{currentUser?.posts || 0}</span> Posts
                    </span>
                    <span className="text-xs text-white/60">
                      <span className="font-medium text-white">{currentUser?.following || 0}</span> Following
                    </span>
                    <span className="text-xs text-white/60">
                      <span className="font-medium text-white">{currentUser?.followers || 0}</span> Followers
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
                        onClick={() => handleStatusChange(status.id)}
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
        <div className={`sidebar-section bg-gradient-to-br from-blue-500/10 via-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-blue-400/20 shadow-xl ${expandedSection === 'calendar' ? 'expandable' : 'collapsed'
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
                  // Count events for selected date using local date comparison
                  const selectedDateEvents = events.filter(event => {
                    const eventDate = new Date(event.event_time)
                    return eventDate.getFullYear() === selectedDate.getFullYear() &&
                      eventDate.getMonth() === selectedDate.getMonth() &&
                      eventDate.getDate() === selectedDate.getDate()
                  })
                  if (selectedDateEvents.length === 0) {
                    const isSameDay = (date1: Date, date2: Date) => {
                      return date1.getDate() === date2.getDate() &&
                        date1.getMonth() === date2.getMonth() &&
                        date1.getFullYear() === date2.getFullYear();
                    };
                    return isSameDay(selectedDate, new Date())
                      ? "No events for today"
                      : `No events for ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                  } else if (selectedDateEvents.length === 1) {
                    return `1 event on ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                  } else {
                    return `${selectedDateEvents.length} events on ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openMonthYearPicker();
                      }}
                      className="text-blue-400 text-xs font-medium min-w-[80px] text-center hover:bg-white/10 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                      title="Select month and year"
                    >
                      {calendarDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigateMonth('next'); }}
                      className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                      title="Next month"
                    >
                      <ChevronRight className="w-4 h-4 text-blue-400" />
                    </button>
                  </div>
                </div>

                {/* Month/Year Picker */}
                {showMonthYearPicker && (
                  <div className="mb-3 bg-white/5 rounded-xl p-3 border border-white/10 month-year-picker">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Year Selector */}
                      <div>
                        <label className="text-white/70 text-xs font-medium mb-2 block">Year</label>
                        <select
                          value={tempYear}
                          onChange={(e) => {
                            setTempYear(parseInt(e.target.value));
                          }}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-colors"
                          aria-label="Select year"
                        >
                          {Array.from({ length: 10 }, (_, i) => {
                            const year = new Date().getFullYear() - 2 + i;
                            return (
                              <option key={year} value={year} className="bg-slate-800">
                                {year}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Month Selector */}
                      <div>
                        <label className="text-white/70 text-xs font-medium mb-2 block">Month</label>
                        <select
                          value={tempMonth}
                          onChange={(e) => {
                            setTempMonth(parseInt(e.target.value));
                          }}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-colors"
                          aria-label="Select month"
                        >
                          {[
                            'January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'
                          ].map((month, index) => (
                            <option key={index} value={index} className="bg-slate-800">
                              {month}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Quick Navigation Buttons */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                      <button
                        onClick={() => {
                          const today = new Date();
                          setCalendarDate(new Date(today.getFullYear(), today.getMonth(), 1));
                          setSelectedDate(today);
                          setShowMonthYearPicker(false);
                        }}
                        className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
                      >
                        Today
                      </button>
                      <button
                        onClick={applyMonthYearSelection}
                        className="text-white/60 hover:text-white text-xs font-medium transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}

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
                      const startDate = new Date(firstDay);
                      startDate.setDate(startDate.getDate() - firstDay.getDay());

                      const days = [];
                      for (let i = 0; i < 42; i++) {
                        const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);

                        const isCurrentMonth = currentDate.getMonth() === calendarDate.getMonth();
                        const isToday = currentDate.toDateString() === today.toDateString();
                        const isSelected = currentDate.toDateString() === selectedDate.toDateString();
                        const hasEventDots = hasEvents(currentDate);

                        days.push(
                          <button
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDateClick(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()));
                            }}
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
                        <div className="max-h-60 overflow-y-scroll scrollbar-hide p-4 space-y-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          {(() => {
                            const eventsForDate = getEventsForDate(slideUpDate);
                            return eventsForDate.map((event) => {
                              // Find the full event details
                              const fullEvent = events.find(e => e.id === event.id);
                              return (
                                <div key={event.id} className="bg-white/15 rounded-lg p-3 border border-white/20 hover:bg-white/25 transition-colors">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center space-x-2 flex-1">
                                      <span className="text-sm text-white font-medium">{event.title}</span>
                                      {fullEvent?.canceled && (
                                        <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium">
                                          CANCELED
                                        </span>
                                      )}
                                      {fullEvent && !fullEvent.canceled && new Date(fullEvent.event_time) < new Date() && (
                                        <span className="px-1.5 py-0.5 bg-gray-500 text-white text-xs rounded-full font-medium">
                                          ENDED
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs text-white/70 ml-2 flex-shrink-0">{event.time}</span>
                                  </div>
                                  {fullEvent?.location && (
                                    <div className="flex items-center space-x-2 mb-2">
                                      <MapPin className="w-3 h-3 text-white/60" />
                                      <span className="text-xs text-white/80">{fullEvent.location}</span>
                                    </div>
                                  )}
                                  {fullEvent?.group && (
                                    <div className="flex items-center space-x-2 mb-2">
                                      <Users className="w-3 h-3 text-white/60" />
                                      <span className="text-xs text-white/80">{fullEvent.group.title}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 ${event.color} rounded-full`}></div>
                                    <span className="text-xs text-white/80">
                                      {fullEvent?.going_count || 0} going • {fullEvent?.not_going_count || 0} not going
                                    </span>
                                  </div>
                                </div>
                              );
                            });
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
        <div className={`sidebar-section bg-gradient-to-br from-emerald-500/10 via-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-emerald-400/20 shadow-xl ${expandedSection === 'following' ? 'expandable' : 'collapsed'
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
                  // Use followingUsers if available, otherwise fall back to onlineUsers
                  const allFollowing = followingUsers.length > 0 ? followingUsers : onlineUsers;
                  const filteredUsers = allFollowing.filter(user =>
                    (user.username !== currentUser?.username) &&
                    (user.id !== currentUser?.id) &&
                    (user.user_id !== currentUser?.id)
                  );

                  // Count online following users (users with status 'online')
                  const onlineCount = filteredUsers.filter(user => {
                    const onlineUser = onlineUsers.find(u => u.user_id === (user.id || user.user_id))
                    return onlineUser?.status === 'online'
                  }).length;

                  // Only show online indicator if there are online following users
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
              <div className="section-content following-content flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-scroll scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
                      const sortByName = (a: User, b: User) => {
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
                            <p className="text-white/40 text-sm mb-4">Start following people to see them here</p>
                            <button
                              onClick={() => setActiveTab('discover')}
                              className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 rounded-xl text-sm font-medium transition-all duration-200 border border-emerald-400/30 hover:border-emerald-400/50"
                            >
                              <Users className="w-4 h-4" />
                              <span>Discover People</span>
                            </button>
                          </div>
                        );
                      }

                      // Calculate users by status
                      const usersByStatus = {
                        online: sortedUsers.filter(user => {
                          const onlineUser = onlineUsers.find(u => u.user_id === (user.id || user.user_id))
                          return onlineUser?.status === 'online'
                        }),
                        busy: sortedUsers.filter(user => {
                          const onlineUser = onlineUsers.find(u => u.user_id === (user.id || user.user_id))
                          return onlineUser?.status === 'busy'
                        }),
                        away: sortedUsers.filter(user => {
                          const onlineUser = onlineUsers.find(u => u.user_id === (user.id || user.user_id))
                          return onlineUser?.status === 'away'
                        }),
                        offline: sortedUsers.filter(user => {
                          const onlineUser = onlineUsers.find(u => u.user_id === (user.id || user.user_id))
                          return !onlineUser || onlineUser.status === 'offline' || onlineUser.status === 'invisible'
                        })
                      }

                      return (
                        <>
                          {/* Online Users */}
                          {usersByStatus.online.length > 0 && (
                            <div className="mb-4">
                              <div className="flex items-center space-x-2 mb-3 px-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-green-400 text-xs font-semibold uppercase tracking-wide">
                                  Online ({usersByStatus.online.length})
                                </span>
                              </div>
                              <div className="space-y-1">
                                {usersByStatus.online.map((followingUser, index) => {
                                  const isMutualFriend = followerIds.has(followingUser.id || followingUser.user_id)
                                  const userName = followingUser.display_name ||
                                    followingUser.name ||
                                    (followingUser.first_name && followingUser.last_name ?
                                      `${followingUser.first_name} ${followingUser.last_name}` : '') ||
                                    followingUser.username ||
                                    'Unknown User'

                                  return (
                                    <div
                                      key={`online-${index}`}
                                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-green-500/10 transition-all duration-300 cursor-pointer group border border-transparent hover:border-green-400/20"
                                      onClick={(e) => { e.stopPropagation(); onUserClick(followingUser); }}
                                    >
                                      <div className="relative flex-shrink-0">
                                        {getAvatarUrl(followingUser.avatar || followingUser.profile_image) ? (
                                          <Image
                                            src={getAvatarUrl(followingUser.avatar || followingUser.profile_image)!}
                                            alt={followingUser.username || 'User'}
                                            width={44}
                                            height={44}
                                            unoptimized={getAvatarUrl(followingUser.avatar || followingUser.profile_image)!.includes('/svg')}
                                            className="w-11 h-11 rounded-full border-2 border-green-400/50 group-hover:border-green-400 group-hover:scale-105 transition-all duration-300"
                                          />
                                        ) : (
                                          <div className="w-11 h-11 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold border-2 border-green-400/50 group-hover:border-green-400 group-hover:scale-105 transition-all duration-300">
                                            {followingUser.first_name?.[0] || followingUser.name?.[0] || followingUser.username?.[0] || '?'}{followingUser.last_name?.[0] || followingUser.name?.[1] || followingUser.username?.[1] || ''}
                                          </div>
                                        )}
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <p className="text-sm font-semibold text-white group-hover:text-green-200 transition-colors truncate">
                                            {userName}
                                          </p>
                                          {isMutualFriend && (
                                            <div title="Friend (Follows you back)" className="flex-shrink-0">
                                              <UserCheck className="w-3.5 h-3.5 text-green-400" />
                                            </div>
                                          )}
                                        </div>
                                        <p className="text-white/70 text-xs truncate">
                                          @{followingUser.username || followingUser.nickname || 'user'}
                                        </p>
                                      </div>
                                      <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-green-300 transition-colors" />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Busy Users */}
                          {usersByStatus.busy.length > 0 && (
                            <div className="mb-4">
                              <div className="flex items-center space-x-2 mb-3 px-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-red-400 text-xs font-semibold uppercase tracking-wide">
                                  Busy ({usersByStatus.busy.length})
                                </span>
                              </div>
                              <div className="space-y-1">
                                {usersByStatus.busy.map((followingUser, index) => {
                                  const isMutualFriend = followerIds.has(followingUser.id || followingUser.user_id)
                                  const userName = followingUser.display_name ||
                                    followingUser.name ||
                                    (followingUser.first_name && followingUser.last_name ?
                                      `${followingUser.first_name} ${followingUser.last_name}` : '') ||
                                    followingUser.username ||
                                    'Unknown User'

                                  return (
                                    <div
                                      key={`busy-${index}`}
                                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-red-500/10 transition-all duration-300 cursor-pointer group border border-transparent hover:border-red-400/20"
                                      onClick={(e) => { e.stopPropagation(); onUserClick(followingUser); }}
                                    >
                                      <div className="relative flex-shrink-0">
                                        {getAvatarUrl(followingUser.avatar || followingUser.profile_image) ? (
                                          <Image
                                            src={getAvatarUrl(followingUser.avatar || followingUser.profile_image)!}
                                            alt={followingUser.username || 'User'}
                                            width={44}
                                            height={44}
                                            unoptimized={getAvatarUrl(followingUser.avatar || followingUser.profile_image)!.includes('/svg')}
                                            className="w-11 h-11 rounded-full border-2 border-red-400/50 group-hover:border-red-400 group-hover:scale-105 transition-all duration-300"
                                          />
                                        ) : (
                                          <div className="w-11 h-11 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold border-2 border-red-400/50 group-hover:border-red-400 group-hover:scale-105 transition-all duration-300">
                                            {followingUser.first_name?.[0] || followingUser.name?.[0] || followingUser.username?.[0] || '?'}{followingUser.last_name?.[0] || followingUser.name?.[1] || followingUser.username?.[1] || ''}
                                          </div>
                                        )}
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <p className="text-sm font-semibold text-white group-hover:text-red-200 transition-colors truncate">
                                            {userName}
                                          </p>
                                          {isMutualFriend && (
                                            <div title="Friend (Follows you back)" className="flex-shrink-0">
                                              <UserCheck className="w-3.5 h-3.5 text-red-400" />
                                            </div>
                                          )}
                                        </div>
                                        <p className="text-white/70 text-xs truncate">
                                          @{followingUser.username || followingUser.nickname || 'user'}
                                        </p>
                                      </div>
                                      <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-red-300 transition-colors" />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Away Users */}
                          {usersByStatus.away.length > 0 && (
                            <div className="mb-4">
                              <div className="flex items-center space-x-2 mb-3 px-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span className="text-yellow-400 text-xs font-semibold uppercase tracking-wide">
                                  Away ({usersByStatus.away.length})
                                </span>
                              </div>
                              <div className="space-y-1">
                                {usersByStatus.away.map((followingUser, index) => {
                                  const isMutualFriend = followerIds.has(followingUser.id || followingUser.user_id)
                                  const userName = followingUser.display_name ||
                                    followingUser.name ||
                                    (followingUser.first_name && followingUser.last_name ?
                                      `${followingUser.first_name} ${followingUser.last_name}` : '') ||
                                    followingUser.username ||
                                    'Unknown User'

                                  return (
                                    <div
                                      key={`away-${index}`}
                                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-yellow-500/10 transition-all duration-300 cursor-pointer group border border-transparent hover:border-yellow-400/20"
                                      onClick={(e) => { e.stopPropagation(); onUserClick(followingUser); }}
                                    >
                                      <div className="relative flex-shrink-0">
                                        {getAvatarUrl(followingUser.avatar || followingUser.profile_image) ? (
                                          <Image
                                            src={getAvatarUrl(followingUser.avatar || followingUser.profile_image)!}
                                            alt={followingUser.username || 'User'}
                                            width={44}
                                            height={44}
                                            unoptimized={getAvatarUrl(followingUser.avatar || followingUser.profile_image)!.includes('/svg')}
                                            className="w-11 h-11 rounded-full border-2 border-yellow-400/50 group-hover:border-yellow-400 group-hover:scale-105 transition-all duration-300"
                                          />
                                        ) : (
                                          <div className="w-11 h-11 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold border-2 border-yellow-400/50 group-hover:border-yellow-400 group-hover:scale-105 transition-all duration-300">
                                            {followingUser.first_name?.[0] || followingUser.name?.[0] || followingUser.username?.[0] || '?'}{followingUser.last_name?.[0] || followingUser.name?.[1] || followingUser.username?.[1] || ''}
                                          </div>
                                        )}
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white"></div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <p className="text-sm font-semibold text-white group-hover:text-yellow-200 transition-colors truncate">
                                            {userName}
                                          </p>
                                          {isMutualFriend && (
                                            <div title="Friend (Follows you back)" className="flex-shrink-0">
                                              <UserCheck className="w-3.5 h-3.5 text-yellow-400" />
                                            </div>
                                          )}
                                        </div>
                                        <p className="text-white/70 text-xs truncate">
                                          @{followingUser.username || followingUser.nickname || 'user'}
                                        </p>
                                      </div>
                                      <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-yellow-300 transition-colors" />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Offline Users */}
                          {usersByStatus.offline.length > 0 && (
                            <div>
                              <div className="flex items-center space-x-2 mb-3 px-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                                  Offline ({usersByStatus.offline.length})
                                </span>
                              </div>
                              <div className="space-y-1">
                                {usersByStatus.offline.map((followingUser, index) => {
                                  const isMutualFriend = followerIds.has(followingUser.id || followingUser.user_id)
                                  const userName = followingUser.display_name ||
                                    followingUser.name ||
                                    (followingUser.first_name && followingUser.last_name ?
                                      `${followingUser.first_name} ${followingUser.last_name}` : '') ||
                                    followingUser.username ||
                                    'Unknown User'

                                  return (
                                    <div
                                      key={`offline-${index}`}
                                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer group border border-transparent hover:border-white/10 opacity-75"
                                      onClick={(e) => { e.stopPropagation(); onUserClick(followingUser); }}
                                    >
                                      <div className="relative flex-shrink-0">
                                        {getAvatarUrl(followingUser.avatar || followingUser.profile_image) ? (
                                          <Image
                                            src={getAvatarUrl(followingUser.avatar || followingUser.profile_image)!}
                                            alt={followingUser.username || 'User'}
                                            width={44}
                                            height={44}
                                            unoptimized={getAvatarUrl(followingUser.avatar || followingUser.profile_image)!.includes('/svg')}
                                            className="w-11 h-11 rounded-full border-2 border-gray-400/50 group-hover:border-gray-400 group-hover:scale-105 transition-all duration-300"
                                          />
                                        ) : (
                                          <div className="w-11 h-11 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold border-2 border-gray-400/50 group-hover:border-gray-400 group-hover:scale-105 transition-all duration-300">
                                            {followingUser.first_name?.[0] || followingUser.name?.[0] || followingUser.username?.[0] || '?'}{followingUser.last_name?.[0] || followingUser.name?.[1] || followingUser.username?.[1] || ''}
                                          </div>
                                        )}
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gray-500 rounded-full border-2 border-white"></div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <p className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors truncate">
                                            {userName}
                                          </p>
                                          {isMutualFriend && (
                                            <div title="Friend (Follows you back)" className="flex-shrink-0">
                                              <UserCheck className="w-3.5 h-3.5 text-gray-400" />
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

        {/* Invitations Section */}
        <div className={`sidebar-section bg-gradient-to-br from-orange-500/10 via-red-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl border border-orange-400/20 shadow-xl ${expandedSection === 'invitations' ? 'expandable' : 'collapsed'
          }`}>
          <div className="p-4">
            <div
              className={`flex items-center justify-between cursor-pointer ${expandedSection === 'invitations' ? 'mb-4 invitations-header-sticky' : 'mb-2 h-12'}`}
              onClick={() => toggleSection('invitations')}
            >
              <h3 className="text-white font-bold text-base flex items-center">
                <Mail className="w-4 h-4 text-orange-400 mr-2.5" />
                Invitations
                {(followRequests.length + groupInvitations.length) > 0 && (
                  <span className="ml-2 bg-orange-500/20 text-orange-300 text-xs px-2 py-0.5 rounded-full font-semibold">
                    {followRequests.length + groupInvitations.length}
                  </span>
                )}
              </h3>
              <div className="flex items-center space-x-2">
                {(followRequests.length + groupInvitations.length) > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    <span className="text-orange-400 text-xs font-medium">
                      {followRequests.length + groupInvitations.length} pending
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Expanded State */}
            {expandedSection === 'invitations' && (
              <div className={`section-content invitation-content flex-1 flex flex-col min-h-0 ${expandedSection === 'invitations' ? 'invitations-content-expanded' : ''}`}>
                <div className="flex-1 overflow-y-scroll scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <div className="space-y-3">
                    {loadingInvitations ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-400"></div>
                      </div>
                    ) : (followRequests.length + groupInvitations.length) > 0 ? (
                      <>
                        {/* Follow Requests */}
                        {followRequests.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center space-x-2 mb-3 px-2">
                              <UserPlus className="w-4 h-4 text-blue-400" />
                              <span className="text-blue-400 text-sm font-semibold">
                                Follow Requests ({followRequests.length})
                              </span>
                            </div>
                            <div className="space-y-2">
                              {followRequests.map((request) => (
                                console.log("Request:", request),
                                console.log("Requester:", request.user?.avatar),
                                <div
                                  key={`follow-${request.request_id}`}
                                  className="relative bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl p-3 border border-blue-400/20 hover:border-blue-400/40 shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group overflow-hidden"
                                >
                                  {/* Subtle background pattern */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                  <div className="relative z-10">
                                    <div className="flex items-start space-x-3 mb-3">
                                      <div className="relative flex-shrink-0">
                                        {getAvatarUrl(request.user?.avatar) ? (
                                          <Image
                                            src={getAvatarUrl(request.user?.avatar)!}
                                            alt={request.user?.first_name + ' ' + request.user?.last_name}
                                            width={40}
                                            height={40}
                                            unoptimized={getAvatarUrl(request.user?.avatar)!.includes('/svg')}
                                            className="w-10 h-10 rounded-full border-2 border-blue-400/50 group-hover:border-blue-400 group-hover:scale-105 transition-all duration-300 shadow-lg"
                                          />
                                        ) : (
                                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold border-2 border-blue-400/50 group-hover:border-blue-400 group-hover:scale-105 transition-all duration-300 shadow-lg">
                                            {request.user?.first_name?.[0] || request.user?.nickname?.[0] || '?'}{request.user?.last_name?.[0] || request.user?.nickname?.[1] || ''}
                                          </div>
                                        )}
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                                          <UserPlus className="w-2 h-2 text-white" />
                                        </div>
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate group-hover:text-blue-200 transition-colors">
                                              {request.user?.first_name} {request.user?.last_name}
                                            </p>
                                            <p className="text-xs text-white/70 truncate">
                                              @{request.user?.nickname || request.user?.nickname}
                                            </p>
                                          </div>
                                          <div className="flex flex-col items-end ml-2">
                                            <span className="text-xs text-white/50 font-medium">
                                              {new Date(request.requested_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric'
                                              })}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                          <div className="px-2 py-0.5 bg-blue-500/20 rounded-full border border-blue-400/30">
                                            <p className="text-xs text-blue-300 font-medium flex items-center">
                                              <UserPlus className="w-3 h-3 mr-1" />
                                              Follow Request
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-center space-x-3">
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                            if (!request.user?.id) return;
                                            await api.respondToFollowRequest(request.user.id, 'accept');
                                            setFollowRequests(prev => prev.filter(r => r.request_id !== request.request_id));
                                            success('Follow request accepted');
                                          } catch (err) {
                                            console.error('Failed to accept follow request:', err);
                                            error('Failed to accept follow request');
                                          }
                                        }}
                                        className="flex items-center justify-center space-x-1 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white rounded-lg text-xs font-semibold transition-all duration-300 shadow-md hover:shadow-emerald-500/25 hover:scale-105"
                                      >
                                        <Check className="w-3 h-3" />
                                        <span>Accept</span>
                                      </button>
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                            if (!request.user?.id) return;
                                            await api.respondToFollowRequest(request.user.id, 'decline');
                                            setFollowRequests(prev => prev.filter(r => r.request_id !== request.request_id));
                                            success('Follow request declined');
                                          } catch (err) {
                                            console.error('Failed to decline follow request:', err);
                                            error('Failed to decline follow request');
                                          }
                                        }}
                                        className="flex items-center justify-center space-x-1 px-4 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white rounded-lg text-xs font-semibold transition-all duration-300 shadow-md hover:shadow-red-500/25 hover:scale-105"
                                      >
                                        <X className="w-3 h-3" />
                                        <span>Decline</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Group Invitations and Join Requests */}
                        {groupInvitations.length > 0 && (
                          <div>
                            <div className="flex items-center space-x-2 mb-3 px-2">
                              <Mail className="w-4 h-4 text-orange-400" />
                              <span className="text-orange-400 text-sm font-semibold">
                                Group Invitations ({groupInvitations.length})
                              </span>
                            </div>
                            <div className="space-y-2">
                              {groupInvitations.map((invitation) => (
                                <div
                                  key={`group-${invitation.id}`}
                                  className="relative bg-gradient-to-br from-orange-500/10 via-red-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl p-3 border border-orange-400/20 hover:border-orange-400/40 shadow-lg hover:shadow-orange-500/10 transition-all duration-300 group overflow-hidden"
                                >
                                  {/* Subtle background pattern */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                  <div className="relative z-10">
                                    <div className="flex items-start space-x-3 mb-3">
                                      <div className="relative flex-shrink-0">
                                        {getAvatarUrl((invitation.type === 'join_request' ? invitation.request_user?.avatar : invitation.group?.creator?.avatar)) ? (
                                          <Image
                                            src={getAvatarUrl((invitation.type === 'join_request' ? invitation.request_user?.avatar : invitation.group?.creator?.avatar))!}
                                            alt={invitation.type === 'join_request'
                                              ? `${invitation.request_user?.first_name || ''} ${invitation.request_user?.last_name || ''}`
                                              : `${invitation.group?.creator?.first_name || ''} ${invitation.group?.creator?.last_name || ''}`}
                                            width={40}
                                            height={40}
                                            unoptimized={getAvatarUrl((invitation.type === 'join_request' ? invitation.request_user?.avatar : invitation.group?.creator?.avatar))!.includes('/svg')}
                                            className="w-10 h-10 rounded-full border-2 border-orange-400/50 group-hover:border-orange-400 group-hover:scale-105 transition-all duration-300 shadow-lg"
                                          />
                                        ) : (
                                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center text-white font-bold border-2 border-orange-400/50 group-hover:border-orange-400 group-hover:scale-105 transition-all duration-300 shadow-lg">
                                            {invitation.type === 'join_request'
                                              ? (invitation.request_user?.first_name?.[0] || invitation.request_user?.nickname?.[0] || '?') + (invitation.request_user?.last_name?.[0] || invitation.request_user?.nickname?.[1] || '')
                                              : (invitation.group?.creator?.first_name?.[0] || invitation.group?.title?.[0] || '?') + (invitation.group?.creator?.last_name?.[0] || invitation.group?.title?.[1] || '')}
                                          </div>
                                        )}
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                                          <Users className="w-2 h-2 text-white" />
                                        </div>
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate group-hover:text-orange-200 transition-colors">
                                              {invitation.group?.title}
                                            </p>
                                            <p className="text-xs text-white/70 truncate">
                                              {invitation.type === 'join_request'
                                                ? `${invitation.request_user?.first_name || ''} ${invitation.request_user?.last_name || ''}`
                                                : `by ${invitation.group?.creator?.first_name || ''} ${invitation.group?.creator?.last_name || ''}`}
                                            </p>
                                          </div>
                                          <div className="flex flex-col items-end ml-2">
                                            <span className="text-xs text-white/50 font-medium">
                                              {new Date(invitation.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric'
                                              })}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                          <div className="px-2 py-0.5 bg-orange-500/20 rounded-full border border-orange-400/30">
                                            <p className="text-xs text-orange-300 font-medium flex items-center">
                                              {invitation.type === 'join_request' ? (
                                                <>
                                                  <UserPlus className="w-3 h-3 mr-1" />
                                                  Join Request
                                                </>
                                              ) : (
                                                <>
                                                  <Mail className="w-3 h-3 mr-1" />
                                                  Group Invite
                                                </>
                                              )}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-center space-x-3">
                                      {invitation.type === 'join_request' ? (
                                        <>
                                          <button
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              try {
                                                if (!invitation.group?.id || !invitation.request_user?.id) return;
                                                await api.respondToJoinRequest(invitation.group.id, invitation.request_user.id, 'accept');
                                                setGroupInvitations(prev => prev.filter(i => i.id !== invitation.id));
                                                success('Join request accepted');
                                              } catch (err) {
                                                console.error('Failed to accept join request:', err);
                                                error('Failed to accept join request');
                                              }
                                            }}
                                            className="flex items-center justify-center space-x-1 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white rounded-lg text-xs font-semibold transition-all duration-300 shadow-md hover:shadow-emerald-500/25 hover:scale-105"
                                          >
                                            <Check className="w-3 h-3" />
                                            <span>Accept</span>
                                          </button>
                                          <button
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              try {
                                                if (!invitation.group?.id || !invitation.request_user?.id) return;
                                                await api.respondToJoinRequest(invitation.group.id, invitation.request_user.id, 'decline');
                                                setGroupInvitations(prev => prev.filter(i => i.id !== invitation.id));
                                                success('Join request declined');
                                              } catch (err) {
                                                console.error('Failed to decline join request:', err);
                                                error('Failed to decline join request');
                                              }
                                            }}
                                            className="flex items-center justify-center space-x-1 px-4 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white rounded-lg text-xs font-semibold transition-all duration-300 shadow-md hover:shadow-red-500/25 hover:scale-105"
                                          >
                                            <X className="w-3 h-3" />
                                            <span>Decline</span>
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              try {
                                                if (!invitation.group?.id) return;
                                                await api.acceptGroupInvitation(invitation.group.id);
                                                setGroupInvitations(prev => prev.filter(i => i.id !== invitation.id));
                                                success('Group invitation accepted');
                                              } catch (err) {
                                                console.error('Failed to accept group invitation:', err);
                                                error('Failed to accept group invitation');
                                              }
                                            }}
                                            className="flex items-center justify-center space-x-1 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white rounded-lg text-xs font-semibold transition-all duration-300 shadow-md hover:shadow-emerald-500/25 hover:scale-105"
                                          >
                                            <Check className="w-3 h-3" />
                                            <span>Accept</span>
                                          </button>
                                          <button
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              try {
                                                if (!invitation.group?.id) return;
                                                await api.declineGroupInvitation(invitation.group.id);
                                                setGroupInvitations(prev => prev.filter(i => i.id !== invitation.id));
                                                success('Group invitation declined');
                                              } catch (err) {
                                                console.error('Failed to decline group invitation:', err);
                                                error('Failed to decline group invitation');
                                              }
                                            }}
                                            className="flex items-center justify-center space-x-1 px-4 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white rounded-lg text-xs font-semibold transition-all duration-300 shadow-md hover:shadow-red-500/25 hover:scale-105"
                                          >
                                            <X className="w-3 h-3" />
                                            <span>Decline</span>
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Mail className="w-8 h-8 text-white/40" />
                        </div>
                        <p className="text-white/60 text-base font-medium mb-2">No invitations</p>
                        <p className="text-white/40 text-sm">You&apos;re all caught up!</p>
                      </div>
                    )}
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