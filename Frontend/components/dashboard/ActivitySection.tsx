'use client'
import { Heart, MessageCircle, Bookmark, Clock } from 'lucide-react'
import { Post } from '@/lib/api'

interface ActivitySectionProps {
  activitySubTab: string
  setActivitySubTab: (tab: string) => void
  posts: Post[]
  onPostLike: (postId: number) => void
}

export default function ActivitySection({
  activitySubTab,
  setActivitySubTab,
  posts,
  onPostLike
}: ActivitySectionProps) {
  // Mock data for demonstration - in real app, this would come from API
  const likedPosts = posts.filter(post => post.isLiked)
  const commentedPosts = posts.slice(0, 3) // Mock commented posts
  const savedPosts = posts.slice(0, 2) // Mock saved posts

  const formatTimeAgo = (timeAgo: string) => timeAgo

  const renderPostCard = (post: Post, activityType: string) => (
    <div
      key={post.id}
      className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all"
    >
      <div className="flex items-start space-x-3">
        <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
          {post.user.name[0]?.toUpperCase()}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-white font-medium">{post.user.name}</h3>
              <p className="text-white/60 text-sm">@{post.user.username}</p>
            </div>
            <div className="flex items-center space-x-2 text-white/60 text-sm">
              {activityType === 'liked' && <Heart className="w-4 h-4 text-red-400" />}
              {activityType === 'commented' && <MessageCircle className="w-4 h-4 text-blue-400" />}
              {activityType === 'saved' && <Bookmark className="w-4 h-4 text-yellow-400" />}
              <span>{post.timeAgo}</span>
            </div>
          </div>
          
          <p className="text-white/80 mb-4 leading-relaxed">{post.content}</p>
          
          {post.image && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img
                src={post.image}
                alt="Post content"
                className="w-full h-64 object-cover"
              />
            </div>
          )}
          
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => onPostLike(post.id)}
                className={`flex items-center space-x-2 transition-all ${
                  post.isLiked
                    ? 'text-red-400 hover:text-red-300'
                    : 'text-white/60 hover:text-red-400'
                }`}
              >
                <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                <span>{post.likes}</span>
              </button>
              
              <button className="flex items-center space-x-2 text-white/60 hover:text-blue-400 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span>{post.comments}</span>
              </button>
              
              <button 
                title="Save post"
                className="flex items-center space-x-2 text-white/60 hover:text-yellow-400 transition-colors"
              >
                <Bookmark className="w-5 h-5" />
              </button>
            </div>
            
            <span className="text-white/40 text-sm">{post.privacy}</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    let postsToShow: Post[] = []
    let emptyMessage = ''
    let emptyIcon = <Heart className="w-16 h-16 text-white/30 mx-auto mb-4" />

    switch (activitySubTab) {
      case 'liked':
        postsToShow = likedPosts
        emptyMessage = 'No liked posts yet'
        emptyIcon = <Heart className="w-16 h-16 text-white/30 mx-auto mb-4" />
        break
      case 'commented':
        postsToShow = commentedPosts
        emptyMessage = 'No commented posts yet'
        emptyIcon = <MessageCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
        break
      case 'saved':
        postsToShow = savedPosts
        emptyMessage = 'No saved posts yet'
        emptyIcon = <Bookmark className="w-16 h-16 text-white/30 mx-auto mb-4" />
        break
      default:
        postsToShow = likedPosts
        emptyMessage = 'No activity yet'
    }

    if (postsToShow.length === 0) {
      return (
        <div className="text-center py-16">
          {emptyIcon}
          <p className="text-white/60">{emptyMessage}</p>
          <p className="text-white/40 text-sm mt-2">Start engaging with posts to see your activity here</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {postsToShow.map(post => renderPostCard(post, activitySubTab))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {activitySubTab === 'liked' && 'Liked Posts'}
          {activitySubTab === 'commented' && 'Commented Posts'}
          {activitySubTab === 'saved' && 'Saved Posts'}
        </h1>
        <p className="text-white/70">
          {activitySubTab === 'liked' && 'Posts you\'ve liked'}
          {activitySubTab === 'commented' && 'Posts you\'ve commented on'}
          {activitySubTab === 'saved' && 'Your bookmarked posts'}
        </p>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {renderContent()}
      </div>
    </div>
  )
}