'use client'
import { X, Users } from 'lucide-react'
import { CreateGroupRequest, api } from '@/lib/api'
import { useState } from 'react'
import { useOptimisticUpdate, useConnectionStatus } from '@/hooks'
import { useToast } from '@/context/ToastContext'

interface CreateGroupProps {
  show: boolean
  onClose: () => void
  onGroupCreated?: () => void
}

export default function CreateGroup({
  show,
  onClose,
  onGroupCreated
}: CreateGroupProps) {
  const [groupTitle, setGroupTitle] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [error, setError] = useState<string>('')
  const { success, error: showError } = useToast()
  const { isConnected } = useConnectionStatus()
  
  const { isLoading, performUpdate } = useOptimisticUpdate({
    onSuccess: () => {
      success('Group created successfully!')
      // Reset form
      setGroupTitle('')
      setGroupDescription('')
      setError('')
      onGroupCreated?.()
      onClose()
    },
    onError: (error: any) => {
      showError(`Failed to create group: ${error.message}`)
    }
  })

  const handleCreateGroup = async () => {
    // Validation
    if (!groupTitle.trim()) {
      setError('Group title is required')
      return
    }

    if (groupTitle.length > 100) {
      setError('Group title cannot exceed 100 characters')
      return
    }

    if (groupDescription.length > 500) {
      setError('Group description cannot exceed 500 characters')
      return
    }

    if (!isConnected) {
      showError('Cannot create group while offline')
      return
    }

    setError('')

    const groupData: CreateGroupRequest = {
      title: groupTitle.trim(),
      description: groupDescription.trim()
    }

    performUpdate(
      (current) => ({ ...current, isCreating: true }),
      async () => {
        await api.createGroup(groupData)
        return {}
      }
    )
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCreateGroup()
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl h-[90vh] flex flex-col">
        {/* Enhanced backdrop with multiple layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-rose-500/20 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>

        {/* Fixed Header */}
        <div className="relative flex-shrink-0 p-6 lg:p-8 pb-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 via-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white drop-shadow-sm" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">Create New Group</h3>
                <p className="text-white/60 text-sm">Build a community around shared interests</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="group p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300 hover:scale-105"
              title="Close"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="relative flex-1 overflow-y-auto px-6 lg:px-8">
          <div className="space-y-6">
            {/* Group Title */}
            <div className="space-y-3">
              <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Group Title *</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter a catchy group name..."
                  className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all duration-300 hover:bg-white/15 text-sm lg:text-base"
                  maxLength={100}
                />
                <div className="absolute bottom-4 right-4 text-xs text-white/50">
                  {groupTitle.length}/100
                </div>
              </div>
            </div>

            {/* Group Description */}
            <div className="space-y-3">
              <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                <span>Description</span>
              </label>
              <div className="relative">
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Describe what your group is about, its purpose, and what members can expect..."
                  className="w-full h-32 lg:h-36 bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400/50 resize-none text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                  maxLength={500}
                />
                <div className="absolute bottom-4 right-4 text-xs text-white/50">
                  {groupDescription.length}/500
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300">
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Connection Status */}
            {!isConnected && (
              <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300">
                <p className="text-red-300 text-sm font-medium">You're currently offline. Group will be created when connection is restored.</p>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="relative flex-shrink-0 p-6 lg:p-8 pt-4">
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-white/10">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 border border-white/30 rounded-2xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium hover:scale-105"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={isLoading || !groupTitle.trim() || !isConnected}
              className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-white font-semibold text-sm lg:text-base transition-all duration-300 hover:scale-105 shadow-lg ${
                isLoading || !groupTitle.trim() || !isConnected
                  ? 'bg-white/20 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 via-pink-600 to-rose-600 hover:from-purple-600 hover:via-pink-700 hover:to-rose-700 shadow-purple-500/25'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Group...</span>
                </div>
              ) : !isConnected ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Offline</span>
                </div>
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
