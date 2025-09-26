'use client'
import { User, Heart, MessageSquare, MoreHorizontal, Bookmark, Image as ImageIcon, Send } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Post } from '@/lib/api'
import { useRealTimeComments } from '@/hooks'
import { getAvatarUrl } from '@/utils/avatarUtils'

interface PostCardProps {
  post: Post
  onLike: (postId: number) => void
  onBookmark?: (postId: number) => void
  currentSubTab?: string
}

export default function PostCard({ post, onLike, onBookmark, currentSubTab }: PostCardProps) {
  const router = useRouter()
  
  // Real-time comment integration
  const { 
    comments, 
    newCommentsCount, 
    markNewCommentsAsRead 
  } = useRealTimeComments(post.id)

  const handlePostClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    const url = currentSubTab ? `/post/${post.id}?from=feed&subTab=${currentSubTab}` : `/post/${post.id}`
    router.push(url)
  }

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onLike(post.id)
  }

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onBookmark) {
      onBookmark(post.id)
    }
  }

  return (
    <div
      className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6 cursor-pointer hover:bg-white/15 transition-all duration-200"
      onClick={handlePostClick}
    >
      {/* Post Header */}
      <div className="flex items-center justify-between mb-3 lg:mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center overflow-hidden">
            {getAvatarUrl(post.user.avatar) ? (
              <>
                <Image 
                  src={getAvatarUrl(post.user.avatar)!}
                  alt={`${post.user.name}'s avatar`}
                  width={40}
                  height={40}
                  unoptimized={getAvatarUrl(post.user.avatar)!.includes('/svg')}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    // Fallback to default User icon on error
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <User className="w-4 h-4 lg:w-5 lg:h-5 text-white hidden" />
              </>
            ) : (
              <User className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="text-white font-medium text-sm lg:text-base truncate">{post.user.name}</h4>
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
          <Image 
            src={post.image.startsWith('http') ? 
              post.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${post.image}`
            } 
            alt="Post image" 
            width={500}
            height={300}
            unoptimized={post.image.includes('/svg')}
            className="w-full h-auto object-cover"
            onError={(e) => {
              // Fallback to placeholder on error
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="aspect-video bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 lg:w-12 lg:h-12 text-white/50" />
          </div>
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-3 lg:pt-4 border-t border-white/10">
        <div className="flex items-center space-x-2 lg:space-x-4">
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
              const url = currentSubTab ? `/post/${post.id}?from=feed&subTab=${currentSubTab}` : `/post/${post.id}`
              router.push(url)
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
            <Send className="w-3 h-3 lg:w-4 lg:h-4" />
            <span>{post.shares}</span>
          </button>
        </div>

        <button
          onClick={handleBookmarkClick}
          className={`p-1.5 lg:p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg lg:rounded-xl transition-all duration-200 ${
            post.isBookmarked ? 'text-yellow-400' : ''
          }`}
          title={post.isBookmarked ? "Remove bookmark" : "Bookmark post"}
          aria-label={post.isBookmarked ? "Remove bookmark" : "Bookmark post"}>
          <Bookmark className={`w-3 h-3 lg:w-4 lg:h-4 ${post.isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  )
}
