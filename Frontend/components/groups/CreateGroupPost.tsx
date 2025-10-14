'use client'
import { X, Camera, Image as ImageIcon, Send, Check } from 'lucide-react'
import { ChangeEvent, useRef, useState } from 'react'
import { useOptimisticUpdate, useConnectionStatus, useUpload } from '@/hooks'
import { useToast } from '@/context/ToastContext'
import { api } from '@/lib/api'

interface CreateGroupPostProps {
  show: boolean
  onClose: () => void
  groupId: number
  groupTitle: string
  onPostCreated?: () => void
}

export default function CreateGroupPost({
  show,
  onClose,
  groupId,
  groupTitle,
  onPostCreated
}: CreateGroupPostProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { success, error: toastError } = useToast()
  const { isConnected } = useConnectionStatus()
  const { progress, isUploading } = useUpload()
  
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostImage, setNewPostImage] = useState<File | null>(null)

  const { isLoading, performUpdate } = useOptimisticUpdate({
    onSuccess: () => {
      success('Group post created successfully!')
      // Reset form
      setNewPostContent('')
      setNewPostImage(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onPostCreated?.()
      onClose()
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      toastError(`Failed to create group post: ${message}`)
    }
  })

  const handleCreatePost = async () => {
    if (!isConnected) {
      toastError('Cannot create post while offline')
      return
    }

    if (!newPostContent.trim()) {
      toastError('Post content is required')
      return
    }

    performUpdate(
      (current) => ({ ...current, isCreating: true }),
      async () => {
        // Create the post data
        const postData = {
          content: newPostContent.trim(),
          image_url: newPostImage ? URL.createObjectURL(newPostImage) : ''
        }

        // Call API to create group post
        await api.createGroupPost(groupId, postData)
        return {}
      }
    )
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setNewPostImage(file)
    }
  }

  const removeImage = () => {
    setNewPostImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl h-[90vh] flex flex-col">
        {/* Enhanced backdrop with multiple layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-cyan-500/20 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>

        {/* Fixed Header */}
        <div className="relative flex-shrink-0 p-6 lg:p-8 pb-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Camera className="w-6 h-6 text-white drop-shadow-sm" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">Create Group Post</h3>
                <p className="text-white/60 text-sm">Share with {groupTitle}</p>
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
            {/* Post Content */}
            <div className="space-y-3">
              <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span>What would you like to share with the group?</span>
              </label>
              <div className="relative">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share your thoughts, updates, or questions with the group..."
                  className="w-full h-32 lg:h-36 bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 resize-none text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                  maxLength={5000}
                />
                <div className="absolute bottom-4 right-4 text-xs text-white/50">
                  {newPostContent.length}/5000
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
              <label className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2">
                <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                <span>Media</span>
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <label htmlFor="group-image-upload" className="sr-only">Upload image</label>
                <input
                  id="group-image-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  onClick={handleImageClick}
                  title="Add Image or GIF"
                  className="flex items-center px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl text-white transition-all duration-300 hover:scale-105 text-sm lg:text-base font-medium"
                >
                  <ImageIcon className="w-5 h-5 mr-3" />
                  Add Image or GIF
                </button>
              </div>
            </div>

            {/* Image Preview */}
            {newPostImage && (
              <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-sm font-semibold">Selected Image:</span>
                  <button
                    onClick={removeImage}
                    title="Remove image"
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <ImageIcon className="w-7 h-7 text-white/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{newPostImage.name}</p>
                    <p className="text-white/60 text-xs">
                      {(newPostImage.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-sm font-semibold">Uploading image...</span>
                  <span className="text-white/70 text-sm">{progress}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                    // eslint-disable-next-line react/forbid-dom-props
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
              </div>
            )}

            {/* Connection Status */}
            {!isConnected && (
              <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300">
                <p className="text-red-300 text-sm font-medium">You are currently offline. Post will be created when connection is restored.</p>
              </div>
            )}

            {/* Group Info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Posting to {groupTitle}</p>
                  <p className="text-white/60 text-xs">All group members will be able to see this post</p>
                </div>
              </div>
            </div>
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
              onClick={handleCreatePost}
              disabled={isLoading || isUploading || !isConnected || !newPostContent.trim()}
              className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-white font-semibold text-sm lg:text-base transition-all duration-300 hover:scale-105 shadow-lg ${isLoading || isUploading || !isConnected || !newPostContent.trim()
                  ? 'bg-white/20 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:via-teal-700 hover:to-cyan-700 shadow-emerald-500/25'
                }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Post...</span>
                </div>
              ) : isUploading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Share with Group</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}