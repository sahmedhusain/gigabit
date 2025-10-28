'use client'
import React from 'react'
import { Lock, Unlock, Eye, Edit3, Shield, Crown, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { GroupPrivacyTabProps } from '@/types/groups'

export default function GroupPrivacyTab({
  isAdmin,
  groupInfo,
  onUpdatePrivacy,
  onUpdatePermissions
}: GroupPrivacyTabProps) {
  if (!isAdmin) return null

  return (
    <motion.div
      key="privacy"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-6"
    >
      {/* Group Privacy */}
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 hover:shadow-emerald-500/10 transition-all duration-500">
        <div className="flex items-center space-x-3 mb-6">
          {groupInfo?.privacy === 'public' ? (
            <Unlock className="w-6 h-6 text-emerald-400" />
          ) : (
            <Lock className="w-6 h-6 text-orange-400" />
          )}
          <div>
            <h3 className="text-lg font-semibold text-white">Group Privacy</h3>
            <p className="text-white/60 text-sm">Control who can discover and join your group</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center space-x-3">
              {groupInfo?.privacy === 'public' ? (
                <Unlock className="w-5 h-5 text-emerald-400" />
              ) : (
                <Lock className="w-5 h-5 text-orange-400" />
              )}
              <div>
                <div className="font-medium text-white">
                  {groupInfo?.privacy === 'public' ? 'Public Group' : 'Private Group'}
                </div>
                <div className="text-sm text-white/60">
                  {groupInfo?.privacy === 'public'
                    ? 'Anyone can find and join this group'
                    : 'Only invited members can join this group'
                  }
                </div>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={() => onUpdatePrivacy(groupInfo?.privacy === 'public' ? 'private' : 'public')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                groupInfo?.privacy === 'public'
                  ? 'bg-emerald-500'
                  : 'bg-orange-500'
              }`}
              title={`Switch to ${groupInfo?.privacy === 'public' ? 'private' : 'public'} group`}
              aria-label={`Switch to ${groupInfo?.privacy === 'public' ? 'private' : 'public'} group`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  groupInfo?.privacy === 'public'
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Content Permissions */}
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 hover:shadow-emerald-500/10 transition-all duration-500">
        <div className="flex items-center space-x-3 mb-6">
          <Eye className="w-6 h-6 text-blue-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Content Permissions</h3>
            <p className="text-white/60 text-sm">Control who can create different types of content in this group</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Posts Permission */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center space-x-3">
              <Edit3 className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-medium text-white">Posts</div>
                <div className="text-sm text-white/60">
                  {groupInfo?.create_posts === 'all_members'
                    ? 'Any member can create posts'
                    : 'Only admins can create posts'
                  }
                </div>
              </div>
            </div>

            <button
              onClick={() => onUpdatePermissions({
                create_posts: groupInfo?.create_posts === 'all_members' ? 'admins_only' : 'all_members',
                create_polls: groupInfo?.create_polls || 'all_members',
                create_events: groupInfo?.create_events || 'all_members',
                send_messages: groupInfo?.send_messages || 'all_members'
              })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                groupInfo?.create_posts === 'all_members'
                  ? 'bg-emerald-500'
                  : 'bg-blue-500'
              }`}
              title={`Switch posts permission to ${groupInfo?.create_posts === 'all_members' ? 'admins only' : 'all members'}`}
              aria-label={`Switch posts permission to ${groupInfo?.create_posts === 'all_members' ? 'admins only' : 'all members'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  groupInfo?.create_posts === 'all_members'
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Polls Permission */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-teal-400" />
              <div>
                <div className="font-medium text-white">Polls</div>
                <div className="text-sm text-white/60">
                  {groupInfo?.create_polls === 'all_members'
                    ? 'Any member can create polls'
                    : 'Only admins can create polls'
                  }
                </div>
              </div>
            </div>

            <button
              onClick={() => onUpdatePermissions({
                create_posts: groupInfo?.create_posts || 'all_members',
                create_polls: groupInfo?.create_polls === 'all_members' ? 'admins_only' : 'all_members',
                create_events: groupInfo?.create_events || 'all_members',
                send_messages: groupInfo?.send_messages || 'all_members'
              })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                groupInfo?.create_polls === 'all_members'
                  ? 'bg-emerald-500'
                  : 'bg-blue-500'
              }`}
              title={`Switch polls permission to ${groupInfo?.create_polls === 'all_members' ? 'admins only' : 'all members'}`}
              aria-label={`Switch polls permission to ${groupInfo?.create_polls === 'all_members' ? 'admins only' : 'all members'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  groupInfo?.create_polls === 'all_members'
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Events Permission */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center space-x-3">
              <Crown className="w-5 h-5 text-blue-400" />
              <div>
                <div className="font-medium text-white">Events</div>
                <div className="text-sm text-white/60">
                  {groupInfo?.create_events === 'all_members'
                    ? 'Any member can create events'
                    : 'Only admins can create events'
                  }
                </div>
              </div>
            </div>

            <button
              onClick={() => onUpdatePermissions({
                create_posts: groupInfo?.create_posts || 'all_members',
                create_polls: groupInfo?.create_polls || 'all_members',
                create_events: groupInfo?.create_events === 'all_members' ? 'admins_only' : 'all_members',
                send_messages: groupInfo?.send_messages || 'all_members'
              })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                groupInfo?.create_events === 'all_members'
                  ? 'bg-emerald-500'
                  : 'bg-blue-500'
              }`}
              title={`Switch events permission to ${groupInfo?.create_events === 'all_members' ? 'admins only' : 'all members'}`}
              aria-label={`Switch events permission to ${groupInfo?.create_events === 'all_members' ? 'admins only' : 'all members'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  groupInfo?.create_events === 'all_members'
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Messages Permission */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="font-medium text-white">Messages</div>
                <div className="text-sm text-white/60">
                  {groupInfo?.send_messages === 'all_members'
                    ? 'Any member can send messages'
                    : 'Only admins can send messages'
                  }
                </div>
              </div>
            </div>

            <button
              onClick={() => onUpdatePermissions({
                create_posts: groupInfo?.create_posts || 'all_members',
                create_polls: groupInfo?.create_polls || 'all_members',
                create_events: groupInfo?.create_events || 'all_members',
                send_messages: groupInfo?.send_messages === 'all_members' ? 'admins_only' : 'all_members'
              })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                groupInfo?.send_messages === 'all_members'
                  ? 'bg-emerald-500'
                  : 'bg-blue-500'
              }`}
              title={`Switch messages permission to ${groupInfo?.send_messages === 'all_members' ? 'admins only' : 'all members'}`}
              aria-label={`Switch messages permission to ${groupInfo?.send_messages === 'all_members' ? 'admins only' : 'all members'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  groupInfo?.send_messages === 'all_members'
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}