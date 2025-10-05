'use client'
import { Heart, MessageCircle, Bookmark, Send } from 'lucide-react'
import { Post } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface ActivitySectionProps {
  activitySubTab: string
  posts: Post[]
  onPostLike: (postId: number) => void
  onPostBookmark?: (postId: number) => void
}

export default function ActivitySection({
  activitySubTab,
  posts,
  onPostLike,
  onPostBookmark
}: ActivitySectionProps) {
  const router = useRouter()

  const handlePostClick = (postId: number, e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    const url = `/post/${postId}?from=activity&subTab=${activitySubTab}`
    router.push(url)
  }

  const handleCommentClick = (postId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `/post/${postId}?from=activity&subTab=${activitySubTab}`
    router.push(url)
  }
  // Mock data for demonstration - in real app, this would come from API
  const likedPosts = posts.filter(post => post.isLiked)
  const commentedPosts = posts.slice(0, 3) // Mock commented posts
  const savedPosts = posts.slice(0, 2) // Mock saved posts

  const renderPostCard = (post: Post, activityType: string) => (
    <div
      key={post.id}
      className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer"
      onClick={(e) => handlePostClick(post.id, e)}
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
            <div className="mb-4 rounded-lg overflow-hidden max-w-sm mx-auto">
              <Image
                src={post.image}
                alt="Post content"
                width={400}
                height={256}
                unoptimized={post.image.includes('/svg')}
                className="w-full h-auto max-h-64 object-contain"
              />
            </div>
          )}
          
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center space-x-6">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onPostLike(post.id)
                }}
                className={`flex items-center space-x-2 transition-all ${
                  post.isLiked
                    ? 'text-red-400 hover:text-red-300'
                    : 'text-white/60 hover:text-red-400'
                }`}
              >
                <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                <span>{post.likes}</span>
              </button>
              
              <button 
                onClick={(e) => handleCommentClick(post.id, e)}
                className="flex items-center space-x-2 text-white/60 hover:text-blue-400 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{post.comments}</span>
              </button>
              
              <button 
                className="flex items-center space-x-2 text-white/60 hover:text-green-400 transition-colors"
              >
                <Send className="w-5 h-5" />
                <span>{post.shares}</span>
              </button>
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation()
                if (onPostBookmark) {
                  onPostBookmark(post.id)
                }
              }}
              title={post.isBookmarked ? "Remove bookmark" : "Save post"}
              className={`p-2 rounded-lg transition-colors ${
                post.isBookmarked
                  ? 'text-yellow-400 hover:text-yellow-300 bg-yellow-500/10'
                  : 'text-white/60 hover:text-yellow-400 hover:bg-white/10'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
            </button>
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
      case 'liked': {
        postsToShow = likedPosts
        emptyMessage = 'No liked posts yet'
        emptyIcon = <Heart className="w-16 h-16 text-white/30 mx-auto mb-4" />
        break
      }
      case 'commented': {
        postsToShow = commentedPosts
        emptyMessage = 'No commented posts yet'
        emptyIcon = <MessageCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
        break
      }
      case 'saved': {
        postsToShow = savedPosts
        emptyMessage = 'No saved posts yet'
        emptyIcon = <Bookmark className="w-16 h-16 text-white/30 mx-auto mb-4" />
        break
      }
      default: {
        postsToShow = likedPosts
        emptyMessage = 'No activity yet'
        break
      }
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          {activitySubTab === 'liked' ? 'Liked Posts' :
           activitySubTab === 'commented' ? 'Commented Posts' :
           activitySubTab === 'saved' ? 'Saved Posts' : 'Activity'}
        </h1>
        <p className="text-white/70">
          {activitySubTab === 'liked' ? 'Posts you\'ve liked' :
           activitySubTab === 'commented' ? 'Posts you\'ve commented on' :
           activitySubTab === 'saved' ? 'Your bookmarked posts' : 'Your activity'}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  )
}