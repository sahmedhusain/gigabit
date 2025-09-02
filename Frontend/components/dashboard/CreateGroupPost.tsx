'use client'

import React, { useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

type Props = {
  groupId: string
  onCreated?: () => void
}

export default function CreateGroupPost({ groupId, onCreated }: Props) {
  const { user } = useAuth()
  const toast = useToast()
  const router = useRouter()

  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

    setLoading(true)

    try {
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

      setContent('')
      setImage(null)
      toast.success('Post created')
      onCreated?.()
      // refresh current route so feed updates
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Unknown error')
      toast.error(err.message || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  // Hide component if no user (protect on client-side)
  if (!user) return null

  return (
    <form onSubmit={handleSubmit} className="create-group-post">
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
          disabled={loading}
          className="ml-auto px-4 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post'}
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
