'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { api, Group, Event, User, API_BASE_URL, getToken, PostResponse } from '@/lib/api'
import GroupChat from '@/components/GroupChat'
import {
  Users,
  Calendar,
  MessageCircle,
  Settings,
  UserPlus,
  LogOut,
  Crown,
  MapPin,
  Clock,
  ArrowLeft,
  X,
  Heart
} from 'lucide-react'
import CreateEvent from '@/components/dashboard/CreateEvent'

interface GroupDetails {
  id: number
  title: string
  description: string
  creator_id: number
  member_count: number
  is_member: boolean
  created_at: string
  updated_at: string
  creator: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    avatar: string
  }
  members: Array<{
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    avatar: string
    joined_at: string
  }>
  events: Event[]
}

function GroupDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { success, error } = useToast()

  const [group, setGroup] = useState<GroupDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [isJoining, setIsJoining] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [posts, setPosts] = useState<PostResponse[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostImage, setNewPostImage] = useState<File | null>(null)
  const [showCreateEvent, setShowCreateEvent] = useState(false)

  useEffect(() => {
    if (id) {
      fetchGroupDetails()
    }
  }, [id])

  const fetchGroupDetails = async () => {
    try {
      setIsLoading(true)
      const groupId = parseInt(id as string)

      // Fetch group details directly by ID
      const groupInfo = await api.getGroup(groupId)

      // Fetch group members
      const membersData = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
        },
        credentials: 'include'
      })
      const members = membersData.ok ? await membersData.json() : { members: [] }

      // Fetch group events
      const eventsData = await api.getUserEvents()
      const groupEvents = eventsData.data.filter((event: Event) => event.group_id === groupId)

      // Fetch group posts
      const postsData = await api.getGroupPosts(groupId)
      const groupPosts = postsData.posts || []

      setPosts(groupPosts)

      setGroup({
        ...groupInfo,
        creator: {
          id: groupInfo.creator_id,
          username: '',
          email: '',
          first_name: 'Unknown',
          last_name: 'User',
          avatar: ''
        },
        members: members.members || [],
        events: groupEvents
      })
    } catch (err) {
      console.error('Error fetching group details:', err)
      error('Failed to load group details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!group) return

    try {
      setIsJoining(true)
      await fetch(`${API_BASE_URL}/api/groups/${group.id}/join`, {
        method: 'POST',
        credentials: 'include'
      })

      success('Successfully joined the group!')
      fetchGroupDetails()
    } catch (err) {
      console.error('Error joining group:', err)
      error('Failed to join group')
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeaveGroup = async () => {
    if (!group) return

    try {
      await fetch(`${API_BASE_URL}/api/groups/${group.id}/leave`, {
        method: 'DELETE',
        credentials: 'include'
      })

      success('Successfully left the group')
      router.push('/dashboard')
    } catch (err) {
      console.error('Error leaving group:', err)
      error('Failed to leave group')
    }
  }

  const handleInviteUser = async () => {
    if (!group || !inviteEmail.trim()) return

    try {
      setIsInviting(true)
      await fetch(`${API_BASE_URL}/api/groups/${group.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email: inviteEmail.trim() })
      })

      success(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      setShowInviteModal(false)
    } catch (err) {
      console.error('Error inviting user:', err)
      error('Failed to send invitation')
    } finally {
      setIsInviting(false)
    }
  }

  const handleLikePost = async (postId: number) => {
    try {
      const post = posts.find(p => p.id === postId)
      if (post && post.is_liked) {
        await api.unlikePost(postId)
      } else {
        await api.likePost(postId)
      }
      
      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, is_liked: !p.is_liked, like_count: p.is_liked ? p.like_count - 1 : p.like_count + 1 }
          : p
      ))
    } catch (err) {
      console.error('Error toggling like:', err)
      error('Failed to update like.')
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      error('Post content cannot be empty')
      return
    }

    try {
      setIsLoadingPosts(true)
      let imageUrl = ''
      
      if (newPostImage) {
        const formData = new FormData()
        formData.append('image', newPostImage)
        
        const uploadResponse = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        })
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          imageUrl = `/uploads/${uploadData.filename}`
        } else {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || 'Failed to upload image')
        }
      }
      
      await api.createGroupPost(group!.id, {
        content: newPostContent,
        image_url: imageUrl
      })
      
      setNewPostContent('')
      setNewPostImage(null)
      setShowCreatePost(false)
      success('Post created successfully!')
      fetchGroupDetails() // Refresh posts
    } catch (err) {
      console.error('Error creating post:', err)
      error('Failed to create post.')
    } finally {
      setIsLoadingPosts(false)
    }
  }

  const isGroupCreator = group && user && group.creator_id === user.id

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading group details...</div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800 flex items-center justify-center">
        <div className="text-white text-xl">Group not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">{group.title}</h1>
                <p className="text-white/70 mt-1">{group.description}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {isGroupCreator && (
                <button className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all duration-200">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage
                </button>
              )}

              {group.is_member ? (
                <button
                  onClick={handleLeaveGroup}
                  className="flex items-center px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-xl text-red-300 hover:text-red-200 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave Group
                </button>
              ) : (
                <button
                  onClick={handleJoinGroup}
                  disabled={isJoining}
                  className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white transition-all duration-200 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {isJoining ? 'Joining...' : 'Join Group'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-black/10 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Users },
              { id: 'posts', label: 'Posts', icon: MessageCircle },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'events', label: 'Events', icon: Calendar },
              { id: 'chat', label: 'Chat', icon: MessageCircle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-4 border-b-2 transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-white/70 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Group Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8 text-emerald-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{group.member_count}</div>
                    <div className="text-white/70">Members</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-8 h-8 text-blue-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{group.events.length}</div>
                    <div className="text-white/70">Events</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center space-x-3">
                  <Crown className="w-8 h-8 text-yellow-400" />
                  <div>
                    <div className="text-lg font-semibold text-white">{group.creator.first_name} {group.creator.last_name}</div>
                    <div className="text-white/70">Creator</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Members */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">Recent Members</h3>
              <div className="space-y-3">
                {group.members.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {member.first_name[0]}{member.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-medium">{member.first_name} {member.last_name}</div>
                        <div className="text-white/50 text-sm">@{member.username}</div>
                      </div>
                    </div>
                    <div className="text-white/50 text-sm">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Group Posts</h3>
              {group.is_member && (
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white transition-all duration-200"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Create Post
                </button>
              )}
            </div>

            {posts.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
                <MessageCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-white mb-2">No posts yet</h4>
                <p className="text-white/70">Be the first to share something with the group!</p>
                {group.is_member && (
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="mt-4 px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-300 hover:bg-emerald-500/30 transition-all duration-200"
                  >
                    Create First Post
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <div className="flex items-start space-x-4">
                      <img
                        src={post.user.avatar || '/default-avatar.png'}
                        alt={post.user.first_name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-white font-medium">
                            {post.user.first_name} {post.user.last_name}
                          </span>
                          <span className="text-white/50 text-sm">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-white/80 mb-4">{post.content}</p>
                        {post.image_url && (
                          <img
                            src={post.image_url}
                            alt="Post image"
                            className="rounded-xl max-w-full h-auto mb-4"
                          />
                        )}
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleLikePost(post.id)}
                            className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-all duration-200 ${
                              post.is_liked
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''}`} />
                            <span>{post.like_count}</span>
                          </button>
                          <button className="flex items-center space-x-2 px-3 py-1 bg-white/10 text-white/70 hover:bg-white/20 rounded-lg transition-all duration-200">
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.comment_count}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Group Members ({group.members.length})</h3>
              {isGroupCreator && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white transition-all duration-200"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Members
                </button>
              )}
            </div>

            <div className="space-y-4">
              {group.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {member.first_name[0]}{member.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <div className="text-white font-medium flex items-center">
                        {member.first_name} {member.last_name}
                        {member.id === group.creator_id && (
                          <Crown className="w-4 h-4 ml-2 text-yellow-400" />
                        )}
                      </div>
                      <div className="text-white/50 text-sm">@{member.username}</div>
                    </div>
                  </div>
                  <div className="text-white/50 text-sm">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Group Events</h3>
              {isGroupCreator && (
                <button
                  onClick={() => setShowCreateEvent(true)}
                  className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-white transition-all duration-200"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Create Event
                </button>
              )}
            </div>

            {group.events.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
                <Calendar className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-white mb-2">No events yet</h4>
                <p className="text-white/70">Create the first event for this group!</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {group.events.map((event) => (
                  <div key={event.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-white mb-2">{event.title}</h4>
                        <p className="text-white/70 mb-4">{event.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-white/60">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(event.event_time).toLocaleDateString()} at {new Date(event.event_time).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-white/60 mb-2">Responses</div>
                        <div className="space-y-1">
                          <div className="text-emerald-400">Going: {event.going_count}</div>
                          <div className="text-red-400">Not Going: {event.not_going_count}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 h-[600px]">
            <GroupChat groupId={parseInt(id as string)} groupTitle={group.title} />
          </div>
        )}
      </div>

      {/* Invite Members Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl"></div>

            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Invite Members</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-white font-medium text-sm">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address..."
                    className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 border border-white/30 rounded-xl text-white hover:bg-white/10 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInviteUser}
                    disabled={isInviting || !inviteEmail.trim()}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isInviting ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl"></div>

            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Create Group Post</h3>
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-white font-medium text-sm">Post Content *</label>
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Share something with the group..."
                    className="w-full h-32 bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 resize-none"
                    maxLength={5000}
                  />
                  <div className="text-xs text-white/50 text-right">
                    {newPostContent.length}/5000
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-white font-medium text-sm">Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewPostImage(e.target.files?.[0] || null)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-500 file:text-white hover:file:bg-emerald-600"
                    title="Choose an image file"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowCreatePost(false)}
                    className="px-4 py-2 border border-white/30 rounded-xl text-white hover:bg-white/10 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePost}
                    disabled={isLoadingPosts || !newPostContent.trim()}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingPosts ? 'Creating...' : 'Create Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEvent && (
        <CreateEvent
          show={showCreateEvent}
          onClose={() => setShowCreateEvent(false)}
          onEventCreated={() => {
            fetchGroupDetails()
            setShowCreateEvent(false)
            success('Event created successfully!')
          }}
          groupId={parseInt(id as string)}
        />
      )}
    </div>
  )
}

// Wrap the entire component with ProtectedRoute
function ProtectedGroupDetails() {
  return (
    <ProtectedRoute>
      <GroupDetailsPage />
    </ProtectedRoute>
  )
}

export default ProtectedGroupDetails
