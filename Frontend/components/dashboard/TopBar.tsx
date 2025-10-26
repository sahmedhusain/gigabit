'use client'

import { Menu, X, Bell, Search, Users, Calendar, Hash, Filter, FileText, User, ChevronDown, Compass, MessageCircle } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { api, getToken } from '@/lib/api'
import Image from 'next/image'

interface TopBarProps {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
  activeTab: string
  onNotificationsClick: () => void
  unreadCount: number
  onDiscoverClick: () => void
  isMobileRightSidebarOpen: boolean
  setIsMobileRightSidebarOpen: (open: boolean) => void
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
  isMobileRightSidebarOpen,
  setIsMobileRightSidebarOpen,
}: TopBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Helper function to get initials from a name string
  const getInitialsFromName = (name: string | undefined): string => {
    if (!name) return '?'
    const trimmed = name.trim()
    if (trimmed.length === 0) return '?'
    if (trimmed.length === 1) return trimmed.toUpperCase()
    return trimmed.charAt(0).toUpperCase() + trimmed.charAt(1).toUpperCase()
  }
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [showRecentSearches, setShowRecentSearches] = useState(false)
  const [pendingJoin, setPendingJoin] = useState<Record<number, boolean>>({})
  const [joinedGroups, setJoinedGroups] = useState<Record<number, boolean>>({})
  const [hasUserFocused, setHasUserFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const searchFilters = [
    { id: 'all', label: 'All', icon: Filter },
    { id: 'users', label: 'Users', icon: User },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'message', label: 'Messages', icon: MessageCircle }
  ]

  // Sync search state with URL when on search page
  useEffect(() => {
    if (pathname && pathname.startsWith('/search/')) {
      const pathParts = pathname.split('/')
      const urlFilter = pathParts[2] // e.g., 'groups' from '/search/groups'
      const urlQuery = searchParams?.get('q') || ''
      
      // Map URL filter to our filter IDs
      const filterMapping: Record<string, string> = {
        'all': 'all',
        'users': 'users',
        'groups': 'groups',
        'events': 'events',
        'posts': 'posts',
        'messages': 'message',
        'tags': 'tags'
      }
      
      const mappedFilter = filterMapping[urlFilter] || 'all'
      
      if (mappedFilter !== selectedFilter) {
        setSelectedFilter(mappedFilter)
      }
      
      // Only sync the query if the user hasn't actively focused on the input
      // or if the URL query is different from what's currently displayed
      if (!hasUserFocused && urlQuery !== searchQuery) {
        setSearchQuery(urlQuery)
      }
    } else {
      // Reset when not on search page
      // Don't reset hasUserFocused here as it prevents suggestions from showing on other pages
      // setHasUserFocused(false)
    }
  }, [pathname, searchParams, hasUserFocused, searchQuery, selectedFilter])

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

  const addToSearchHistory = useCallback((query: string, resultCount: number) => {
    const newItem: SearchHistoryItem = {
      query,
      timestamp: Date.now(),
      resultCount
    }
    const updated = [newItem, ...searchHistory.filter(h => h.query !== query)].slice(0, 20)
    setSearchHistory(updated)
    localStorage.setItem('searchHistory', JSON.stringify(updated))
  }, [searchHistory])

  const fetchSuggestions = useCallback(async (query: string) => {
    try {
      const token = getToken()
      if (!token) {
        setIsSearching(false)
        return
      }
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      const response = await fetch(`${API_BASE_URL}/api/search/suggestions?q=${encodeURIComponent(query)}`, {
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
        setShowSuggestions(hasUserFocused)
        addToSearchHistory(query, results.length)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }, [selectedFilter, hasUserFocused, addToSearchHistory])

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
  }, [searchQuery, fetchSuggestions])

  const addToRecentSearches = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    addToRecentSearches(searchQuery)
    setSearchQuery('')
    setSuggestions([])
    setShowSuggestions(false)
    setSelectedSuggestionIndex(-1)

    // Unified navigation for chats and messages - same as ChatsSection
    if (suggestion.type === 'chat') {
      // Directly open conversation by id
      const conversationId = Number(suggestion.id)
      const meta = suggestion.metadata as Record<string, unknown> | undefined
      const chatType = meta?.chatType as string || 'private'
      const param = chatType === 'group' ? 'group' : 'chat'
      router.push(`/chats/all?${param}=${conversationId}`)
      return
    }

    if (suggestion.type === 'message') {
      // Get conversation ID and message ID from metadata (same as ChatsSection)
      const meta = suggestion.metadata as Record<string, unknown> | undefined
      const conversationId = meta?.conversationId ? Number(meta.conversationId) : Number(suggestion.id)
      const messageId = Number(suggestion.id)
      const messageType = meta?.type as string || 'private'
      const param = messageType === 'group' ? 'group' : 'chat'
      
      router.push(`/chats/all?${param}=${conversationId}&message=${messageId}`)
      return
    }

    if (suggestion.type === 'group') {
      const gmeta = suggestion.metadata as Partial<{ joinable: boolean; isMember: boolean; conversationId?: number }> | undefined
      const joinable = !!gmeta?.joinable
      const isMember = !!gmeta?.isMember
      
      if (joinable && !isMember) {
        // Row has a Join button; prevent navigation on title click
        return
      }
      
      if (!isMember) {
        // Prevent navigation for non-member groups
        return
      }
      
      // For member groups, navigate to chat using group parameter
      if (isMember) {
        const groupId = Number(suggestion.id)
        router.push(`/chats/all?group=${groupId}`)
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
    
    // Check if we're already on a search page with the same query
    const isOnSearchPage = pathname && pathname.startsWith('/search/')
    const currentUrlQuery = searchParams?.get('q') || ''
    const currentUrlFilter = pathname?.split('/')[2] || 'all'
    
    if (isOnSearchPage && currentUrlQuery === query && currentUrlFilter === selectedFilter) {
      // Already on the correct search page, just close the UI
      return
    }
    
    // Navigate to search page with the selected filter
    router.push(`/search/${selectedFilter}?q=${encodeURIComponent(query)}`)
    
    // Only clear searchQuery if we're not on a search page
    if (!isOnSearchPage) {
      setSearchQuery('')
    }
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      // If there are suggestions and one is selected, use that
      if (showSuggestions && selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        handleSuggestionClick(suggestions[selectedSuggestionIndex])
        return
      }
      
      // If there are recent searches showing and one is selected, use that
      if (showRecentSearches && selectedSuggestionIndex >= 0 && recentSearches[selectedSuggestionIndex]) {
        handleRecentSearchClick(recentSearches[selectedSuggestionIndex])
        return
      }
      
      // Otherwise, redirect to search page with the current query
      if (searchQuery.trim().length >= 2) {
        const trimmedQuery = searchQuery.trim()
        addToRecentSearches(trimmedQuery)
        
        // Check if we're already on a search page with the same query
        const isOnSearchPage = pathname && pathname.startsWith('/search/')
        const currentUrlQuery = searchParams?.get('q') || ''
        const currentUrlFilter = pathname?.split('/')[2] || 'all'
        
        if (isOnSearchPage && currentUrlQuery === trimmedQuery && currentUrlFilter === selectedFilter) {
          // Already on the correct search page, just close the UI
          setSuggestions([])
          setShowSuggestions(false)
          setShowRecentSearches(false)
          setSelectedSuggestionIndex(-1)
          return
        }
        
        // Navigate to the search page
        router.push(`/search/${selectedFilter}?q=${encodeURIComponent(trimmedQuery)}`)
        
        // Only clear searchQuery if we're not on a search page (to allow URL sync to work)
        if (!isOnSearchPage) {
          setSearchQuery('')
        }
        
        setSuggestions([])
        setShowSuggestions(false)
        setShowRecentSearches(false)
        setSelectedSuggestionIndex(-1)
      }
      return
    }

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
      case 'event': return 'text-blue-400'
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

  // Generate dynamic placeholder text
  const getSearchPlaceholder = () => {
    const currentFilter = searchFilters.find(f => f.id === selectedFilter)
    const filterLabel = currentFilter?.label.toLowerCase() || 'everything'
    
    // If we're on a search page with a query, show that in the placeholder
    if (pathname && pathname.startsWith('/search/') && searchParams?.get('q')) {
      const query = searchParams?.get('q')
      return `"${query}" in ${filterLabel}`
    }
    
    // Otherwise show the standard search placeholder
    return `Search ${selectedFilter === 'all' ? 'everything' : filterLabel}...`
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
                  placeholder={getSearchPlaceholder()}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    setHasUserFocused(true)
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
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setSuggestions([])
                      setShowSuggestions(false)
                      setShowRecentSearches(false)
                      setSelectedSuggestionIndex(-1)
                    }}
                    className="absolute right-24 top-1/2 transform -translate-y-1/2 p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
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
              <div className="absolute left-1/2 top-full mt-3 w-[480px] max-w-[90vw] -translate-x-1/2 search-suggestions-container bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 overflow-hidden z-50 max-h-[36rem] overflow-y-auto scrollbar-hide hover:shadow-emerald-500/10 transition-all duration-300">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5 px-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-bold text-white uppercase tracking-wide">Search Results</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="text-emerald-200 text-xs font-semibold">{suggestions.length} found</span>
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="space-y-3">
                    {suggestions.map((suggestion, index) => {
                      const IconComponent = getIconForType(suggestion.type)
                      const isSelected = selectedSuggestionIndex === index
                      return (
                        <div
                          key={`${suggestion.type}-${suggestion.id}-${index}`}
                          className={`search-suggestion-item w-full flex items-start space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 group hover:scale-[1.01] ${
                            isSelected
                              ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white border border-emerald-400/30 shadow-lg backdrop-blur-sm'
                              : 'text-white/90 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'
                          }`}
                        >
                          {suggestion.image ? (
                            <div className="relative">
                              <Image 
                                src={suggestion.image} 
                                alt={suggestion.title}
                                width={40}
                                height={40}
                                className="search-suggestion-avatar w-10 h-10 rounded-xl object-cover flex-shrink-0 border-2 border-white/20 shadow-md group-hover:shadow-emerald-500/25 transition-all duration-300"
                              />
                              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-white/30 flex items-center justify-center shadow-lg ${getColorForType(suggestion.type)}`}>
                                <IconComponent className="w-3 h-3" />
                              </div>
                            </div>
                          ) : (
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-white/15 to-white/5 border-2 border-white/20 flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-all duration-300 ${getColorForType(suggestion.type)} group-hover:scale-110`}>
                              {suggestion.type === 'group' ? (
                                <span className="text-white font-bold text-sm">
                                  {suggestion.title.substring(0, 2).toUpperCase()}
                                </span>
                              ) : suggestion.type === 'user' ? (
                                <span className="text-white font-bold text-sm">
                                  {getInitialsFromName(suggestion.title)}
                                </span>
                              ) : (
                                <IconComponent className="w-4 h-4" />
                              )}
                            </div>
                          )}
                          <div className="search-suggestion-content flex-1 text-left min-w-0">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => handleSuggestionClick(suggestion)}
                                className={`text-left flex-1 min-w-0 ${suggestion.type === 'group' && !(suggestion.metadata as Partial<{ isMember: boolean }>)?.isMember ? '' : 'cursor-pointer hover:text-white transition-colors duration-300'}`}
                                disabled={suggestion.type === 'group' && !(suggestion.metadata as Partial<{ isMember: boolean }>)?.isMember}
                              >
                                <div className="flex items-center space-x-2 mb-1.5">
                                  <span className={`search-suggestion-title text-sm font-semibold truncate block ${suggestion.type === 'group' && !(suggestion.metadata as Partial<{ isMember: boolean }>)?.isMember ? '' : 'hover:text-emerald-300 transition-colors duration-300'}`}>
                                    {suggestion.title}
                                  </span>
                                  <span className={`search-suggestion-type text-xs px-3 py-1.5 rounded-xl font-semibold uppercase tracking-wide border shadow-sm ${
                                    suggestion.type === 'user' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                    suggestion.type === 'group' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                                    suggestion.type === 'event' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                    suggestion.type === 'post' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                                    suggestion.type === 'message' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                                    'bg-gray-500/20 text-gray-300 border-gray-500/30'
                                  }`}>
                                    {suggestion.type}
                                  </span>
                                </div>
                                {suggestion.subtitle && (
                                  <span className={`search-suggestion-subtitle text-xs block truncate leading-relaxed ${suggestion.type === 'group' && !(suggestion.metadata as Partial<{ isMember: boolean }>)?.isMember ? 'text-white/60' : 'text-white/70 hover:text-white/90 transition-colors duration-300'}`}>
                                    {suggestion.subtitle}
                                  </span>
                                )}
                              </button>
                              {suggestion.type === 'group' && !!(suggestion.metadata as Partial<{ joinable: boolean; isMember: boolean; memberStatus?: string }>)?.joinable && !(suggestion.metadata as Partial<{ joinable: boolean; isMember: boolean; memberStatus?: string }>)?.isMember && (
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
                                  className="ml-4 px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-400/30 hover:border-emerald-300/50 text-emerald-300 hover:text-emerald-200 font-semibold whitespace-nowrap transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-emerald-500/25"
                                  disabled={pendingJoin[Number(suggestion.id)]}
                                >
                                  {pendingJoin[Number(suggestion.id)] ? 'Requesting...' : (joinedGroups[Number(suggestion.id)] ? 'Requested' : 'Join')}
                                </button>
                              )}
                              {suggestion.type === 'group' && (suggestion.metadata as Partial<{ memberStatus?: string }>)?.memberStatus === 'requested' && (
                                <div className="ml-4 px-3 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 text-sm rounded-xl border border-yellow-500/30 font-medium shadow-sm">
                                  Join Requested
                                </div>
                              )}
                              {suggestion.type === 'group' && (suggestion.metadata as Partial<{ memberStatus?: string }>)?.memberStatus === 'sent' && (
                                <div className="ml-4 px-3 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 text-sm rounded-xl border border-yellow-500/30 font-medium shadow-sm">
                                  Join Requested
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* View All Results button */}
                  {suggestions.length > 0 && (
                    <>
                      <div className="search-divider my-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                      <button
                        onClick={() => {
                          addToRecentSearches(searchQuery)
                          
                          // Check if we're already on a search page with the same query
                          const isOnSearchPage = pathname && pathname.startsWith('/search/')
                          const currentUrlQuery = searchParams?.get('q') || ''
                          const currentUrlFilter = pathname?.split('/')[2] || 'all'
                          
                          if (!(isOnSearchPage && currentUrlQuery === searchQuery && currentUrlFilter === selectedFilter)) {
                            router.push(`/search/${selectedFilter}?q=${encodeURIComponent(searchQuery)}`)
                          }
                          
                          // Only clear searchQuery if we're not on a search page
                          if (!isOnSearchPage) {
                            setSearchQuery('')
                          }
                          
                          setSuggestions([])
                          setShowSuggestions(false)
                          setSelectedSuggestionIndex(-1)
                        }}
                        className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 text-emerald-300 hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-teal-500/10 hover:text-emerald-200 border border-emerald-500/20 hover:border-emerald-400/40 bg-emerald-500/5 hover:shadow-lg hover:shadow-emerald-500/25 group hover:scale-[1.01]"
                      >
                        <Search className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-sm font-semibold">View all results for &ldquo;{searchQuery}&rdquo;</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {showSuggestions && searchQuery.length >= 2 && suggestions.length === 0 && !isSearching && (
              <div className="absolute left-1/2 top-full mt-3 w-[480px] max-w-[90vw] -translate-x-1/2 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 overflow-hidden z-50 hover:shadow-emerald-500/10 transition-all duration-300">
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Search className="w-8 h-8 text-white/40" />
                  </div>
                  <h4 className="text-white/90 font-bold text-base mb-2">No results found</h4>
                  <p className="text-white/70 text-sm mb-4 max-w-sm mx-auto">We couldn&apos;t find anything matching &ldquo;{searchQuery}&rdquo; in the selected filter.</p>
                  <button
                    onClick={() => {
                      addToRecentSearches(searchQuery)
                      
                      // Check if we're already on a search page with the same query
                      const isOnSearchPage = pathname && pathname.startsWith('/search/')
                      const currentUrlQuery = searchParams?.get('q') || ''
                      const currentUrlFilter = pathname?.split('/')[2] || 'all'
                      
                      if (!(isOnSearchPage && currentUrlQuery === searchQuery && currentUrlFilter === selectedFilter)) {
                        router.push(`/search/${selectedFilter}?q=${encodeURIComponent(searchQuery)}`)
                      }
                      
                      // Only clear searchQuery if we're not on a search page
                      if (!isOnSearchPage) {
                        setSearchQuery('')
                      }
                      
                      setSuggestions([])
                      setShowSuggestions(false)
                      setSelectedSuggestionIndex(-1)
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/30 hover:border-emerald-400/50 rounded-lg text-emerald-300 hover:text-emerald-200 text-sm font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-emerald-500/25"
                  >
                    Search anyway
                  </button>
                </div>
              </div>
            )}
            
            {/* Recent Searches Dropdown */}
            {showRecentSearches && recentSearches.length > 0 && !showSuggestions && (
              <div className="absolute left-1/2 top-full mt-3 w-[480px] max-w-[90vw] -translate-x-1/2 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 overflow-hidden z-50 max-h-[36rem] overflow-y-auto scrollbar-hide hover:shadow-emerald-500/10 transition-all duration-300">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-5 px-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-bold text-white uppercase tracking-wide">Recent Searches</span>
                    </div>
                    <button
                      onClick={clearRecentSearches}
                      className="text-sm text-white/70 hover:text-white/90 transition-colors px-3 py-1.5 rounded-xl hover:bg-white/10 border border-white/10 hover:border-white/20 font-medium"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="space-y-3">
                    {recentSearches.map((query, index) => (
                      <button
                        key={`recent-${query}-${index}`}
                        onClick={() => handleRecentSearchClick(query)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 text-left border group hover:scale-[1.01] ${
                          selectedSuggestionIndex === index
                            ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-white border-cyan-400/30 shadow-lg backdrop-blur-sm'
                            : 'text-white/90 hover:bg-white/10 hover:text-white border-transparent hover:border-white/10'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border-2 border-cyan-500/20 flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                          <Search className="w-4 h-4 text-cyan-400" />
                        </div>
                        <span className="text-sm font-semibold truncate">{query}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Filter Dropdown (Full width, glass/blur) */}
            {showFilterDropdown && (
              <div className="absolute left-1/2 top-full mt-3 w-[480px] max-w-[90vw] -translate-x-1/2 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 overflow-hidden z-50 hover:shadow-emerald-500/10 transition-all duration-300">
                <div className="p-5">
                  <div className="flex items-center space-x-3 mb-5 px-2">
                    <div className="w-3 h-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold text-white uppercase tracking-wide">Search Filters</span>
                  </div>
                  {searchFilters.map((filter) => {
                    const IconComponent = filter.icon
                    const isSelected = selectedFilter === filter.id
                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleFilterSelect(filter.id)
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 cursor-pointer mb-2 hover:scale-[1.01] ${
                          isSelected
                            ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white border border-emerald-400/30 shadow-lg backdrop-blur-sm'
                            : 'text-white/90 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border-2 border-white/20 flex items-center justify-center transition-all duration-300 shadow-md ${
                          isSelected ? 'bg-emerald-500/40 shadow-lg' : 'hover:bg-white/30 group-hover:scale-110'
                        }`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold">{filter.label}</span>
                        {isSelected && (
                          <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center ml-auto shadow-lg border border-emerald-400/30">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        )}
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
            
            {/* User icon for mobile/tablet - controls right sidebar */}
            <button
              onClick={() => setIsMobileRightSidebarOpen(!isMobileRightSidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
              title="User Profile"
            >
              <User className="w-6 h-6" />
            </button>
            
          </div>
        </div>
      </div>
    </header>
  )
}
