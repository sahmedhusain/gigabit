'use client'
import React, { useState, useEffect } from 'react'
import { X, Users, Lock, Globe, Loader2, Edit, Image as ImageIcon, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { api } from '@/lib/api'
import { useUpload } from '@/hooks'
import { useToast } from '@/context/ToastContext'

interface Group {
  id: number
  title: string
  description: string
  is_private: boolean
  avatar?: string
  member_count?: number
}

interface GroupEditModalProps {
  show: boolean
  onClose: () => void
  group: Group | null
  onUpdateSuccess?: () => void
}

export default function GroupEditModal({
  show,
  onClose,
  group,
  onUpdateSuccess
}: GroupEditModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const { uploadImage } = useUpload()
  const { success, error: toastError } = useToast()

  useEffect(() => {
    if (group && show) {
      setTitle(group.title)
      setDescription(group.description || '')
      setIsPrivate(group.is_private)
      setAvatar(null)
      setAvatarPreview(group.avatar || null)
      setRemoveAvatar(false)
    }
  }, [group, show])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatar(file)
      setRemoveAvatar(false)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatar(null)
    setAvatarPreview(null)
    setRemoveAvatar(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !group) return

    setIsUpdating(true)
    try {
      // Upload avatar if changed
      let avatarFilename: string | null = null
      if (avatar) {
        const uploadResult = await uploadImage(avatar)
        avatarFilename = uploadResult.filename
      } else if (removeAvatar) {
        avatarFilename = null
      }

      // Update group info
      await api.updateGroup(group.id, {
        title: title.trim(),
        description: description.trim(),
        avatar: avatarFilename
      })

      // Update privacy if changed
      const currentPrivacy = group.is_private ? 'private' : 'public'
      const newPrivacy = isPrivate ? 'private' : 'public'
      if (currentPrivacy !== newPrivacy) {
        await api.updateGroupPrivacy(group.id, newPrivacy)
      }

      success('Group updated!')
      onUpdateSuccess?.()
      onClose()
    } catch (err: unknown) {
      console.error('Failed to update group:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update group'
      toastError(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!group) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="relative w-full max-w-lg max-h-[70vh] bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Header */}
            <motion.div
              className="relative p-4 lg:p-6 pb-3 bg-gradient-to-r from-white/10 to-white/5 border-b border-white/20"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Edit className="w-6 h-6 text-white drop-shadow-sm" />
                    </div>
                    <motion.div
                      className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                  <div>
                    <motion.h3
                      className="text-xl lg:text-2xl font-bold text-white mb-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      Edit Group Settings
                    </motion.h3>
                    <motion.p
                      className="text-white/60 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      Update your group information and settings
                    </motion.p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="group p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                  title="Close"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                </motion.button>
              </div>

              {/* Group Info Summary */}
              <motion.div
                className="bg-white/5 border border-white/20 rounded-xl p-4 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{group.title}</p>
                      <p className="text-white/60 text-xs">
                        {group.member_count || 0} {group.member_count === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {group.is_private ? (
                      <>
                        <Lock className="w-4 h-4 text-orange-400" />
                        <span className="text-orange-400 text-xs font-medium">Private</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 text-xs font-medium">Public</span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Form Content */}
            <motion.form
              onSubmit={handleSubmit}
              className="relative p-4 lg:p-6 space-y-4 overflow-y-auto flex-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {/* Avatar Upload */}
              <motion.div
                className="flex flex-col items-center space-y-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg">
                    {avatarPreview ? (
                      <Image
                        src={avatarPreview}
                        alt="Group avatar preview"
                        width={96}
                        height={96}
                        unoptimized={true}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-8 h-8 text-white drop-shadow-sm" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 flex space-x-1">
                    <label
                      htmlFor="avatar-upload"
                      className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center cursor-pointer hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg"
                      title="Change avatar"
                    >
                      <ImageIcon className="w-4 h-4 text-white" />
                    </label>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center cursor-pointer hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg"
                        title="Remove avatar"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    title="Upload group avatar"
                  />
                </div>
                <p className="text-white/60 text-sm text-center">
                  {avatarPreview ? 'Click to change or remove avatar' : 'Click to upload a group avatar'}
                </p>
              </motion.div>

              {/* Group Title */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <label className="block text-white font-medium mb-2 text-sm">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-300"
                  required
                />
              </motion.div>

              {/* Group Description */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <label className="block text-white font-medium mb-2 text-sm">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your group..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-300 resize-none"
                />
              </motion.div>

              {/* Privacy Setting */}
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                <label className="block text-white font-medium text-sm">
                  Privacy Settings
                </label>
                <div className="space-y-3">
                  <motion.div
                    onClick={() => setIsPrivate(false)}
                    className={`flex items-center space-x-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      !isPrivate
                        ? 'bg-emerald-500/20 border-emerald-400/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      !isPrivate ? 'border-emerald-400 bg-emerald-400' : 'border-white/40'
                    }`}>
                      {!isPrivate && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <p className="text-white font-medium text-sm">Public Group</p>
                      </div>
                      <p className="text-white/60 text-xs mt-1">
                        Anyone can find and join this group
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    onClick={() => setIsPrivate(true)}
                    className={`flex items-center space-x-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isPrivate
                        ? 'bg-emerald-500/20 border-emerald-400/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isPrivate ? 'border-emerald-400 bg-emerald-400' : 'border-white/40'
                    }`}>
                      {isPrivate && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Lock className="w-4 h-4 text-orange-400" />
                        <p className="text-white font-medium text-sm">Private Group</p>
                      </div>
                      <p className="text-white/60 text-xs mt-1">
                        Only invited members can join this group
                      </p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.form>

            {/* Footer */}
            <motion.div
              className="relative p-4 lg:p-6 pt-3 bg-gradient-to-r from-white/5 to-white/10 border-t border-white/20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
            >
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 border border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isUpdating || !title.trim()}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white font-semibold text-sm lg:text-base transition-all duration-300 shadow-lg flex items-center justify-center space-x-2 ${
                    isUpdating || !title.trim()
                      ? 'bg-white/20 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
                  }`}
                  whileHover={{ scale: (isUpdating || !title.trim()) ? 1 : 1.05 }}
                  whileTap={{ scale: (isUpdating || !title.trim()) ? 1 : 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" />
                      <span>Update Group</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}