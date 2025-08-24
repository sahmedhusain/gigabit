'use client'
import { TrendingUp, Activity } from 'lucide-react'
import CategoryBadge from '@/components/ui/CategoryBadge'
import PostCard from './PostCard'
import { Post, CategoryResponse } from '@/lib/api'

interface HomeFeedProps {
  posts: Post[]
  trendingCategories: CategoryResponse[]
  onPostLike: (postId: number) => void
  onCategoryClick: (categoryId: number) => void
  setActiveTab: (tab: string) => void
}

export default function HomeFeed({
  posts,
  trendingCategories,
  onPostLike,
  onCategoryClick,
  setActiveTab
}: HomeFeedProps) {
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Trending Categories Section */}
      {trendingCategories.length > 0 && (
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h3 className="text-white font-semibold mb-0 text-base lg:text-lg flex items-center">
              <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
              Trending Categories
            </h3>
            <button
              onClick={() => setActiveTab('categories')}
              className="text-emerald-400 hover:text-emerald-300 text-xs lg:text-sm font-medium transition-colors duration-200"
            >
              View All
            </button>
          </div>
          <div className="flex space-x-2 lg:space-x-3 overflow-x-auto pb-2">
            {trendingCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryClick(category.id)}
                className="flex-shrink-0 bg-white/5 hover:bg-white/10 rounded-lg lg:rounded-xl p-2 lg:p-3 border border-white/10 hover:border-emerald-400/30 transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  <CategoryBadge category={category} size="sm" />
                  <div className="flex items-center space-x-1">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span className="text-white/70 text-xs">{category.post_count}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

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
