'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { 
  Home,
  User,
  Users,
  MessageCircle,
  Bell,
  Settings,
  Search,
  Plus,
  Heart,
  MessageSquare,
  Share,
  MoreHorizontal,
  Camera,
  Image as ImageIcon,
  Globe,
  Lock,
  UserCheck,
  UserPlus,
  Calendar,
  MapPin,
  Sparkles,
  Send,
  Smile,
  X,
  Check,
  Clock,
  Eye,
  EyeOff,
  Filter,
  Bookmark,
  TrendingUp,
  Activity
} from 'lucide-react'

function DashboardPage() {
  const { user, logout, checkAuth } = useAuth()
  const [activeTab, setActiveTab] = useState('home')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [newPostContent, setNewPostContent] = useState('')
  const [postPrivacy, setPostPrivacy] = useState('public')
  const [selectedUsers, setSelectedUsers] = useState([])

  // Test function to manually check token
  const testTokenExpiration = async () => {
    console.log('Testing token expiration...')
    try {
      await checkAuth()
      console.log('Token still valid')
    } catch (error) {
      console.log('Token expired or invalid')
    }
  }
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Use actual user data or fallback
  const currentUser = user ? {
    id: user.id,
    name: `${user.first_name} ${user.last_name}`,
    username: user.email.split('@')[0], // Use email prefix as username
    avatar: user.avatar,
    isPrivate: user.is_private,
    followers: 0, // These would come from API calls
    following: 0
  } : {
    id: 1,
    name: 'John Doe',
    username: 'johndoe',
    avatar: null,
    isPrivate: false,
    followers: 1245,
    following: 892
  }

  const posts = [
    {
      id: 1,
      user: { name: 'Sarah Wilson', username: 'sarahw', avatar: null },
      content: 'Just finished my morning workout! Feeling energized and ready for the day 💪',
      image: null,
      likes: 24,
      comments: 5,
      shares: 2,
      timeAgo: '2h',
      privacy: 'public',
      isLiked: false
    },
    {
      id: 2,
      user: { name: 'Mike Johnson', username: 'mikej', avatar: null },
      content: 'Beautiful sunset at the beach today. Nature never fails to amaze me! 🌅',
      image: '/sunset.jpg',
      likes: 89,
      comments: 12,
      shares: 8,
      timeAgo: '4h',
      privacy: 'public',
      isLiked: true
    }
  ]

  const notifications = [
    {
      id: 1,
      type: 'follow_request',
      user: 'Alice Cooper',
      message: 'sent you a follow request',
      time: '5m ago',
      isRead: false
    },
    {
      id: 2,
      type: 'group_invitation',
      user: 'Tech Enthusiasts',
      message: 'You were invited to join the group',
      time: '1h ago',
      isRead: false
    },
    {
      id: 3,
      type: 'event',
      user: 'Weekend Meetup',
      message: 'New event created in Photography Club',
      time: '3h ago',
      isRead: true
    }
  ]

  const groups = [
    {
      id: 1,
      name: 'Tech Enthusiasts',
      description: 'Discussing latest in technology',
      members: 1250,
      isJoined: true,
      lastActivity: '2h ago'
    },
    {
      id: 2,
      name: 'Photography Club',
      description: 'Share your amazing shots',
      members: 890,
      isJoined: true,
      lastActivity: '5h ago'
    }
  ]

  const chats = [
    {
      id: 1,
      name: 'Sarah Wilson',
      lastMessage: 'Thanks for the workout tips!',
      time: '10m ago',
      unread: 2,
      isOnline: true
    },
    {
      id: 2,
      name: 'Photography Club',
      lastMessage: 'Mike: Great shots everyone!',
      time: '1h ago',
      unread: 0,
      isGroup: true
    }
  ]

  const events = [
    {
      id: 1,
      title: 'Weekend Photography Walk',
      description: 'Join us for a morning photography session in Central Park',
      date: '2025-08-19',
      time: '09:00',
      location: 'Central Park',
      group: 'Photography Club',
      going: 12,
      notGoing: 3,
      userResponse: 'going'
    }
  ]

  const renderSidebar = () => (
    <>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border-r border-white/20 z-50 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent">
              SocialConnect
            </h1>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <nav className="space-y-2">
            {[
              { id: 'home', icon: Home, label: 'Home Feed' },
              { id: 'profile', icon: User, label: 'My Profile' },
              { id: 'followers', icon: Users, label: 'Followers' },
              { id: 'groups', icon: Users, label: 'Groups' },
              { id: 'events', icon: Calendar, label: 'Events' },
              { id: 'settings', icon: Settings, label: 'Settings' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setIsMobileMenuOpen(false)
                }}
                className={`w-full flex items-center px-3 lg:px-4 py-2 lg:py-3 rounded-xl transition-all duration-200 text-sm lg:text-base ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <item.icon className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  )

  const renderTopBar = () => (
    <div className="fixed top-0 left-0 lg:left-64 right-0 h-14 lg:h-16 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border-b border-white/20 z-30">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
          >
            <Home className="w-5 h-5" />
          </button>
          
          {/* Search Bar */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 w-40 sm:w-60 lg:w-80 text-sm lg:text-base"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Mobile Search */}
          <button className="sm:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200">
            <Search className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowCreatePost(true)}
            className="hidden sm:flex items-center px-3 lg:px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base"
          >
            <Plus className="w-4 h-4 mr-1 lg:mr-2" />
            <span className="hidden md:inline">Create</span>
          </button>
          
          {/* Mobile Create Post */}
          <button
            onClick={() => setShowCreatePost(true)}
            className="sm:hidden p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
          >
            <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 lg:w-3 lg:h-3 bg-red-500 rounded-full"></span>
            )}
          </button>
          
          <button
            onClick={() => setShowChat(!showChat)}
            className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
          >
            <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
          
          <div className="flex items-center space-x-2 lg:space-x-3">
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
              <User className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
            </div>
            <span className="hidden md:inline text-white font-medium text-sm lg:text-base">{currentUser.name}</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCreatePost = () => {
    if (!showCreatePost) return null

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 shadow-2xl"></div>
          
          <div className="relative p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h3 className="text-lg lg:text-xl font-semibold text-white">Create New Post</h3>
              <button
                onClick={() => setShowCreatePost(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full h-24 lg:h-32 bg-white/10 border border-white/20 rounded-xl lg:rounded-2xl p-3 lg:p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 resize-none text-sm lg:text-base"
              />
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <button className="flex items-center px-3 lg:px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all duration-200 text-sm lg:text-base">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Add Image
                </button>
                
                <button className="flex items-center px-3 lg:px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all duration-200 text-sm lg:text-base">
                  <Camera className="w-4 h-4 mr-2" />
                  Add GIF
                </button>
              </div>
              
              <div className="space-y-3">
                <label className="text-white font-medium text-sm lg:text-base">Privacy Settings:</label>
                <div className="space-y-2">
                  {[
                    { value: 'public', icon: Globe, label: 'Public', desc: 'Anyone can see this post' },
                    { value: 'followers', icon: Users, label: 'Followers Only', desc: 'Only your followers can see this' },
                    { value: 'private', icon: Lock, label: 'Selected Followers', desc: 'Choose specific followers' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="privacy"
                        value={option.value}
                        checked={postPrivacy === option.value}
                        onChange={(e) => setPostPrivacy(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex-shrink-0 ${
                        postPrivacy === option.value ? 'border-emerald-400 bg-emerald-400' : 'border-white/40'
                      }`}></div>
                      <option.icon className="w-4 h-4 text-white/70 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm lg:text-base">{option.label}</div>
                        <div className="text-white/60 text-xs lg:text-sm">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              {postPrivacy === 'private' && (
                <div className="bg-white/5 rounded-xl lg:rounded-2xl p-3 lg:p-4">
                  <label className="text-white font-medium mb-2 block text-sm lg:text-base">Select Followers:</label>
                  <div className="space-y-2 max-h-24 lg:max-h-32 overflow-y-auto">
                    {['Sarah Wilson', 'Mike Johnson', 'Alice Cooper'].map((user) => (
                      <label key={user} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only"
                        />
                        <div className="w-4 h-4 rounded border border-white/40 flex-shrink-0"></div>
                        <span className="text-white text-sm lg:text-base">{user}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="w-full sm:w-auto px-4 lg:px-6 py-2 border border-white/30 rounded-xl text-white hover:bg-white/10 transition-all duration-200 text-sm lg:text-base"
                >
                  Cancel
                </button>
                <button className="w-full sm:w-auto px-4 lg:px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base">
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderNotifications = () => {
    if (!showNotifications) return null

    return (
      <div className="fixed top-14 lg:top-16 right-2 lg:right-6 w-72 sm:w-80 max-h-80 lg:max-h-96 overflow-y-auto bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-xl lg:rounded-2xl border border-white/20 shadow-2xl z-40">
        <div className="p-3 lg:p-4">
          <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Notifications</h3>
          <div className="space-y-2 lg:space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-2 lg:p-3 rounded-lg lg:rounded-xl ${
                  notification.isRead ? 'bg-white/5' : 'bg-emerald-500/10 border border-emerald-400/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs lg:text-sm">
                      <span className="font-medium">{notification.user}</span>
                      {' '}{notification.message}
                    </p>
                    <p className="text-white/60 text-xs mt-1">{notification.time}</p>
                  </div>
                  {notification.type === 'follow_request' && (
                    <div className="flex space-x-1 lg:space-x-2 ml-2 lg:ml-3 flex-shrink-0">
                      <button className="p-1 bg-emerald-500 rounded-md lg:rounded-lg hover:bg-emerald-600 transition-colors">
                        <Check className="w-3 h-3 text-white" />
                      </button>
                      <button className="p-1 bg-red-500 rounded-md lg:rounded-lg hover:bg-red-600 transition-colors">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderChat = () => {
    if (!showChat) return null

    return (
      <div className="fixed top-14 lg:top-16 right-2 lg:right-6 w-72 sm:w-80 h-80 lg:h-96 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-xl lg:rounded-2xl border border-white/20 shadow-2xl z-40 flex flex-col">
        <div className="p-3 lg:p-4 border-b border-white/20">
          <h3 className="text-base lg:text-lg font-semibold text-white">Messages</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 lg:p-4">
          <div className="space-y-2 lg:space-y-3">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="flex items-center space-x-2 lg:space-x-3 p-2 lg:p-3 rounded-lg lg:rounded-xl hover:bg-white/10 cursor-pointer transition-all duration-200"
                onClick={() => setSelectedChat(chat)}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                    {chat.isGroup ? (
                      <Users className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                    ) : (
                      <User className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                    )}
                  </div>
                  {!chat.isGroup && chat.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 lg:w-3 lg:h-3 bg-green-500 rounded-full border border-white"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium truncate text-sm lg:text-base">{chat.name}</h4>
                    <span className="text-white/60 text-xs flex-shrink-0">{chat.time}</span>
                  </div>
                  <p className="text-white/70 text-xs lg:text-sm truncate">{chat.lastMessage}</p>
                </div>
                
                {chat.unread > 0 && (
                  <div className="w-4 h-4 lg:w-5 lg:h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">{chat.unread}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-3 lg:p-4 border-t border-white/20">
          <button className="w-full flex items-center justify-center py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg lg:rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base">
            <MessageSquare className="w-4 h-4 mr-2" />
            New Message
          </button>
        </div>
      </div>
    )
  }

  const renderHomeFeed = () => (
    <div className="space-y-4 lg:space-y-6">
      {/* Stories Section */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
        <h3 className="text-white font-semibold mb-3 lg:mb-4 text-base lg:text-lg">Stories</h3>
        <div className="flex space-x-3 lg:space-x-4 overflow-x-auto pb-2">
          <div className="flex-shrink-0 text-center">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-2 cursor-pointer hover:scale-105 transition-transform">
              <Plus className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
            </div>
            <p className="text-white/70 text-xs">Add Story</p>
          </div>
          {['Sarah', 'Mike', 'Alice', 'David'].map((name) => (
            <div key={name} className="flex-shrink-0 text-center">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full p-0.5 cursor-pointer hover:scale-105 transition-transform">
                <div className="w-full h-full bg-white/10 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
              <p className="text-white/70 text-xs mt-2">{name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4 lg:space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-medium text-sm lg:text-base">{post.user.name}</h4>
                  <p className="text-white/60 text-xs lg:text-sm">@{post.user.username} • {post.timeAgo}</p>
                </div>
              </div>
              <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200">
                <MoreHorizontal className="w-4 h-4 lg:w-5 lg:h-5" />
              </button>
            </div>

            {/* Post Content */}
            <p className="text-white mb-3 lg:mb-4 text-sm lg:text-base leading-relaxed">{post.content}</p>

            {/* Post Image */}
            {post.image && (
              <div className="mb-3 lg:mb-4 rounded-xl lg:rounded-2xl overflow-hidden bg-white/5">
                <div className="aspect-video bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 lg:w-12 lg:h-12 text-white/50" />
                </div>
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center justify-between pt-3 lg:pt-4 border-t border-white/10">
              <button className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm ${
                post.isLiked 
                  ? 'text-red-400 bg-red-500/10' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}>
                <Heart className={`w-3 h-3 lg:w-4 lg:h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                <span>{post.likes}</span>
              </button>
              
              <button className="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-1.5 lg:py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm">
                <MessageSquare className="w-3 h-3 lg:w-4 lg:h-4" />
                <span>{post.comments}</span>
              </button>
              
              <button className="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-1.5 lg:py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm">
                <Share className="w-3 h-3 lg:w-4 lg:h-4" />
                <span>{post.shares}</span>
              </button>
              
              <button className="p-1.5 lg:p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200">
                <Bookmark className="w-3 h-3 lg:w-4 lg:h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderProfile = () => (
    <div className="space-y-4 lg:space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-8">
        <div className="flex flex-col items-center space-y-4 lg:flex-row lg:items-start lg:space-y-0 lg:space-x-8">
          <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 lg:w-16 lg:h-16 text-white" />
          </div>
          
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">{currentUser.name}</h2>
            <p className="text-emerald-300 text-base lg:text-lg mb-4">@{currentUser.username}</p>
            
            <div className="flex justify-center lg:justify-start space-x-6 lg:space-x-8 mb-4 lg:mb-6">
              <div className="text-center">
                <div className="text-xl lg:text-2xl font-bold text-white">{currentUser.followers}</div>
                <div className="text-white/60 text-sm lg:text-base">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-xl lg:text-2xl font-bold text-white">{currentUser.following}</div>
                <div className="text-white/60 text-sm lg:text-base">Following</div>
              </div>
              <div className="text-center">
                <div className="text-xl lg:text-2xl font-bold text-white">42</div>
                <div className="text-white/60 text-sm lg:text-base">Posts</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
              <button className="flex items-center justify-center px-4 lg:px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base">
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
              
              <button className={`flex items-center justify-center px-4 lg:px-6 py-2 border border-white/30 rounded-xl text-white hover:bg-white/10 transition-all duration-200 text-sm lg:text-base`}>
                {currentUser.isPrivate ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Private Profile
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 mr-2" />
                    Public Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
            <h3 className="text-lg lg:text-xl font-semibold text-white mb-3 lg:mb-4">My Posts</h3>
            <div className="space-y-3 lg:space-y-4">
              {posts.slice(0, 2).map((post) => (
                <div key={post.id} className="bg-white/5 rounded-xl lg:rounded-2xl p-3 lg:p-4">
                  <p className="text-white mb-2 lg:mb-3 text-sm lg:text-base">{post.content}</p>
                  <div className="flex items-center justify-between text-xs lg:text-sm text-white/60">
                    <span>{post.timeAgo}</span>
                    <div className="flex space-x-3 lg:space-x-4">
                      <span>{post.likes} likes</span>
                      <span>{post.comments} comments</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-4 lg:space-y-6">
          {/* Activity */}
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
            <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Recent Activity</h3>
            <div className="space-y-2 lg:space-y-3">
              <div className="flex items-center space-x-2 lg:space-x-3">
                <Heart className="w-3 h-3 lg:w-4 lg:h-4 text-red-400" />
                <span className="text-white/70 text-xs lg:text-sm">Liked Sarah's post</span>
              </div>
              <div className="flex items-center space-x-2 lg:space-x-3">
                <UserPlus className="w-3 h-3 lg:w-4 lg:h-4 text-emerald-400" />
                <span className="text-white/70 text-xs lg:text-sm">Followed Mike Johnson</span>
              </div>
              <div className="flex items-center space-x-2 lg:space-x-3">
                <MessageSquare className="w-3 h-3 lg:w-4 lg:h-4 text-blue-400" />
                <span className="text-white/70 text-xs lg:text-sm">Commented on a post</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderFollowers = () => (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-xl lg:text-2xl font-bold text-white">Followers & Following</h2>
          <div className="flex space-x-2">
            <button className="px-3 lg:px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg lg:rounded-xl text-sm lg:text-base">
              Followers
            </button>
            <button className="px-3 lg:px-4 py-2 text-white/70 hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200 text-sm lg:text-base">
              Following
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {['Sarah Wilson', 'Mike Johnson', 'Alice Cooper', 'David Brown', 'Emma Davis', 'John Smith'].map((name, index) => (
            <div key={index} className="bg-white/5 rounded-xl lg:rounded-2xl p-3 lg:p-4">
              <div className="flex items-center space-x-3 lg:space-x-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-sm lg:text-base truncate">{name}</h4>
                  <p className="text-white/60 text-xs lg:text-sm truncate">@{name.toLowerCase().replace(' ', '')}</p>
                </div>
                <button className="px-2 lg:px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg text-white text-xs lg:text-sm hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 flex-shrink-0">
                  Follow
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderGroups = () => (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-xl lg:text-2xl font-bold text-white">My Groups</h2>
          <button className="flex items-center px-3 lg:px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg lg:rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {groups.map((group) => (
            <div key={group.id} className="bg-white/5 rounded-xl lg:rounded-2xl p-4 lg:p-6">
              <div className="flex items-start justify-between mb-3 lg:mb-4">
                <div className="flex-1">
                  <h3 className="text-lg lg:text-xl font-semibold text-white mb-2">{group.name}</h3>
                  <p className="text-white/70 mb-3 text-sm lg:text-base">{group.description}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs lg:text-sm text-white/60">
                    <span>{group.members} members</span>
                    <span>Last activity: {group.lastActivity}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg lg:rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base">
                  View Group
                </button>
                <button className="px-3 lg:px-4 py-2 border border-white/30 rounded-lg lg:rounded-xl text-white hover:bg-white/10 transition-all duration-200 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Browse Groups */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
        <h3 className="text-lg lg:text-xl font-semibold text-white mb-3 lg:mb-4">Discover Groups</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {['Fitness Enthusiasts', 'Book Club', 'Travel Lovers', 'Cooking Masters'].map((name, index) => (
            <div key={index} className="bg-white/5 rounded-xl lg:rounded-2xl p-3 lg:p-4">
              <h4 className="text-white font-medium mb-2 text-sm lg:text-base">{name}</h4>
              <p className="text-white/60 text-xs lg:text-sm mb-3">Join this amazing community</p>
              <button className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg lg:rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base">
                Join Group
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderEvents = () => (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-xl lg:text-2xl font-bold text-white">Upcoming Events</h2>
          <button className="flex items-center px-3 lg:px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg lg:rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </button>
        </div>
        
        <div className="space-y-3 lg:space-y-4">
          {events.map((event) => (
            <div key={event.id} className="bg-white/5 rounded-xl lg:rounded-2xl p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0 mb-3 lg:mb-4">
                <div className="flex-1">
                  <h3 className="text-lg lg:text-xl font-semibold text-white mb-2">{event.title}</h3>
                  <p className="text-white/70 mb-3 text-sm lg:text-base">{event.description}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-xs lg:text-sm text-white/60">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                      {event.date} at {event.time}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                      {event.location}
                    </div>
                  </div>
                </div>
                
                <div className="text-center lg:text-right">
                  <div className="text-xs lg:text-sm text-white/60 mb-2">From: {event.group}</div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <button className={`px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm ${
                      event.userResponse === 'going' 
                        ? 'bg-emerald-500 text-white' 
                        : 'border border-white/30 text-white hover:bg-white/10'
                    }`}>
                      Going ({event.going})
                    </button>
                    <button className={`px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm ${
                      event.userResponse === 'not_going' 
                        ? 'bg-red-500 text-white' 
                        : 'border border-white/30 text-white hover:bg-white/10'
                    }`}>
                      Not Going ({event.notGoing})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
        <h2 className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6">Settings</h2>
        
        <div className="space-y-4 lg:space-y-6">
          {/* Privacy Settings */}
          <div className="bg-white/5 rounded-xl lg:rounded-2xl p-4 lg:p-6">
            <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Privacy & Security</h3>
            <div className="space-y-3 lg:space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <h4 className="text-white font-medium text-sm lg:text-base">Private Profile</h4>
                  <p className="text-white/60 text-xs lg:text-sm">Only followers can see your posts</p>
                </div>
                <button className={`w-10 h-5 lg:w-12 lg:h-6 rounded-full transition-all duration-200 flex-shrink-0 ${
                  currentUser.isPrivate ? 'bg-emerald-500' : 'bg-white/20'
                }`}>
                  <div className={`w-3 h-3 lg:w-4 lg:h-4 bg-white rounded-full transition-all duration-200 ${
                    currentUser.isPrivate ? 'translate-x-6 lg:translate-x-7' : 'translate-x-1'
                  }`}></div>
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <h4 className="text-white font-medium text-sm lg:text-base">Show Online Status</h4>
                  <p className="text-white/60 text-xs lg:text-sm">Let others see when you're active</p>
                </div>
                <button className="w-10 h-5 lg:w-12 lg:h-6 bg-emerald-500 rounded-full flex-shrink-0">
                  <div className="w-3 h-3 lg:w-4 lg:h-4 bg-white rounded-full translate-x-6 lg:translate-x-7"></div>
                </button>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white/5 rounded-xl lg:rounded-2xl p-4 lg:p-6">
            <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Notifications</h3>
            <div className="space-y-3 lg:space-y-4">
              {['Follow Requests', 'Group Invitations', 'New Messages', 'Event Updates'].map((setting) => (
                <div key={setting} className="flex items-center justify-between">
                  <span className="text-white text-sm lg:text-base">{setting}</span>
                  <button className="w-10 h-5 lg:w-12 lg:h-6 bg-emerald-500 rounded-full flex-shrink-0">
                    <div className="w-3 h-3 lg:w-4 lg:h-4 bg-white rounded-full translate-x-6 lg:translate-x-7"></div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Account Settings */}
          <div className="bg-white/5 rounded-xl lg:rounded-2xl p-4 lg:p-6">
            <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Account</h3>
            <div className="space-y-2 lg:space-y-3">
              <button 
                onClick={testTokenExpiration}
                className="w-full text-left px-3 lg:px-4 py-2 lg:py-3 text-yellow-400 hover:bg-yellow-500/10 rounded-lg lg:rounded-xl transition-all duration-200 text-sm lg:text-base"
              >
                🔍 Test Token Expiration (Check Console)
              </button>
              <button className="w-full text-left px-3 lg:px-4 py-2 lg:py-3 text-white hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200 text-sm lg:text-base">
                Change Password
              </button>
              <button className="w-full text-left px-3 lg:px-4 py-2 lg:py-3 text-white hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200 text-sm lg:text-base">
                Download My Data
              </button>
              <button className="w-full text-left px-3 lg:px-4 py-2 lg:py-3 text-red-400 hover:bg-red-500/10 rounded-lg lg:rounded-xl transition-all duration-200 text-sm lg:text-base">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return renderHomeFeed()
      case 'profile': return renderProfile()
      case 'followers': return renderFollowers()
      case 'groups': return renderGroups()
      case 'events': return renderEvents()
      case 'settings': return renderSettings()
      default: return renderHomeFeed()
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            <Sparkles className="w-2 h-2 text-white/30" />
          </div>
        ))}
      </div>

      {renderSidebar()}
      {renderTopBar()}
      {renderCreatePost()}
      {renderNotifications()}
      {renderChat()}

      {/* Main Content */}
      <div className="lg:ml-64 pt-14 lg:pt-16 p-3 lg:p-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

// Wrap the entire component with ProtectedRoute
function ProtectedDashboard() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  )
}

export default ProtectedDashboard
