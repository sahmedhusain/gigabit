'use client'
import { FileText, Heart, MessageCircle, Clock, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SearchResult } from '@/hooks/useSearch'

interface PostSearchResultProps {
  result: SearchResult
}

export default function PostSearchResult({ result }: PostSearchResultProps) {
  const router = useRouter()

  const handleClick = () => {
    // Navigate to individual post page
    router.push(result.url)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <div
      onClick={handleClick}
      className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 hover:shadow-emerald-500/10 transition-all duration-500 group cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Enhanced Avatar/Icon with Gradient Border */}
          <div className="relative group cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center overflow-hidden shadow-md group-hover:shadow-green-500/25 transition-all duration-300">
              {result.image ? (
                <img
                  src={result.image}
                  alt={result.metadata?.authorName || 'Author'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <FileText className="w-7 h-7 text-white" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            {/* Enhanced Author and Date */}
            <div className="flex items-center space-x-3 mb-2">
              {result.subtitle && (
                <span className="text-white/80 text-sm font-medium">
                  {result.subtitle}
                </span>
              )}
              {result.metadata?.createdAt && (
                <div className="flex items-center space-x-2 bg-gray-500/10 border border-gray-500/20 rounded-xl px-3 py-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-300 text-xs font-medium">{formatDate(result.metadata.createdAt)}</span>
                </div>
              )}
            </div>

            {/* Enhanced Post Content */}
            <div className="text-white group-hover:text-emerald-300 transition-colors duration-200">
              <p className="line-clamp-3 text-base leading-relaxed">
                {result.title}
              </p>
            </div>

            {/* Enhanced Metadata */}
            <div className="flex items-center space-x-4 mt-4">
              <div className="flex items-center space-x-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-1">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span className="text-orange-300 text-xs font-medium">Post</span>
              </div>
              {result.metadata?.likeCount && (
                <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-1">
                  <Heart className="w-3 h-3 text-red-400" />
                  <span className="text-red-300 text-xs font-medium">{result.metadata.likeCount} likes</span>
                </div>
              )}
              {result.metadata?.commentCount && (
                <div className="flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-3 py-1">
                  <MessageCircle className="w-3 h-3 text-cyan-400" />
                  <span className="text-cyan-300 text-xs font-medium">{result.metadata.commentCount} comments</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Action Indicator */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-emerald-500/30">
            <ExternalLink className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  )
}