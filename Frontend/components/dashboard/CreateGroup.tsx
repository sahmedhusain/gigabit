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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 shadow-2xl"></div>

        <div className="relative p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold text-white">Create New Group</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Group Title */}
            <div className="space-y-2">
              <label className="text-white font-medium text-sm lg:text-base">Group Title *</label>
              <input
                type="text"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter group title..."
                className="w-full bg-white/10 border border-white/20 rounded-xl lg:rounded-2xl p-3 lg:p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 text-sm lg:text-base"
                maxLength={100}
              />
              <div className="text-xs text-white/50 text-right">
                {groupTitle.length}/100
              </div>
            </div>

            {/* Group Description */}
            <div className="space-y-2">
              <label className="text-white font-medium text-sm lg:text-base">Description</label>
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Describe your group..."
                className="w-full h-24 lg:h-32 bg-white/10 border border-white/20 rounded-xl lg:rounded-2xl p-3 lg:p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 resize-none text-sm lg:text-base"
                maxLength={500}
              />
              <div className="text-xs text-white/50 text-right">
                {groupDescription.length}/500
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-400/20 rounded-xl p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Info Section */}
            <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-xl p-3">
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-emerald-300">
                  <p className="font-medium mb-1">Group Features:</p>
                  <ul className="space-y-1 text-emerald-200/80">
                    <li>• Invite followers to join your group</li>
                    <li>• Create posts and events for group members</li>
                    <li>• Private group chat for members</li>
                    <li>• Manage group membership and settings</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 lg:px-6 py-2 border border-white/30 rounded-xl text-white hover:bg-white/10 transition-all duration-200 text-sm lg:text-base"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={isLoading || !groupTitle.trim() || !isConnected}
                className={`w-full sm:w-auto px-4 lg:px-6 py-2 rounded-xl text-white transition-all duration-200 text-sm lg:text-base ${
                  isLoading || !groupTitle.trim() || !isConnected
                    ? 'bg-white/20 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                }`}
              >
                {isLoading ? 'Creating...' : !isConnected ? 'Offline' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
