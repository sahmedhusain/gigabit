'use client'
import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Users, Calendar, MessageCircle, FileText, User, Filter } from 'lucide-react'
import { useSearchResults, SearchResult } from '@/hooks/useSearch'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import UserSearchResult from '@/components/search/UserSearchResult'
import GroupSearchResult from '@/components/search/GroupSearchResult'
import EventSearchResult from '@/components/search/EventSearchResult'
import PostSearchResult from '@/components/search/PostSearchResult'
import MessageSearchResult from '@/components/search/MessageSearchResult'

interface SearchResultsProps {
  filter: string
  query: string
}

const filterOptions = [
  { key: 'all', label: 'All', icon: Filter },
  { key: 'users', label: 'Users', icon: User },
  { key: 'groups', label: 'Groups', icon: Users },
  { key: 'events', label: 'Events', icon: Calendar },
  { key: 'posts', label: 'Posts', icon: FileText },
  { key: 'messages', label: 'Messages', icon: MessageCircle }
]

export default function SearchResults({ filter, query }: SearchResultsProps) {
    // Get current user
    const { user } = useAuth();

  const [activeFilter, setActiveFilter] = useState(filter)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreResults, setHasMoreResults] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [userGroups, setUserGroups] = useState<number[]>([])
  
  const searchRef = useRef<HTMLDivElement>(null)
  const resultsContainerRef = useRef<HTMLDivElement>(null)
  
  const { 
    results, 
    loading, 
    error, 
    searchAll,
    totalCount 
  } = useSearchResults()

  // Fetch user groups for filtering events
  useEffect(() => {
    if (user) {
      api.getUserGroups(user.id).then(data => {
        interface GroupData {
          id: number;
        }
        setUserGroups(data.groups.map((g: GroupData) => g.id))
      }).catch(err => {
        console.error('Failed to fetch user groups:', err)
      })
    }
  }, [user])

  // Filter out events for groups where user is not a member
  const filteredResults = results.filter((result: SearchResult) => {
    if (result.type === 'event') {
      // Check if event has a group and user is member
      const metadata = result.metadata as { group_id?: number | string; group?: { id?: number }; event?: { group_id?: number } }
      const groupId = metadata?.group_id || metadata?.group?.id || metadata?.event?.group_id
      const numGroupId = groupId ? Number(groupId) : null
      if (numGroupId && !userGroups.includes(numGroupId)) {
        return false
      }
    }
    return true
  })

  useEffect(() => {
    setActiveFilter(filter)
    setCurrentPage(1)
    setHasMoreResults(false)
  }, [filter])

  useEffect(() => {
    if (query && query.length >= 2) {
      searchAll(query, activeFilter, 1, 20, false)
      setCurrentPage(1)
      setHasMoreResults(false)
    }
  }, [query, activeFilter, searchAll])

  // Check if there are more results available
  useEffect(() => {
    if (results.length > 0 && totalCount > results.length) {
      setHasMoreResults(true)
    } else {
      setHasMoreResults(false)
    }
  }, [results.length, totalCount])

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMoreResults) return

    setIsLoadingMore(true)
    const nextPage = currentPage + 1
    
    // Save current scroll position
    const scrollContainer = resultsContainerRef.current
    const scrollTop = scrollContainer?.scrollTop || 0
    
    try {
      await searchAll(query, activeFilter, nextPage, 20, true)
      setCurrentPage(nextPage)
      
      // Restore scroll position after DOM updates
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollTop
        }
      })
    } catch (error) {
      console.error('Failed to load more results:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFilterChange = (newFilter: string) => {
    if (newFilter !== activeFilter) {
      setActiveFilter(newFilter)
      setCurrentPage(1)
      setHasMoreResults(false)
      setShowFilterDropdown(false)
      window.history.pushState({}, '', `/search/${newFilter}?q=${encodeURIComponent(query)}`)
    }
  }

  const renderSearchResult = (result: SearchResult) => {
      switch (result.type) {
        case 'user':
          return <UserSearchResult key={`user-${result.id}`} result={result} />
        case 'group':
          return <GroupSearchResult key={`group-${result.id}`} result={result} />
        case 'event':
          return <EventSearchResult key={`event-${result.id}`} result={result} />
        case 'post':
          return <PostSearchResult key={`post-${result.id}`} result={result} />
        case 'message':
          return <MessageSearchResult key={`message-${result.id}`} result={result} />
        default:
          return null;
      }
  }

  const getActiveFilterOption = () => {
    return filterOptions.find(option => option.key === activeFilter) || filterOptions[0]
  }

  const activeOption = getActiveFilterOption()
  const ActiveIcon = activeOption.icon

  return (
    <div className="min-h-screen">
      <div className="flex flex-col">
        {/* Enhanced Header with Feed-Style Design */}
        <div className="sticky top-0 z-20 flex-shrink-0 mb-6 animate-header-in">
          <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg p-6 hover:shadow-emerald-500/10 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                {/* Enhanced Icon with Gradient and Accent */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl border border-emerald-500/30 flex items-center justify-center shadow-md group-hover:shadow-emerald-500/25 transition-all duration-300">
                    <ActiveIcon className="w-6 h-6 text-white drop-shadow-sm" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                </div>

                {/* Title and Description with Enhanced Styling */}
                <div className="flex-1">
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors duration-300">
                    {activeOption.label} Search
                  </h1>
                  <p className="text-white/80 text-sm lg:text-base leading-relaxed">
                    {query ? `Discover amazing content matching "${query}"` : 'Find users, posts, events, groups, and more in your network'}
                  </p>
                </div>
              </div>

              {/* Filter Dropdown with Enhanced Styling */}
              <div className="relative" ref={searchRef}>
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 border border-white/20 rounded-2xl text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl group hover:scale-105"
                >
                  <ActiveIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-sm font-semibold">{activeOption.label}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilterDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showFilterDropdown && (
                  <div className="absolute right-0 mt-3 w-64 bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-2xl z-30 overflow-hidden">
                    <div className="p-4">
                      <div className="text-xs font-semibold text-white uppercase tracking-wide mb-4 px-2 flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <span>Search Filters</span>
                      </div>
                      {filterOptions.map((option) => {
                        const OptionIcon = option.icon
                        const isActive = activeFilter === option.key
                        
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleFilterChange(option.key)
                            }}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer mb-1 ${
                              isActive
                                ? 'bg-emerald-500/30 text-emerald-200 border-r-4 border-emerald-400 shadow-lg'
                                : 'text-white/90 hover:bg-white/20 hover:text-white cursor-pointer hover:scale-[1.02]'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center transition-all duration-200 ${
                              isActive ? 'bg-emerald-500/40 shadow-md' : 'hover:bg-white/30'
                            }`}>
                              <OptionIcon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">{option.label}</span>
                            {isActive && (
                              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center ml-auto shadow-md">
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
            </div>

            {/* Enhanced Stats and Info Row */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between">
                {/* Results Count and Stats with Enhanced Styling */}
                {!loading && !error && (
                  <div className="flex items-center space-x-6">
                    {filteredResults.length > 0 && (
                      <div className="flex items-center space-x-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2">
                        <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-emerald-200 text-sm font-semibold">
                          {totalCount} result{totalCount !== 1 ? 's' : ''} found
                        </span>
                      </div>
                    )}
                    
                    {query && (
                      <div className="flex items-center space-x-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2">
                        <div className="h-2 w-2 bg-cyan-400 rounded-full"></div>
                        <span className="text-cyan-200 text-sm font-medium">
                          Search term: <span className="font-bold text-cyan-300">&ldquo;{query}&rdquo;</span>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Loading indicator with Enhanced Styling */}
                {loading && (
                  <div className="flex items-center space-x-3 bg-white/10 border border-white/20 rounded-xl px-4 py-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400"></div>
                    <span className="text-white/80 text-sm font-medium">Searching...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results Content with Feed-Style Layout */}
        <div ref={resultsContainerRef} className="h-[calc(100vh-300px)] overflow-y-auto scrollbar-hide pb-8">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mb-4"></div>
              <span className="text-white/70 text-lg">Searching...</span>
            </div>
          )}

          {error && (
            <div className="bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent backdrop-blur-xl rounded-3xl border border-red-500/20 p-8 text-center shadow-lg">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-red-400 text-2xl">⚠️</span>
              </div>
              <div className="text-red-400 text-lg font-medium mb-2">Search Error</div>
              <p className="text-red-300/80">{error}</p>
            </div>
          )}

          {!loading && !error && (!query || query.length < 2) && (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <ActiveIcon className="w-12 h-12 text-white/40" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Start Your Search</h3>
              <p className="text-white/60 max-w-md mx-auto">
                Use the search bar in the top navigation to find users, posts, events, groups, and more.
              </p>
            </div>
          )}

          {!loading && !error && query && query.length >= 2 && filteredResults.length === 0 && (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <ActiveIcon className="w-12 h-12 text-white/40" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Results Found</h3>
              <p className="text-white/60 max-w-md mx-auto mb-4">
                We couldn&apos;t find any {activeOption.label.toLowerCase()} matching &ldquo;{query}&rdquo;.
              </p>
              <div className="text-white/50 text-sm space-y-1">
                <p>• Try different keywords</p>
                <p>• Check your spelling</p>
                <p>• Use fewer or different filters</p>
              </div>
            </div>
          )}

          {!loading && !error && filteredResults.length > 0 && (
            <div className="space-y-6 px-4">
              {/* Results Grid with Enhanced Spacing */}
              <div className="grid gap-6">
                {filteredResults.map((result, index) => (
                  <div
                    key={`${result.type}-${result.id}-${index}`}
                    className={`animate-fade-in animate-slide-in-from-bottom ${
                      index < 6 ? `animation-delay-${index * 100}` : 'animation-delay-500'
                    }`}
                  >
                    {renderSearchResult(result)}
                  </div>
                ))}
              </div>

              {/* Load More Button with Enhanced Centered Styling */}
              {hasMoreResults && (
                <div className="flex justify-center items-center py-8 px-4">
                  <button 
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-8 py-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/30 hover:border-emerald-400/50 rounded-2xl text-emerald-300 hover:text-emerald-200 font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2 min-w-[200px]"
                  >
                    {isLoadingMore ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400"></div>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <span>Load More Results</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}