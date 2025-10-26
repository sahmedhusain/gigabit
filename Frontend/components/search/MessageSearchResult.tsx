'use client'
import { MessageCircle, Clock, Users, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SearchResult } from '@/hooks/useSearch'
import Image from 'next/image'

interface MessageSearchResultProps {
  result: SearchResult
}

export default function MessageSearchResult({ result }: MessageSearchResultProps) {
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
    // Navigate to chats page with the specific conversation and message highlighted
    const conversationId = result.metadata?.conversationId
    const messageId = result.id
    const messageType = result.metadata?.type as string || 'private'
    const param = messageType === 'group' ? 'group' : 'chat'
    
    if (conversationId) {
      router.push(`/chats/all?${param}=${conversationId}&message=${messageId}`)
    } else {
      router.push(result.url)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const isGroupMessage = result.metadata?.type === 'group'

  return (
    <div
      onClick={handleClick}
      className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 hover:shadow-emerald-500/10 transition-all duration-500 group cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Enhanced Avatar/Icon with Gradient Border */}
          <div className="relative group cursor-pointer">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden shadow-md transition-all duration-300 ${
              isGroupMessage
                ? 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 group-hover:shadow-green-500/25'
                : 'bg-gradient-to-br from-blue-400 via-cyan-500 to-cyan-500 group-hover:shadow-blue-500/25'
            }`}>
              {result.image ? (
                <Image
                  src={result.image}
                  alt="Sender"
                  width={56}
                  height={56}
                  unoptimized={true}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full rounded-full flex items-center justify-center ${
                  isGroupMessage
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                    : 'bg-gradient-to-r from-blue-400 to-cyan-500'
                }`}>
                  <span className="text-white font-bold text-lg">
                    {getInitialsFromName(result.subtitle || 'Unknown')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            {/* Enhanced Sender and Date */}
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-white/80 text-sm font-medium">
                {result.subtitle}
              </span>
              {result.metadata?.createdAt && (
                <div className="flex items-center space-x-2 bg-gray-500/10 border border-gray-500/20 rounded-xl px-3 py-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-300 text-xs font-medium">{formatDate(result.metadata.createdAt)}</span>
                </div>
              )}
            </div>

            {/* Enhanced Message Content */}
            <div className="text-white group-hover:text-emerald-300 transition-colors duration-200">
              <p className="line-clamp-2 text-base leading-relaxed">
                {result.title}
              </p>
            </div>

            {/* Enhanced Metadata */}
            <div className="flex items-center space-x-4 mt-3">
              <div className="flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-3 py-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span className="text-cyan-300 text-xs font-medium">
                  {isGroupMessage ? 'Group Message' : 'Direct Message'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {isGroupMessage ? (
                  <Users className="w-4 h-4 text-blue-400" />
                ) : (
                  <MessageCircle className="w-4 h-4 text-blue-400" />
                )}
              </div>
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