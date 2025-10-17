'use client'
import Image from 'next/image'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { X, Users, Globe, Lock, Search, Loader2, Check } from 'lucide-react'
import { CreateGroupRequest, api, User, API_BASE_URL } from '@/lib/api'
import { v4 as uuidv4 } from 'uuid'
import { useConnectionStatus, useUpload } from '@/hooks'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public')
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedMembers, setSelectedMembers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isFetchingUsers, setIsFetchingUsers] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const { success, error: showError } = useToast()
  const { isConnected } = useConnectionStatus()
  const { user: currentUser } = useAuth()
  const currentUserId = currentUser?.id ?? null

  const { uploadImage, isUploading: isUploadingAvatar } = useUpload()

  // Handle avatar file selection and preview
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setAvatarFile(file)
    if (file) {
      setAvatarPreview(URL.createObjectURL(file))
    } else {
      setAvatarPreview(null)
    }
  }

  const [isCreating, setIsCreating] = useState(false)

  const formatUserName = useCallback((user: User) => {
    const nameParts = [user.first_name, user.last_name].filter(Boolean)
    if (nameParts.length) {
      return nameParts.join(' ')
    }
    if (user.nickname) {
      return user.nickname
    }
    return user.email
  }, [])

  const getUserInitials = useCallback((user: User) => {
    const initials = [user.first_name, user.last_name]
      .filter(Boolean)
      .map((part) => part.charAt(0)?.toUpperCase() ?? '')
      .join('')
    if (initials) {
      return initials
    }
    if (user.nickname) {
      return user.nickname.slice(0, 2).toUpperCase()
    }
    return user.email.slice(0, 2).toUpperCase()
  }, [])

  useEffect(() => {
    if (!show) return

    let isMounted = true

    const loadUsers = async () => {
      setIsFetchingUsers(true)
      try {
        const { users } = await api.getUsers()
        if (!isMounted) return
        const filteredUsers = currentUserId
          ? users.filter((user) => user.id !== currentUserId)
          : users
        setAvailableUsers(filteredUsers)
      } catch (err) {
        if (!isMounted) return
        console.error('Failed to load users for group invites', err)
        showError('Unable to fetch members to invite right now.')
      } finally {
        if (isMounted) {
          setIsFetchingUsers(false)
        }
      }
    }

    loadUsers()

    return () => {
      isMounted = false
    }
  }, [show, currentUserId, showError])

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const baseList = availableUsers.filter((user) => {
      if (currentUserId && user.id === currentUserId) return false
      return true
    })

    if (!query) {
      return baseList.sort((a, b) => formatUserName(a).localeCompare(formatUserName(b)))
    }

    return baseList
      .filter((user) => {
        const searchable = [
          user.first_name,
          user.last_name,
          user.nickname,
          user.email
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return searchable.includes(query)
      })
      .sort((a, b) => formatUserName(a).localeCompare(formatUserName(b)))
  }, [availableUsers, currentUserId, searchQuery, formatUserName])

  const displayedUsers = useMemo(() => filteredUsers.slice(0, 30), [filteredUsers])

  const handleToggleMember = useCallback((user: User) => {
    setSelectedMembers((prev) => {
      const exists = prev.some((member) => member.id === user.id)
      if (exists) {
        return prev.filter((member) => member.id !== user.id)
      }
      return [...prev, user]
    })
  }, [])

  const handleRemoveMember = useCallback((userId: number) => {
    setSelectedMembers((prev) => prev.filter((member) => member.id !== userId))
  }, [])

  const inviteMemberIds = useMemo(
    () => selectedMembers.map((member) => member.id),
    [selectedMembers]
  )

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
    setIsCreating(true)

    let avatar = avatarUrl
    if (avatarFile && !avatarUrl) {
      try {
        const result = await uploadImage(avatarFile)
        avatar = result.url
        setAvatarUrl(avatar)
      } catch (err) {
        showError('Failed to upload avatar')
        setIsCreating(false)
        return
      }
    }

    const groupData: CreateGroupRequest = {
      title: groupTitle.trim(),
      description: groupDescription.trim(),
      privacy,
      invite_members: inviteMemberIds.length ? inviteMemberIds : undefined,
      avatar: avatar || undefined
    }

    try {
      await api.createGroup(groupData)
      
      // Success: reset form, close popup, show success
      setGroupTitle('')
      setGroupDescription('')
      setPrivacy('public')
      setSelectedMembers([])
      setSearchQuery('')
      setError('')
      onGroupCreated?.()
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      showError(`Failed to create group: ${message}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCreateGroup()
    }
  }

  if (!show) return null

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
            className="relative w-full max-w-2xl h-[80vh] flex flex-col bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Header */}
            <motion.div
              className="relative flex-shrink-0 p-6 lg:p-8 pb-4 bg-gradient-to-r from-white/10 to-white/5 border-b border-white/20"
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
                      <Users className="w-6 h-6 text-white drop-shadow-sm" />
                    </div>
                    <motion.div
                      className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                    />
                  </motion.div>
                  <div>
                    <motion.h3
                      className="text-xl lg:text-2xl font-bold text-white mb-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      Create New Group
                    </motion.h3>
                    <motion.p
                      className="text-white/60 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      Build a community around shared interests
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
            </motion.div>

            {/* Scrollable Content Area */}
            <motion.div
              className="relative flex-1 overflow-y-auto px-6 lg:px-8 py-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="space-y-6">
                {/* Group Avatar Upload */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                >
                  <motion.label
                    className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span>Group Avatar</span>
                  </motion.label>
                  <div className="flex items-center space-x-4">
                    <label className="relative cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                        disabled={isUploadingAvatar}
                      />
                      <div className="w-16 h-16 rounded-2xl border border-white/20 bg-white/10 flex items-center justify-center overflow-hidden">
                        {avatarPreview ? (
                          <Image src={avatarPreview} alt="Avatar Preview" width={64} height={64} className="object-cover w-16 h-16" />
                        ) : (
                          <Users className="w-8 h-8 text-white/40" />
                        )}
                        {isUploadingAvatar && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <span className="block mt-2 text-xs text-white/60 text-center">Upload</span>
                    </label>
                    {avatarPreview && (
                      <button
                        type="button"
                        className="text-xs text-red-400 hover:underline"
                        onClick={() => { setAvatarFile(null); setAvatarPreview(null); setAvatarUrl(null); }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </motion.div>

                {/* Group Title */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <motion.label
                    className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span>Group Title *</span>
                  </motion.label>
                  <div className="relative">
                    <motion.input
                      type="text"
                      value={groupTitle}
                      onChange={(e) => setGroupTitle(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter a catchy group name..."
                      className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-300 hover:bg-white/15 text-sm lg:text-base"
                      maxLength={100}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                    />
                    <motion.div
                      className="absolute bottom-4 right-4 text-xs text-white/50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.3 }}
                    >
                      {groupTitle.length}/100
                    </motion.div>
                  </div>
                </motion.div>

                {/* Group Description */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <motion.label
                    className="text-white font-semibold text-sm lg:text-base flex items-center space-x-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                    <span>Description</span>
                  </motion.label>
                  <div className="relative">
                    <motion.textarea
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      placeholder="Describe what your group is about, its purpose, and what members can expect..."
                      className="w-full h-32 lg:h-36 bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50 resize-none text-sm lg:text-base transition-all duration-300 hover:bg-white/15"
                      maxLength={500}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6, duration: 0.3 }}
                    />
                    <motion.div
                      className="absolute bottom-4 right-4 text-xs text-white/50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7, duration: 0.3 }}
                    >
                      {groupDescription.length}/500
                    </motion.div>
                  </div>
                </motion.div>

                {/* Group Privacy */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <motion.div
                    className="flex items-center justify-between"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    <span className="text-white font-semibold text-sm lg:text-base">Privacy Settings</span>
                    <span className="text-white/50 text-xs">Choose who can discover your group</span>
                  </motion.div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.button
                      type="button"
                      onClick={() => setPrivacy('public')}
                      className={`relative w-full text-left rounded-2xl border p-5 transition-all duration-300 backdrop-blur-lg ${
                        privacy === 'public'
                          ? 'border-emerald-400/60 bg-emerald-400/10 shadow-lg shadow-emerald-500/20'
                          : 'border-white/10 bg-white/5 hover:border-emerald-400/40 hover:bg-emerald-400/5'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg">
                            <Globe className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-white font-semibold">Public Group</p>
                            <p className="text-white/60 text-sm">Anyone can find the group and request to join</p>
                          </div>
                        </div>
                        {privacy === 'public' && (
                          <motion.div
                            className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                          >
                            <Check className="w-4 h-4" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => setPrivacy('private')}
                      className={`relative w-full text-left rounded-2xl border p-5 transition-all duration-300 backdrop-blur-lg ${
                        privacy === 'private'
                          ? 'border-purple-400/60 bg-purple-400/10 shadow-lg shadow-purple-500/20'
                          : 'border-white/10 bg-white/5 hover:border-purple-400/40 hover:bg-purple-400/5'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg">
                            <Lock className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-white font-semibold">Private Group</p>
                            <p className="text-white/60 text-sm">Only invited members can join the group</p>
                          </div>
                        </div>
                        {privacy === 'private' && (
                          <motion.div
                            className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-md"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                          >
                            <Check className="w-4 h-4" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  </div>
                </motion.div>

                {/* Invite Members */}
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  <motion.div
                    className="flex items-center justify-between"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.3 }}
                  >
                    <span className="text-white font-semibold text-sm lg:text-base">Invite Members (Optional)</span>
                    <span className="text-white/50 text-xs">We&apos;ll send invitations for you</span>
                  </motion.div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                    <motion.input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, nickname, or email..."
                      className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-12 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-300 hover:bg-white/15 text-sm"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    />
                    {isFetchingUsers && (
                      <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 animate-spin" />
                    )}
                  </div>

                  <AnimatePresence>
                    {selectedMembers.length > 0 && (
                      <motion.div
                        className="flex flex-wrap gap-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                      >
                        {selectedMembers.map((member) => (
                          <motion.div
                            key={member.id}
                            className="flex items-center space-x-2 bg-emerald-400/15 border border-emerald-400/40 rounded-full px-3 py-1 text-sm text-white"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                          >
                            <span>{formatUserName(member)}</span>
                            <motion.button
                              type="button"
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-white/70 hover:text-white"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <X className="w-3 h-3" />
                            </motion.button>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3 max-h-64 overflow-y-auto space-y-2">
                    {isFetchingUsers ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
                      </div>
                    ) : displayedUsers.length === 0 ? (
                      <p className="text-white/50 text-sm text-center py-6">
                        {searchQuery.trim()
                          ? 'No users match your search yet. Try a different name or email.'
                          : 'No other users are available to invite right now.'}
                      </p>
                    ) : (
                      displayedUsers.map((user) => {
                        const isSelected = selectedMembers.some((member) => member.id === user.id)
                        return (
                          <motion.button
                            key={user.id}
                            type="button"
                            onClick={() => handleToggleMember(user)}
                            className={`w-full flex items-center justify-between rounded-2xl border p-3 transition-all duration-200 text-left ${
                              isSelected
                                ? 'border-emerald-400/60 bg-emerald-400/10 shadow-inner'
                                : 'border-white/10 bg-white/5 hover:border-emerald-400/40 hover:bg-emerald-400/5'
                            }`}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <div className="flex items-center space-x-3">
                              {user.avatar ? (
                                <Image
                                  src={user.avatar}
                                  alt={formatUserName(user)}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 rounded-xl border border-white/20 object-cover"
                                />
                              ) : (
                                <div className={`w-10 h-10 rounded-xl border border-white/10 bg-gradient-to-br ${
                                  isSelected
                                    ? 'from-emerald-500/40 to-teal-500/40'
                                    : 'from-slate-500/30 to-slate-700/30'
                                } flex items-center justify-center text-white font-semibold`}
                                >
                                  {getUserInitials(user)}
                                </div>
                              )}
                              <div>
                                <p className="text-white font-medium text-sm">{formatUserName(user)}</p>
                                <p className="text-white/50 text-xs">{user.email}</p>
                              </div>
                            </div>
                            {isSelected ? (
                              <motion.div
                                className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                              >
                                <Check className="w-4 h-4" />
                              </motion.div>
                            ) : (
                              <span className="text-white/40 text-xs">Tap to invite</span>
                            )}
                          </motion.button>
                        )
                      })
                    )}
                  </div>
                </motion.div>

                {/* Error Display */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-xl p-4"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-red-300 text-sm font-medium">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Connection Status */}
                <AnimatePresence>
                  {!isConnected && (
                    <motion.div
                      className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-xl p-4"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-red-300 text-sm font-medium">You are currently offline. Group will be created when connection is restored.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Footer */}
            <motion.div
              className="relative flex-shrink-0 p-6 lg:p-8 pt-4 bg-gradient-to-r from-white/5 to-white/10 border-t border-white/20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                <motion.button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 border border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-sm lg:text-base font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleCreateGroup}
                  disabled={isCreating || !groupTitle.trim() || !isConnected}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white font-semibold text-sm lg:text-base transition-all duration-300 shadow-lg ${
                    isCreating || !groupTitle.trim() || !isConnected
                      ? 'bg-white/20 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
                  }`}
                  whileHover={{ scale: isCreating || !groupTitle.trim() || !isConnected ? 1 : 1.05 }}
                  whileTap={{ scale: isCreating || !groupTitle.trim() || !isConnected ? 1 : 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  {isCreating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <span>Creating Group...</span>
                    </div>
                  ) : !isConnected ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                      />
                      <span>Offline</span>
                    </div>
                  ) : (
                    'Create Group'
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
