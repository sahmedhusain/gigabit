'use client'
import { Calendar, Clock, MapPin, Users, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SearchResult } from '@/hooks/useSearch'

interface EventSearchResultProps {
  result: SearchResult
}

export default function EventSearchResult({ result }: EventSearchResultProps) {
  const router = useRouter()

  const handleClick = () => {
    // Navigate to events page and highlight the specific event
    const eventId = result.id
    router.push(`/events/all?event=${eventId}`)
  }

  const formatEventTime = (eventTime: string) => {
    try {
      const date = new Date(eventTime)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    } catch {
      return eventTime
    }
  }

  return (
    <div
      onClick={handleClick}
      className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 hover:shadow-emerald-500/10 transition-all duration-500 group cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Enhanced Icon with Gradient Border */}
          <div className="relative group cursor-pointer">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-md group-hover:shadow-blue-500/25 transition-all duration-300">
              <Calendar className="w-7 h-7 text-white drop-shadow-sm" />
            </div>
          </div>

          <div className="flex-1">
            {/* Enhanced Event Title */}
            <div className="group cursor-pointer">
              <span
                className="text-white font-bold text-xl hover:text-emerald-300 transition-colors duration-200"
              >
                {result.title}
              </span>
            </div>

            {/* Enhanced Event Details */}
            <div className="flex items-center space-x-4 mt-2 text-sm text-white/70">
              {result.metadata?.eventTime && (
                <div className="flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-1">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  <span className="text-indigo-300 text-xs font-medium">{formatEventTime(result.metadata.eventTime)}</span>
                </div>
              )}
              {result.metadata?.location && (
                <div className="flex items-center space-x-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-1">
                  <MapPin className="w-3 h-3 text-green-400" />
                  <span className="text-green-300 text-xs font-medium truncate">{result.metadata.location}</span>
                </div>
              )}
            </div>

            {/* Enhanced Subtitle */}
            {result.subtitle && (
              <p
                className="text-white/60 text-sm cursor-pointer hover:text-white/80 transition-colors duration-200 mt-2"
              >
                {result.subtitle}
              </p>
            )}

            {/* Enhanced Metadata */}
            <div className="flex items-center space-x-4 mt-3">
              <div className="flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-purple-300 text-xs font-medium">Event</span>
              </div>
              {result.metadata?.goingCount && (
                <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1">
                  <Users className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300 text-xs font-medium">{result.metadata.goingCount} going</span>
                </div>
              )}
              {result.metadata?.groupName && (
                <div className="flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-3 py-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span className="text-cyan-300 text-xs font-medium">{result.metadata.groupName}</span>
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