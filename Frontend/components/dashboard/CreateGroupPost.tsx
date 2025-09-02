'use client'

import React, { useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useOptimisticUpdate, useConnectionStatus, useUpload } from '@/hooks'

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
        const formData = new FormData()
        formData.append('content', content)
        if (image) formData.append('image', image)

        const res = await fetch(`/api/groups/${groupId}/posts`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          const msg = body?.error || `Failed to create post (${res.status})`
          throw new Error(msg)
        }

        // refresh current route so feed updates
        router.refresh()
        return {}
      }
    )
  }

  // Hide component if no user (protect on client-side)
  if (!user) return null

  return (
    <form onSubmit={handleSubmit} className="create-group-post">
      {/* Connection Status */}
      {!isConnected && (
        <div className="mb-2 p-2 bg-red-500/10 border border-red-400/20 rounded text-red-400 text-sm">
          You're offline. Post will be created when connection is restored.
        </div>
      )}
      
      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-2 p-2 bg-blue-500/10 border border-blue-400/20 rounded">
          <div className="flex items-center justify-between mb-1">
            <span className="text-blue-400 text-sm">Uploading image...</span>
            <span className="text-blue-400 text-sm">{progress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
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
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mt-2 flex items-center gap-2">
        <input
          id="post-image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        <label htmlFor="post-image" className="inline-block px-3 py-1 border rounded cursor-pointer">
          Attach image
        </label>

        <button
          type="submit"
          disabled={isLoading || isUploading || !isConnected}
          className={`ml-auto px-4 py-1 rounded text-white transition-colors ${
            isLoading || isUploading || !isConnected
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Posting...' : isUploading ? 'Uploading...' : !isConnected ? 'Offline' : 'Post'}
        </button>
      </div>

      {image && (
        <div className="mt-2 text-sm">
          Selected: {image.name}
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </form>
  )
}
