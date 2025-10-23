'use client'
import { User, UserCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { SearchResult } from '@/hooks/useSearch'
import { getUserInitials } from '@/utils/avatarUtils'

interface UserSearchResultProps {
  result: SearchResult
}

export default function UserSearchResult({ result }: UserSearchResultProps) {
  const router = useRouter()

  // Helper function to get initials from a name string
  const getInitialsFromName = (name: string | undefined): string => {
    if (!name) return '?'
    const trimmed = name.trim()
    if (trimmed.length === 0) return '?'
    if (trimmed.length === 1) return trimmed.toUpperCase()
    return trimmed.charAt(0).toUpperCase() + trimmed.charAt(1).toUpperCase()
  }

  const handleClick = () => {
    router.push(result.url)
  }

  return (
    <div
      onClick={handleClick}
      className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 hover:shadow-emerald-500/10 transition-all duration-500 group cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Enhanced Avatar with Gradient Border */}
          <div className="relative group cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white/20 group-hover:ring-emerald-400/50 transition-all duration-300">
              {result.image ? (
                <Image
                  src={result.image}
                  alt={result.title}
                  width={56}
                  height={56}
                  unoptimized={true}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {getInitialsFromName(result.title)}
                  </span>
                </div>
              )}
            </div>
            {result.metadata?.verified && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                <UserCheck className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1">
            {/* Enhanced Name with Hover Effects */}
            <div className="group cursor-pointer">
              <span
                className="text-white font-bold text-xl hover:text-emerald-300 transition-colors duration-200"
              >
                {result.title}
              </span>
            </div>

            {/* Enhanced Subtitle */}
            {result.subtitle && (
              <p
                className="text-white/70 text-sm cursor-pointer hover:text-white/90 transition-colors duration-200 mt-1"
              >
                @{result.subtitle}
              </p>
            )}

            {/* Enhanced Metadata */}
            <div className="flex items-center space-x-4 mt-3">
              <div className="flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-blue-300 text-xs font-medium">User</span>
              </div>
              {result.metadata?.followersCount && (
                <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="text-emerald-300 text-xs font-medium">{result.metadata.followersCount} followers</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Action Indicator */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-emerald-500/30">
            <User className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  )
}