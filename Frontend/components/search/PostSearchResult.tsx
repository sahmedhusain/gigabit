'use client'
import { Clock, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SearchResult } from '@/hooks/useSearch'
import Image from 'next/image'
interface PostSearchResultProps {
  result: SearchResult
}

export default function PostSearchResult({ result }: PostSearchResultProps) {
  const router = useRouter()

  // Helper function to get initials from name
  const getInitialsFromName = (name: string) => {
    if (!name || !name.trim()) return 'U'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
    } else {
      return parts[0].slice(0, 2).toUpperCase()
    }
  }

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
                <Image
                  src={result.image}
                  alt={result.metadata?.authorName || 'Author'}
                  width={56}
                  height={56}
                  unoptimized={true}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {getInitialsFromName(result.subtitle || result.metadata?.authorName || 'Unknown')}
                  </span>
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

            {/* Post Image Preview */}
            {result.metadata?.postImage && (
              <div className="mt-3 flex justify-start">
                <div className="relative inline-block overflow-hidden rounded-xl border border-white/20 shadow-lg group-hover:shadow-emerald-500/20 transition-shadow duration-300">
                  <Image
                    src={result.metadata.postImage.startsWith('http') ?
                      result.metadata.postImage :
                      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${result.metadata.postImage}`
                    }
                    width={200}
                    height={128}
                    alt="Post image"
                    unoptimized={true}
                    className="max-w-full max-h-32 object-cover hover:scale-105 transition-transform duration-300 rounded-xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}

            {/* Enhanced Metadata */}
            <div className="flex items-center space-x-4 mt-4">
              <div className="flex items-center space-x-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-1">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span className="text-orange-300 text-xs font-medium">Post</span>
              </div>
              {/* Likes and comments intentionally hidden in search results */}
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