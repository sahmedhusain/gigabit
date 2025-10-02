'use client'

import React, { useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useOptimisticUpdate, useConnectionStatus, useUpload } from '@/hooks'
import { api } from '@/lib/api'

type Props = {
  groupId: string
  onCreated?: () => void
}

export default function CreateGroupPost({ groupId, onCreated }: Props) {
  const { user } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const { isConnected } = useConnectionStatus()
  const { progress, isUploading, uploadImage } = useUpload()

  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const { isLoading, performUpdate } = useOptimisticUpdate({
    onSuccess: () => {
      toast.success('Group post created successfully!')
      setContent('')
      setImage(null)
      setError(null)
      onCreated?.()
    },
    onError: (error: any) => {
      toast.error(`Failed to create post: ${error.message}`)
    }
  })

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0]
    if (file) setImage(file)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!content.trim() && !image) {
      setError('Post must contain text or an image.')
      return
    }

    if (!isConnected) {
      toast.error('Cannot create post while offline')
      return
    }

    performUpdate(
      (current) => ({ ...current, isCreating: true }),
      async () => {
        let imageUrl = ''
        
        // Upload image if present
        if (image) {
          try {
            const uploadResult = await uploadImage(image)
            imageUrl = uploadResult.url
          } catch (error) {
            throw new Error('Failed to upload image')
          }
        }

        // Create the group post
        await api.createGroupPost(parseInt(groupId), {
          content,
          image_url: imageUrl
        })

        return {}
      }
    )
  }

  // Hide component if no user (protect on client-side)
  if (!user) return null

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Connection Status */}
        {!isConnected && (
          <div className="p-3 bg-red-500/10 border border-red-400/20 rounded-xl text-red-400 text-sm">
            You're offline. Post will be created when connection is restored.
          </div>
        )}
        
        {/* Upload Progress */}
        {isUploading && (
          <div className="p-3 bg-blue-500/10 border border-blue-400/20 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-400 text-sm">Uploading image...</span>
              <span className="text-blue-400 text-sm">{progress}%</span>
            </div>
            <div className="w-full bg-blue-200/20 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        )}
        
        <div>
          <label htmlFor="post-content" className="sr-only">Write a post</label>
          <textarea
            id="post-content"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Share something with the group..."
            rows={4}
            className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 resize-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <input
              id="post-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <label 
              htmlFor="post-image" 
              className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white cursor-pointer transition-all duration-200"
            >
              📎 Attach Image
            </label>

            {image && (
              <span className="text-white/70 text-sm">
                {image.name}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || isUploading || !isConnected}
            className={`px-6 py-2 rounded-xl text-white font-medium transition-all duration-200 ${
              isLoading || isUploading || !isConnected
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {isLoading ? 'Posting...' : isUploading ? 'Uploading...' : !isConnected ? 'Offline' : 'Post'}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-400/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}
      </form>
    </div>
  )
}
