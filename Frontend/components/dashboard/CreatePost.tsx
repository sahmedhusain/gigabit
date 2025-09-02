'use client'
import { X, Camera, Image as ImageIcon, Globe, Users, Lock, User } from 'lucide-react'
import { CategoryResponse, CreatePostRequest, api } from '@/lib/api'
import { ChangeEvent, useRef, useState } from 'react'

interface CreatePostProps {
  show: boolean
  onClose: () => void
  newPostContent: string
  setNewPostContent: (content: string) => void
  newPostImage: File | null
  setNewPostImage: (image: File | null) => void
  postPrivacy: string
  setPostPrivacy: (privacy: string) => void
  selectedUsers: number[]
  setSelectedUsers: (users: number[]) => void
  selectedPostCategory: number
  setSelectedPostCategory: (categoryId: number) => void
  categories: CategoryResponse[]
  availableUsers: any[]
  loadingUsers: boolean
  onCreatePost: () => void
}



export default function CreatePost({
  show,
  onClose,
  newPostContent,
  setNewPostContent,
  newPostImage,
  setNewPostImage,
  postPrivacy,
  setPostPrivacy,
  selectedUsers,
  setSelectedUsers,
  selectedPostCategory,
  setSelectedPostCategory,
  categories,
  availableUsers,
  loadingUsers,
  onCreatePost
}: CreatePostProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string>('')

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }
  
  // selects image
  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setNewPostImage(file)
      setUploadError('') // Clear any previous error
    }
  }

  // remove selected image
  const removeImage = () => {
    setNewPostImage(null)
    setUploadError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch ('/api/uploads', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload image")
      }

      const data = await response.json()
      return data.filename
    } catch (error) {
      console.error("Image upload error:", error)
      setUploadError(error instanceof Error ? error.message : "Failed to upload image")
      return null
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 shadow-2xl"></div>
        
        <div className="relative p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h3 className="text-lg lg:text-xl font-semibold text-white">Create New Post</h3>
            <button
              onClick={onClose}
              title="Close"
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full h-24 lg:h-32 bg-white/10 border border-white/20 rounded-xl lg:rounded-2xl p-3 lg:p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 resize-none text-sm lg:text-base"
                maxLength={5000}
              />
              <div className="absolute bottom-3 right-3 text-xs text-white/50">
                {newPostContent.length}/5000
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <label htmlFor="image-upload" className="sr-only">Upload image</label>
              <input
              id="image-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              onClick={handleImageClick}
              title="Add Image or GIF"
              className="flex items-center px-3 lg:px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all duration-200 text-sm lg:text-base"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
                  Add Image or GIF
              </button>
            </div>

            {/* Image Preview */}
            {newPostImage && (
              <div className="relative">
                <div className="bg-white/10 border border-white/20 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-medium">Selected Image:</span>
                    <button 
                      onClick={removeImage}
                      title="Remove image"
                      className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-white/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{newPostImage.name}</p>
                      <p className="text-white/60 text-xs">
                        {(newPostImage.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Error Display */}
            {uploadError && (
              <div className="bg-red-500/10 border border-red-400/20 rounded-xl p-3">
                <p className="text-red-400 text-sm">{uploadError}</p>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-white font-medium text-sm lg:text-base">Category:</label>
              <select
                value={selectedPostCategory}
                onChange={(e) => setSelectedPostCategory(parseInt(e.target.value))}
                aria-label="Select post category"
                className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id} className="text-black">
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-white font-medium text-sm lg:text-base">Privacy Settings:</label>
              <div className="space-y-2">
                {[
                  { value: 'public', icon: Globe, label: 'Public', desc: 'Anyone can see this post' },
                  { value: 'followers', icon: Users, label: 'Followers Only', desc: 'Only your followers can see this' },
                  { value: 'private', icon: Lock, label: 'Selected Followers', desc: 'Choose specific followers' }
                ].map((option) => (
                  <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="privacy"
                      value={option.value}
                      checked={postPrivacy === option.value}
                      onChange={(e) => setPostPrivacy(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex-shrink-0 ${
                      postPrivacy === option.value ? 'border-emerald-400 bg-emerald-400' : 'border-white/40'
                    }`}></div>
                    <option.icon className="w-4 h-4 text-white/70 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-white font-medium text-sm lg:text-base">{option.label}</div>
                      <div className="text-white/60 text-xs lg:text-sm">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            {postPrivacy === 'private' && (
              <div className="bg-white/5 rounded-xl lg:rounded-2xl p-3 lg:p-4">
                <label className="text-white font-medium mb-2 block text-sm lg:text-base">Select Users:</label>
                <div className="space-y-2 max-h-24 lg:max-h-32 overflow-y-auto">
                  {loadingUsers ? (
                    <div className="text-white/60 text-sm text-center py-4">
                      Loading users...
                    </div>
                  ) : availableUsers.length === 0 ? (
                    <div className="text-white/60 text-sm text-center py-4">
                      No users available
                    </div>
                  ) : (
                    availableUsers.map((user) => (
                      <label key={user.id} className="flex items-center space-x-3 cursor-pointer hover:bg-white/5 rounded-lg p-2 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id])
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                            }
                          }}
                          className="rounded border-white/30 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {user.display_name || `${user.first_name} ${user.last_name}`}
                          </p>
                          <p className="text-white/60 text-xs truncate">
                            @{user.nickname || user.email.split('@')[0]}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                {selectedUsers.length > 0 && (
                  <div className="mt-3 p-2 bg-emerald-500/10 rounded-lg border border-emerald-400/20">
                    <p className="text-emerald-300 text-sm">
                      {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 lg:px-6 py-2 border border-white/30 rounded-xl text-white hover:bg-white/10 transition-all duration-200 text-sm lg:text-base"
              >
                Cancel
              </button>
              <button 
                onClick={onCreatePost}
                className="w-full sm:w-auto px-4 lg:px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm lg:text-base"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
