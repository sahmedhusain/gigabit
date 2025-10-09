'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { API_BASE_URL, api, EventResponse, CreateEventRequest } from '@/lib/api'
import ChatWindow from '@/components/ChatWindow'
import CreateEvent from '@/components/dashboard/CreateEvent'
import CreateGroupPost from '@/components/dashboard/CreateGroupPost'
import GroupFeed from '@/components/dashboard/GroupFeed'
import { 
  MessageCircle, 
  Users, 
  Hash, 
  Calendar, 
  Clock, 
  MapPin,
  CheckCircle,
  XCircle,
  Plus,
  Send
} from 'lucide-react'
import { useRealTimeMessages, useOnlineStatus, useConnectionStatus } from '@/hooks'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { getAvatarUrl } from '@/utils/avatarUtils'
import Image from 'next/image'

interface GroupWindowProps {
  groupId: number
  groupTitle: string
  isGroupMember: boolean
  userRole?: 'admin' | 'member'
}

type TabType = 'chat' | 'posts' | 'events'

const GroupWindow: React.FC<GroupWindowProps> = ({ 
  groupId, 
  groupTitle, 
  isGroupMember,
  userRole = 'member'
}) => {
  const { user } = useAuth()
  const { success, error } = useToast()
  const { isConnected: connectionStatus } = useConnectionStatus()
  const { onlineUsers: liveOnlineUsers } = useOnlineStatus()
  const { getUnreadCount } = useRealTimeMessages()
  
  const [activeTab, setActiveTab] = useState<TabType>('chat')
  const [memberCount, setMemberCount] = useState(0)
  const [recentMessages, setRecentMessages] = useState<unknown[]>([])
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [isResolvingConversation, setIsResolvingConversation] = useState(false)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [events, setEvents] = useState<EventResponse[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)

  // Calculate online member count from real-time data
  const onlineMemberCount = liveOnlineUsers.filter(user => user.status === 'online').length
  const unreadCount = getUnreadCount(groupId)

  useEffect(() => {
    // Fetch member count
    const fetchMemberCount = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members`, {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setMemberCount(data.members?.length || 0)
        }
      } catch (error) {
        console.error('Error fetching member count:', error)
      }
    }

    fetchMemberCount()
  }, [groupId])

  // No need to fetch recent messages for chat tab anymore

  // Fetch group events
  const fetchEvents = useCallback(async () => {
    if (!isGroupMember) return
    
    try {
      setIsLoadingEvents(true)
      const response = await api.getGroupEvents(groupId)
      setEvents(response.events || [])
    } catch (err) {
      console.error('Error fetching events:', err)
    } finally {
      setIsLoadingEvents(false)
    }
  }, [groupId, isGroupMember])

  useEffect(() => {
    if (activeTab === 'events') {
      fetchEvents()
    }
  }, [activeTab, fetchEvents])

  // Resolve the conversation ID associated with this group (if it exists)
  const resolveConversationId = useCallback(async () => {
    try {
      setIsResolvingConversation(true)
      const convs = await api.getConversations()
      const match = (convs.conversations || []).find(c => c.type === 'group' && c.group && c.group.id === groupId)
      if (match) {
        setConversationId(match.id)
      } else {
        setConversationId(null)
      }
    } catch (err) {
      console.error('Failed to resolve group conversation ID:', err)
    } finally {
      setIsResolvingConversation(false)
    }
  }, [groupId])

  useEffect(() => {
    if (activeTab === 'chat') {
      resolveConversationId()
    }
  }, [activeTab, resolveConversationId])



  const handleRSVP = async (eventId: number, option: 'going' | 'not_going') => {
    if (!isGroupMember || !connectionStatus) return

    try {
      await api.respondToEvent(eventId, option)
      success(`RSVP updated: ${option === 'going' ? 'Going' : 'Not Going'}`)
      fetchEvents() // Refresh events to update counts
    } catch (err) {
      console.error('Error updating RSVP:', err)
      error('Failed to update RSVP')
    }
  }

  const TabButton = ({ id, label, icon: Icon, isActive, onClick, badge }: {
    id: string
    label: string
    icon: React.ElementType
    isActive: boolean
    onClick: () => void
    badge?: number
  }) => (
    <button
      onClick={onClick}
      className={`relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
          : 'text-white/70 hover:text-white hover:bg-white/10'
      }`}
    >
      <Icon className="w-4 h-4 mr-2" />
      {label}
      {badge !== undefined && badge > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1">
          {badge > 99 ? '99+' : badge}
        </div>
      )}
    </button>
  )

  const renderChatTab = () => (
    <div className="h-full">
      {isResolvingConversation && !conversationId ? (
        <div className="flex items-center justify-center h-full text-white/60 text-sm">
          Resolving conversation...
        </div>
      ) : (
        <ChatWindow
          conversationId={conversationId || groupId}
          conversationType="group"
          participantName={groupTitle}
          groupId={groupId}
          hideHeader={true}
          onConversationResolved={(realId) => {
            if (realId !== conversationId) {
              setConversationId(realId)
            }
          }}
        />
      )}
    </div>
  )

  const renderPostsTab = () => (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4">Group Posts</h3>
        {isGroupMember && (
          <CreateGroupPost
            groupId={groupId.toString()}
            onCreated={() => {
              success('Post created successfully!')
            }}
          />
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {isGroupMember ? (
          <GroupFeed groupId={groupId.toString()} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Join to view posts</h4>
              <p className="text-white/70 text-sm">
                Become a member to see and create group posts
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderEventsTab = () => (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Group Events</h3>
          {isGroupMember && (
            <button
              onClick={() => setShowCreateEvent(true)}
              disabled={!connectionStatus}
              className={`flex items-center px-4 py-2 rounded-xl text-white transition-all duration-200 ${
                connectionStatus 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {!isGroupMember ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Calendar className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Join to view events</h4>
              <p className="text-white/70 text-sm">
                Become a member to see and create group events
              </p>
            </div>
          </div>
        ) : isLoadingEvents ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white/60">Loading events...</div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Calendar className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">No events yet</h4>
              <p className="text-white/70 text-sm">
                Create the first event for this group!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2">{event.title}</h4>
                    {event.description && (
                      <p className="text-white/70 mb-3">{event.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(event.event_time).toLocaleDateString()} at {new Date(event.event_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {event.location && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white/60 mb-2">Responses</div>
                    <div className="space-y-1">
                      <div className="flex items-center text-emerald-400">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Going: {event.going_count}
                      </div>
                      <div className="flex items-center text-red-400">
                        <XCircle className="w-4 h-4 mr-1" />
                        Not Going: {event.not_going_count}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RSVP Section */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="text-sm text-white/70">
                    Your response: <span className={`font-medium ${
                      event.user_response === 'going' ? 'text-emerald-400' :
                      event.user_response === 'not_going' ? 'text-red-400' :
                      'text-white/50'
                    }`}>
                      {event.user_response === 'going' ? 'Going' :
                       event.user_response === 'not_going' ? 'Not Going' :
                       'No response'}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRSVP(event.id, 'going')}
                      disabled={!connectionStatus || event.user_response === 'going'}
                      className={`flex items-center px-3 py-1 rounded-lg text-sm transition-all duration-200 ${
                        event.user_response === 'going'
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50'
                          : connectionStatus
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-400/30'
                            : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Going
                    </button>
                    <button
                      onClick={() => handleRSVP(event.id, 'not_going')}
                      disabled={!connectionStatus || event.user_response === 'not_going'}
                      className={`flex items-center px-3 py-1 rounded-lg text-sm transition-all duration-200 ${
                        event.user_response === 'not_going'
                          ? 'bg-red-500/30 text-red-300 border border-red-400/50'
                          : connectionStatus
                            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-400/30'
                            : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Not Going
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
            <Hash className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold flex items-center space-x-2">
              <span>{groupTitle}</span>
            </h3>
            <div className="flex items-center space-x-2 text-sm text-white/60">
              <Users className="w-4 h-4" />
              <span>{memberCount} members</span>
              {onlineMemberCount > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{onlineMemberCount} online</span>
                  </div>
                </>
              )}
              {/* Removed Live/Offline indicator */}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="p-4 border-b border-white/20">
        <div className="flex space-x-2">
          <TabButton
            id="chat"
            label="Chat"
            icon={MessageCircle}
            isActive={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
            badge={unreadCount}
          />
          <TabButton
            id="posts"
            label="Posts"
            icon={Send}
            isActive={activeTab === 'posts'}
            onClick={() => setActiveTab('posts')}
          />
          <TabButton
            id="events"
            label="Events"
            icon={Calendar}
            isActive={activeTab === 'events'}
            onClick={() => setActiveTab('events')}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 relative overflow-hidden">
        {activeTab === 'chat' && renderChatTab()}
        {activeTab === 'posts' && renderPostsTab()}
        {activeTab === 'events' && renderEventsTab()}
      </div>

      {/* Create Event Modal */}
      {showCreateEvent && (
        <CreateEvent
          show={showCreateEvent}
          onClose={() => setShowCreateEvent(false)}
          onEventCreated={() => {
            fetchEvents()
            setShowCreateEvent(false)
          }}
          groupId={groupId}
        />
      )}
    </div>
  )
}

export default GroupWindow