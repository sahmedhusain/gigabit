'use client'
import React from 'react'
import { MessageCircle, FileText, Calendar, BarChart3, Settings, Info } from 'lucide-react'
import { motion } from 'framer-motion'

interface GroupChatTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  newPostsCount: number
  unrespondedPollsCount: number
  unrespondedEventsCount: number
  pendingRequestsCount: number
  isAdminOrCreator: boolean
}

const GroupChatTabs: React.FC<GroupChatTabsProps> = ({
  activeTab,
  setActiveTab,
  newPostsCount,
  unrespondedPollsCount,
  unrespondedEventsCount,
  pendingRequestsCount,
  isAdminOrCreator
}) => {
  const tabs = isAdminOrCreator
    ? ['info', 'chat', 'posts', 'events', 'polls', 'settings']
    : ['info', 'chat', 'posts', 'events', 'polls'];

  return (
    <div className="px-6 py-3 flex justify-center items-center overflow-x-auto relative">
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-1 hover:shadow-emerald-500/10 transition-all duration-500 relative z-10">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 flex-1 justify-center ${
                activeTab === tab
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {tab === 'info' && <Info className="w-4 h-4" />}
              {tab === 'chat' && <MessageCircle className="w-4 h-4" />}
              {tab === 'posts' && <FileText className="w-4 h-4" />}
              {tab === 'events' && <Calendar className="w-4 h-4" />}
              {tab === 'polls' && <BarChart3 className="w-4 h-4" />}
              {tab === 'settings' && <Settings className="w-4 h-4" />}
              <span className="capitalize">{tab === 'settings' ? 'Settings' : tab}</span>
              {/* Count badges */}
              {tab === 'posts' && newPostsCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                  {newPostsCount > 99 ? '99+' : newPostsCount}
                </span>
              )}
              {tab === 'polls' && unrespondedPollsCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                  {unrespondedPollsCount > 99 ? '99+' : unrespondedPollsCount}
                </span>
              )}
              {tab === 'events' && unrespondedEventsCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                  {unrespondedEventsCount > 99 ? '99+' : unrespondedEventsCount}
                </span>
              )}
              {tab === 'settings' && pendingRequestsCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                  {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GroupChatTabs