'use client'

import { Menu, X, Bell, Search, Users, Calendar, Hash, Filter, FileText, User, ChevronDown, Compass, MessageCircle } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api, getToken } from '@/lib/api'

interface TopBarProps {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
  activeTab: string
  onNotificationsClick: () => void
  unreadCount: number
  onDiscoverClick: () => void
}

interface SearchSuggestion {
  type: 'user' | 'event' | 'group' | 'post' | 'tag' | 'message' | 'chat'
  id: number | string
  title: string
  subtitle: string
  image?: string
  description?: string
  url: string
  metadata?: Record<string, unknown>
}

interface SearchHistoryItem {
  query: string
  timestamp: number
  resultCount: number
}

export default function TopBar({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  activeTab,
  onNotificationsClick,
  unreadCount,
  onDiscoverClick,
}: TopBarProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [popularSearches, setPopularSearches] = useState<string[]>([])
  const [showRecentSearches, setShowRecentSearches] = useState(false)
  const [showSearchHistory, setShowSearchHistory] = useState(false)
  const [pendingJoin, setPendingJoin] = useState<Record<number, boolean>>({})
  const [joinedGroups, setJoinedGroups] = useState<Record<number, boolean>>({})
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const searchFilters = [
    { id: 'all', label: 'All', icon: Filter },
    { id: 'users', label: 'Users', icon: User },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'chat', label: 'Chats', icon: MessageCircle },
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'tags', label: 'Tags', icon: Hash },
    { id: 'message', label: 'Messages', icon: MessageCircle }
  ]

  // Load recent searches, search history, and popular searches from localStorage
  useEffect(() => {
    const storedRecent = localStorage.getItem('recentSearches')
    if (storedRecent) {
      try {
        setRecentSearches(JSON.parse(storedRecent))
      } catch (e) {
        console.error('Failed to parse recent searches:', e)
      }
    }

    const storedHistory = localStorage.getItem('searchHistory')
    if (storedHistory) {
      try {
        const history = JSON.parse(storedHistory)
        setSearchHistory(history.sort((a: SearchHistoryItem, b: SearchHistoryItem) => b.timestamp - a.timestamp))
      } catch (e) {
        console.error('Failed to parse search history:', e)
      }
    }

    const storedPopular = localStorage.getItem('popularSearches')
    if (storedPopular) {
      try {
        setPopularSearches(JSON.parse(storedPopular))
      } catch (e) {
        console.error('Failed to parse popular searches:', e)
      }
    }
  }, [])

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setShowFilterDropdown(false)
        setShowRecentSearches(false)
        setSelectedSuggestionIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch search suggestions with debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (searchQuery.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsSearching(true)
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(searchQuery)
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery])

  const fetchSuggestions = async (query: string) => {
    try {
      const token = getToken()
      if (!token) {
        setIsSearching(false)
        return
      }
      const response = await fetch(`http://localhost:8080/api/search/suggestions?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        let results: SearchSuggestion[] = data.suggestions || []
        // Filter by selected type if not 'all'
        const typeMap: Record<string, string> = { all: 'all', users: 'user', events: 'event', groups: 'group', posts: 'post', tags: 'tag', message: 'message', chat: 'chat' }
        const targetType = typeMap[selectedFilter] || selectedFilter
        if (targetType !== 'all') {
          results = results.filter((s: SearchSuggestion) => s.type === targetType)
        }
        setSuggestions(results)
        setShowSuggestions(true)
        addToSearchHistory(query, results.length)
        updatePopularSearches(query)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const addToRecentSearches = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  const addToSearchHistory = (query: string, resultCount: number) => {
    const newItem: SearchHistoryItem = {
      query,
      timestamp: Date.now(),
      resultCount
    }
    const updated = [newItem, ...searchHistory.filter(h => h.query !== query)].slice(0, 20)
    setSearchHistory(updated)
    localStorage.setItem('searchHistory', JSON.stringify(updated))
  }

  const updatePopularSearches = (query: string) => {
    const currentCount = popularSearches.find(p => p === query) ? 1 : 0
    const updated = [query, ...popularSearches.filter(s => s !== query)].slice(0, 10)
    setPopularSearches(updated)
    localStorage.setItem('popularSearches', JSON.stringify(updated))
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    addToRecentSearches(searchQuery)
    setSearchQuery('')
    setSuggestions([])
    setShowSuggestions(false)
    setSelectedSuggestionIndex(-1)

    // Unified navigation for chats and messages
    if (suggestion.type === 'chat') {
      // Directly open conversation by id
      router.push(`/chats/all?chat=${encodeURIComponent(String(suggestion.id))}`)
      return
    }

    if (suggestion.type === 'message') {
      try {
        const parsed = new URL(suggestion.url, 'http://localhost')
        const chatId = parsed.searchParams.get('chat') || String(suggestion.metadata?.conversationId || '')
        const messageId = parsed.searchParams.get('message') || String(suggestion.id)
        if (chatId) {
          router.push(`/chats/all?chat=${encodeURIComponent(chatId)}&message=${encodeURIComponent(messageId)}`)
          return
        }
      } catch (e) {
        console.warn('Failed to parse message suggestion URL, falling back to /chats/all')
        router.push('/chats/all')
        return
      }
    }

    if (suggestion.type === 'group') {
      const gmeta = suggestion.metadata as Partial<{ joinable: boolean; isMember: boolean }> | undefined
      const joinable = !!gmeta?.joinable
      const isMember = !!gmeta?.isMember
      if (joinable && !isMember) {
        // Row has a Join button; prevent navigation on title click
        return
      }
    }

    // Default: navigate to provided URL
    router.push(suggestion.url)
  }

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query)
    setShowRecentSearches(false)
    setSelectedSuggestionIndex(-1)
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions && !showRecentSearches) return

    const items = showSuggestions ? suggestions : recentSearches
    const maxIndex = items.length - 1

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestionIndex(prev =>
          prev < maxIndex ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestionIndex(prev =>
          prev > 0 ? prev - 1 : maxIndex
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestionIndex >= 0) {
          if (showSuggestions && suggestions[selectedSuggestionIndex]) {
            handleSuggestionClick(suggestions[selectedSuggestionIndex])
          } else if (showRecentSearches && recentSearches[selectedSuggestionIndex]) {
            handleRecentSearchClick(recentSearches[selectedSuggestionIndex])
          }
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setShowRecentSearches(false)
        setSelectedSuggestionIndex(-1)
        break
    }
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'user': return User
      case 'event': return Calendar
      case 'group': return Users
      case 'post': return FileText
      case 'tag': return Hash
      case 'message':
      case 'chat': return MessageCircle
      default: return Search
    }
  }

  const getColorForType = (type: string) => {
    switch (type) {
      case 'user': return 'text-blue-400'
      case 'event': return 'text-purple-400'
      case 'group': return 'text-green-400'
      case 'post': return 'text-orange-400'
      case 'tag': return 'text-pink-400'
      case 'message':
      case 'chat': return 'text-cyan-400'
      default: return 'text-white'
    }
  }

  const handleFilterSelect = (filterId: string) => {
    setSelectedFilter(filterId)
    setShowFilterDropdown(false)
    // Re-trigger search with new filter
    if (searchQuery.length >= 2) {
      fetchSuggestions(searchQuery)
    }
  }

  const toggleFilterDropdown = () => {
    setShowFilterDropdown(!showFilterDropdown)
    setShowSuggestions(false)
  }

  return (
        <header className="topbar-layout">
      <div className="flex items-center justify-between h-16 px-4">
  {/* Left section: Menu button (mobile) */}
  <div className="flex items-center space-x-4 flex-1">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Center Search Bar with adjacent buttons */}
  <div className="flex justify-center items-center space-x-3">
          <div ref={searchRef} className="relative max-w-2xl w-full">
            <div className="flex items-center border-2 border-white/30 rounded-2xl transition-all duration-300 focus-within:border-white/50">
              <div className="flex items-center flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (searchQuery.length < 2 && recentSearches.length > 0) {
                      setShowRecentSearches(true)
                      setShowSuggestions(false)
                    } else if (searchQuery.length >= 2) {
                      setShowSuggestions(true)
                      setShowRecentSearches(false)
                    }
                  }}
                  className="w-full px-4 py-2 pl-10 pr-4 bg-transparent text-white placeholder-white/60 focus:outline-none"
                />
                {isSearching && (
                  <div className="absolute right-24 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              {/* Filter Dropdown Button */}
              <div>
                <button
                  onClick={toggleFilterDropdown}
                  className="flex items-center space-x-2 px-3 py-2 text-white/70 hover:text-white transition-all duration-200 border-l border-white/20"
                >
                  {(() => {
                    const currentFilter = searchFilters.find(f => f.id === selectedFilter)
                    if (!currentFilter) return null
                    const IconComponent = currentFilter.icon
                    return (
                      <>
                        <IconComponent className="w-4 h-4" />
                        <span className="hidden sm:inline text-sm font-medium">{currentFilter.label}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showFilterDropdown ? 'rotate-180' : ''}`} />
                      </>
                    )
                  })()}
                </button>
              </div>
            </div>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 w-full bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-50 max-h-96 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs font-semibold text-white/80 mb-2 px-2">Search Results</div>
                  {suggestions.map((suggestion, index) => {
                    const IconComponent = getIconForType(suggestion.type)
                    const iconColor = getColorForType(suggestion.type)
                    const isSelected = selectedSuggestionIndex === index
                    return (
                      <div
                        key={`${suggestion.type}-${suggestion.id}-${index}`}
                        className={`w-full flex items-start space-x-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {suggestion.image ? (
                          <img 
                            src={suggestion.image} 
                            alt={suggestion.title}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-left flex-1"
                            >
                              <span className="text-sm font-medium text-white group-hover:text-white truncate">
                                {suggestion.title}
                              </span>
                              <span className={`text-xs ${iconColor} capitalize px-2 py-0.5 rounded-full bg-white/10 ml-2`}>
                                {suggestion.type}
                              </span>
                              {suggestion.subtitle && (
                                <span className="text-xs text-white/60 block mt-1 truncate">
                                  {suggestion.subtitle}
                                </span>
                              )}
                            </button>
                            {suggestion.type === 'group' && !!(suggestion.metadata as Partial<{ joinable: boolean; isMember: boolean }>)?.joinable && !(suggestion.metadata as Partial<{ joinable: boolean; isMember: boolean }>)?.isMember && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  const groupId = Number(suggestion.id)
                                  try {
                                    setPendingJoin(prev => ({ ...prev, [groupId]: true }))
                                    await api.joinGroup(groupId)
                                    setJoinedGroups(prev => ({ ...prev, [groupId]: true }))
                                  } catch (err) {
                                    console.error('Join group failed', err)
                                  } finally {
                                    setPendingJoin(prev => ({ ...prev, [groupId]: false }))
                                  }
                                }}
                                className="ml-3 px-3 py-1 text-xs rounded-full bg-emerald-500 hover:bg-emerald-600 text-white whitespace-nowrap"
                                disabled={pendingJoin[Number(suggestion.id)]}
                              >
                                {pendingJoin[Number(suggestion.id)] ? 'Requesting...' : (joinedGroups[Number(suggestion.id)] ? 'Requested' : 'Request to join')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {showSuggestions && searchQuery.length >= 2 && suggestions.length === 0 && !isSearching && (
              <div className="absolute left-0 right-0 top-full mt-2 w-full bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-50">
                <div className="p-4 text-center text-white/60 text-sm">
                  No results found for "{searchQuery}"
                </div>
              </div>
            )}
            
            {/* Recent Searches Dropdown */}
            {showRecentSearches && recentSearches.length > 0 && !showSuggestions && (
              <div className="absolute left-0 right-0 top-full mt-2 w-full bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-50 max-h-80 overflow-y-auto">
                <div className="p-2">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <span className="text-xs font-semibold text-white/80">Recent Searches</span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-white/60 hover:text-white/80 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.map((query, index) => (
                    <button
                      key={`recent-${query}-${index}`}
                      onClick={() => handleRecentSearchClick(query)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200 text-left ${
                        selectedSuggestionIndex === index
                          ? 'bg-white/20 text-white'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Search className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm truncate">{query}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches Dropdown */}
            {showRecentSearches && recentSearches.length === 0 && popularSearches.length > 0 && !showSuggestions && (
              <div className="absolute left-0 right-0 top-full mt-2 w-full bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-50 max-h-80 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs font-semibold text-white/80 mb-2 px-2">Popular Searches</div>
                  {popularSearches.slice(0, 5).map((query, index) => (
                    <button
                      key={`popular-${query}-${index}`}
                      onClick={() => handleRecentSearchClick(query)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200 text-left ${
                        selectedSuggestionIndex === index
                          ? 'bg-white/20 text-white'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-sm truncate">{query}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filter Dropdown (Full width, glass/blur) */}
            {showFilterDropdown && (
              <div className="absolute left-0 right-0 top-full mt-2 w-full bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-50">
                <div className="p-2">
                  <div className="text-xs font-semibold text-white/80 mb-2 px-2">Search Filters</div>
                  {searchFilters.map((filter) => {
                    const IconComponent = filter.icon
                    const isSelected = selectedFilter === filter.id
                    return (
                      <button
                        key={filter.id}
                        onClick={() => handleFilterSelect(filter.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span className="text-sm">{filter.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Discover Button - Between search and notifications */}
          <button
            onClick={onDiscoverClick}
            className={`relative flex items-center rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
              activeTab === 'discover'
                ? 'bg-gradient-to-r from-white to-blue-50 text-emerald-600 shadow-2xl border-2 border-white/40'
                : 'text-white/90 hover:text-white hover:bg-white/20 backdrop-blur-md border-2 border-white/30 hover:border-white/50'
            } ${activeTab === 'discover' ? 'px-3 py-2 space-x-2' : 'w-10 h-10 justify-center'}`}
            type='button'
            title="Discover"
          >
            <Compass className={`${activeTab === 'discover' ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <span className={`${activeTab === 'discover' ? 'inline' : 'hidden'} font-semibold text-sm`}>Discover</span>
          </button>

          {/* Notifications Button - Right next to search */}
          <button
            onClick={onNotificationsClick}
            className={`relative flex items-center rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
              activeTab === 'notifications'
                ? 'bg-gradient-to-r from-white to-blue-50 text-emerald-600 shadow-2xl border-2 border-white/40'
                : 'text-white/90 hover:text-white hover:bg-white/20 backdrop-blur-md border-2 border-white/30 hover:border-white/50'
            } ${activeTab === 'notifications' ? 'px-3 py-2 space-x-2' : 'w-10 h-10 justify-center'}`}
            aria-label="Notifications"
          >
            <Bell className={`${activeTab === 'notifications' ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <span className={`${activeTab === 'notifications' ? 'inline' : 'hidden'} font-semibold text-sm`}>Notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-xl border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

        </div>

        {/* Right Side Actions */}
  <div className="flex items-center space-x-4 justify-end flex-1">
          <div className="flex items-center space-x-3 lg:space-x-4">
            
            
          </div>
        </div>
      </div>
    </header>
  )
}
