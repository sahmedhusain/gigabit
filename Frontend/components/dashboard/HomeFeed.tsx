'use client'
import PostCard from './PostCard'
import { Post } from '@/lib/api'

interface HomeFeedProps {
  posts: Post[]
  onPostLike: (postId: number) => void
  setActiveTab: (tab: string) => void
}

export default function HomeFeed({
  posts,
  onPostLike,
  setActiveTab
}: HomeFeedProps) {
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Posts Feed */}
      <div className="space-y-4 lg:space-y-6">
        {posts.length === 0 ? (
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-8 text-center">
            <p className="text-white/60 text-lg">No posts to show</p>
            <p className="text-white/40 text-sm mt-2">Start following people or join groups to see posts in your feed!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={onPostLike}
            />
          ))
        )}
      </div>
    </div>
  )
}
