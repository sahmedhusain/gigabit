'use client'
import React from 'react'
import { Users, Lock, UserPlus, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { GroupSettingsTabsProps } from '@/types/groups'

export default function GroupSettingsTabs({
  activeTab,
  isAdmin,
  receivedRequestsCount,
  onTabChange
}: GroupSettingsTabsProps) {
  const baseTabs = [
    { id: 'members', label: 'Members', icon: Users },
    { id: 'privacy', label: 'Privacy & Permissions', icon: Lock },
    { id: 'requests', label: 'Join Requests', icon: UserPlus },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle }
  ] as const

  const tabs = isAdmin ? baseTabs : baseTabs

  return (
    <div className="px-6 mb-6">
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-1 hover:shadow-emerald-500/10 transition-all duration-500">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const hasBadge = tab.id === 'requests' && receivedRequestsCount > 0
            const badgeCount = tab.id === 'requests' ? receivedRequestsCount : 0
            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id as 'members' | 'privacy' | 'requests' | 'danger')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 flex-1 justify-center ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {hasBadge && (
                  <div className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {badgeCount}
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}