'use client'
import { User, Heart, MessageSquare, Share, MoreHorizontal, Bookmark, Image as ImageIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import CategoryBadge from '@/components/ui/CategoryBadge'
import { Post } from '@/lib/api'
import { useRealTimeComments, useConnectionStatus } from '@/hooks'

interface PostCardProps {
  post: Post
  onLike: (postId: number) => void
}

export default function PostCard({ post, onLike }: PostCardProps) {
  const router = useRouter()
  
  // Real-time comment integration
  const { 
    comments, 
    newCommentsCount, 
    isConnected: commentsConnected,
    markNewCommentsAsRead 
  } = useRealTimeComments(post.id)
  
  // Connection status monitoring
  const { isConnected } = useConnectionStatus()

  const handlePostClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    router.push(`/post/${post.id}`)
  }

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onLike(post.id)
  }

  return (
    <div
      className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6 cursor-pointer hover:bg-white/15 transition-all duration-200"
      onClick={handlePostClick}
    >
      {/* Post Header */}
      <div className="flex items-center justify-between mb-3 lg:mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="text-white font-medium text-sm lg:text-base truncate">{post.user.name}</h4>
              {post.category && <CategoryBadge category={post.category} size="sm" />}
            </div>
            <p className="text-white/60 text-xs lg:text-sm">@{post.user.username} • {post.timeAgo}</p>
          </div>
        </div>
        <button 
          className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200 flex-shrink-0"
          title="More options"
          aria-label="More options">
          <MoreHorizontal className="w-4 h-4 lg:w-5 lg:h-5" />
        </button>
      </div>

      {/* Post Content */}
      <p className="text-white mb-3 lg:mb-4 text-sm lg:text-base leading-relaxed">{post.content}</p>

      {/* Post Image */}
      {post.image && (
        <div className="mb-3 lg:mb-4 rounded-xl lg:rounded-2xl overflow-hidden bg-white/5">
          <img 
            src={post.image} 
            alt="Post image" 
            className="w-full h-auto object-cover"
            onError={(e) => {
              // Fallback to placeholder on error
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="aspect-video bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center hidden">
            <ImageIcon className="w-8 h-8 lg:w-12 lg:h-12 text-white/50" />
          </div>
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-3 lg:pt-4 border-t border-white/10">
        <button
          onClick={handleLikeClick}
          className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm ${post.isLiked
            ? 'text-red-400 bg-red-500/10'
            : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}>
          <Heart className={`w-3 h-3 lg:w-4 lg:h-4 ${post.isLiked ? 'fill-current' : ''}`} />
          <span>{post.likes}</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            markNewCommentsAsRead()
            router.push(`/post/${post.id}`)
          }}
          className="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-1.5 lg:py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm relative">
          <MessageSquare className="w-3 h-3 lg:w-4 lg:h-4" />
          <span>{comments.length || post.comments}</span>
          {newCommentsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
              {newCommentsCount > 99 ? '99+' : newCommentsCount}
            </span>
          )}
        </button>

        <button
          onClick={(e) => e.stopPropagation()}
          className="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-1.5 lg:py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200 text-xs lg:text-sm">
          <Share className="w-3 h-3 lg:w-4 lg:h-4" />
          <span>{post.shares}</span>
        </button>

        <button
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 lg:p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200"
          title="Bookmark post"
          aria-label="Bookmark post">
          <Bookmark className="w-3 h-3 lg:w-4 lg:h-4" />
        </button>
      </div>
    </div>
  )
}
