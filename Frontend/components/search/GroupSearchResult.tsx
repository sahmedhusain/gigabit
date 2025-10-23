'use client'
import { Users, Lock, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SearchResult } from '@/hooks/useSearch'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import Image from 'next/image'
import { getGroupInitials } from '@/utils/avatarUtils'

interface GroupSearchResultProps {
  result: SearchResult
}

export default function GroupSearchResult({ result }: GroupSearchResultProps) {
  const router = useRouter()
  
  // Initialize state from localStorage synchronously
  const getInitialStates = () => {
    try {
      const persistedStates = localStorage.getItem('groupJoinStates')
      if (persistedStates) {
        const states = JSON.parse(persistedStates)
        return {
          localMemberStatus: states.memberStatus || {},
          joinedGroups: states.joinedGroups || {}
        }
      }
    } catch (e) {
      console.error('Failed to parse persisted group states:', e)
    }
    return {
      localMemberStatus: {},
      joinedGroups: {}
    }
  }
  
  const initialStates = getInitialStates()
  const [pendingJoin, setPendingJoin] = useState<Record<number, boolean>>({})
  const [joinedGroups, setJoinedGroups] = useState<Record<number, boolean>>(initialStates.joinedGroups)
  const [localMemberStatus, setLocalMemberStatus] = useState<Record<number, string | null>>(initialStates.localMemberStatus)

  // Persist join states to localStorage whenever they change
  useEffect(() => {
    const states = {
      memberStatus: localMemberStatus,
      joinedGroups,
      timestamp: Date.now()
    }
    localStorage.setItem('groupJoinStates', JSON.stringify(states))
  }, [localMemberStatus, joinedGroups])

  // Use local state if available, otherwise fall back to result metadata
  const getMemberStatus = (groupId: number) => {
    return localMemberStatus[groupId] ?? result.metadata?.memberStatus
  }

  const isMember = result.metadata?.isMember
  const isPrivate = result.metadata?.privacy === 'private'
  const joinable = result.metadata?.joinable
  const memberStatus = getMemberStatus(Number(result.id))

  const handleClick = () => {
    if (isMember) {
      // If user is a member, go to chat or group page
      router.push(result.url)
    }
    // If not a member, do not redirect - user must join first
  }

  const getStatusBadge = () => {
    if (isMember) {
      return (
        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full border border-emerald-500/30">
          Member
        </span>
      )
    } else if (memberStatus === 'requested' || memberStatus === 'sent') {
      return (
        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-500/30">
          Join Requested
        </span>
      )
    } else if (joinable) {
      return null // Will show button instead
    } else if (isPrivate) {
      return (
        <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full flex items-center space-x-1 border border-gray-500/30">
          <Lock className="w-3 h-3" />
          <span>Private</span>
        </span>
      )
    }
    return null
  }

  const getActionButton = () => {
    if (isMember) {
      return null // Members don't need action buttons in search results
    }

    if (memberStatus === 'requested' || memberStatus === 'sent') {
      return (
        <button
          onClick={async (e) => {
            e.stopPropagation()
            const groupId = Number(result.id)
            try {
              // Optimistic update: immediately clear the request status
              setLocalMemberStatus(prev => ({ ...prev, [groupId]: null }))
              setPendingJoin(prev => ({ ...prev, [groupId]: true }))

              await api.leaveGroup(groupId)
              // State is already updated optimistically
            } catch (err) {
              console.error('Cancel join request failed', err)
            } finally {
              setPendingJoin(prev => ({ ...prev, [groupId]: false }))
            }
          }}
          className="px-3 py-1.5 text-xs rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium whitespace-nowrap transition-all duration-200 border border-red-400/30 hover:border-red-300/50 shadow-sm"
          disabled={pendingJoin[Number(result.id)]}
        >
          {pendingJoin[Number(result.id)] ? 'Canceling...' : 'Cancel Request'}
        </button>
      )
    }

    if (joinable) {
      return (
        <button
          onClick={async (e) => {
            e.stopPropagation()
            const groupId = Number(result.id)
            try {
              // Optimistic update: immediately set status to 'requested'
              setLocalMemberStatus(prev => ({ ...prev, [groupId]: 'requested' }))
              setPendingJoin(prev => ({ ...prev, [groupId]: true }))

              await api.joinGroup(groupId)
              setJoinedGroups(prev => ({ ...prev, [groupId]: true }))
              // State is already updated optimistically
            } catch (err: unknown) {
              // Handle "already requested" error gracefully
              if (err instanceof Error && err.message?.includes('Already requested or member of this group')) {
                // Update local state to reflect that request was already made
                setLocalMemberStatus(prev => ({ ...prev, [groupId]: 'requested' }))
              } else {
                console.error('Join group failed', err)
              }
            } finally {
              setPendingJoin(prev => ({ ...prev, [groupId]: false }))
            }
          }}
          className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium whitespace-nowrap transition-all duration-200 border border-emerald-400/30 hover:border-emerald-300/50 shadow-sm"
          disabled={pendingJoin[Number(result.id)]}
        >
          {pendingJoin[Number(result.id)] ? 'Requesting...' : 'Request to Join'}
        </button>
      )
    }

    return null
  }

  return (
    <div
      onClick={handleClick}
      className={`bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 hover:shadow-emerald-500/10 transition-all duration-500 group ${isMember ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Enhanced Icon with Gradient Border */}
            <div className={`relative group ${isMember ? 'cursor-pointer' : ''}`}>
            {result.image ? (
              <Image 
                src={result.image} 
                alt={result.title}
                width={56}
                height={56}
                unoptimized={true}
                className="w-14 h-14 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-full object-cover shadow-md group-hover:shadow-green-500/25 transition-all duration-300"
              />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-md group-hover:shadow-green-500/25 transition-all duration-300">
                <span className="text-white font-bold text-lg">
                  {getGroupInitials(result.title)}
                </span>
              </div>
            )}
            {isPrivate && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center border-2 border-white">
                <Lock className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1">
            {/* Enhanced Name with Hover Effects */}
            <div className={`group ${isMember ? 'cursor-pointer' : ''}`}>
              <span
                className={`text-white font-bold text-xl ${isMember ? 'hover:text-emerald-300 transition-colors duration-200' : ''}`}
              >
                {result.title}
              </span>
            </div>

            {/* Enhanced Subtitle */}
            {result.subtitle && (
              <p
                className={`text-white/70 text-sm ${isMember ? 'cursor-pointer hover:text-white/90 transition-colors duration-200' : ''} mt-1 line-clamp-2`}
              >
                {result.subtitle}
              </p>
            )}

            {/* Enhanced Metadata */}
            <div className="flex items-center space-x-4 mt-3">
              <div className="flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-purple-300 text-xs font-medium">Group</span>
              </div>
              <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1">
                <Users className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-300 text-xs font-medium">{result.metadata?.memberCount || 0} members</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Status and Action */}
        <div className="flex-shrink-0 flex items-center space-x-3">
          {getStatusBadge()}
          {getActionButton()}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-emerald-500/30">
            <ExternalLink className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  )
}