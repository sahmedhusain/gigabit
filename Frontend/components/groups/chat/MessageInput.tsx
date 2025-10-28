'use client'
import React, { useRef, useState } from 'react'
import { Send, Smile, Image as ImageIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import EmojiPicker from 'emoji-picker-react'
import { EmojiData } from '@/types/groups'
import { MessageInputProps } from '@/types/groups'

export default function MessageInput({
  newMessage,
  setNewMessage,
  onSendMessage,
  onTyping,
  onImageSelect,
  isUploadingImage,
  canSendMessages,
  isConnected
}: MessageInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSendMessage()
    }
  }

  const handleEmojiClick = (emojiData: EmojiData) => {
    setNewMessage(newMessage + emojiData.emoji)
    setShowEmojiPicker(false)
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    onImageSelect(file)

    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!canSendMessages) {
    return (
      <div className="p-4 flex-shrink-0 relative">
        <div className="flex items-center justify-center relative z-10">
          <div className="text-white/60 text-sm bg-white/5 border border-white/10 rounded-lg px-4 py-2">
            Only admins and creators can send messages
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 flex-shrink-0 relative">
      <div className="flex items-center justify-center space-x-4 relative z-10 min-h-[48px]">
        <div className="flex-1 relative">
          <textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
              onTyping()
            }}
            onKeyPress={handleKeyPress}
            placeholder="Message the group..."
            className="w-full bg-gradient-to-r from-white/15 to-white/10 border border-white/25 rounded-2xl px-6 py-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/50 resize-none min-h-[52px] max-h-32 text-sm overflow-y-auto scrollbar-hide transition-all duration-300 hover:bg-gradient-to-r hover:from-white/20 hover:to-white/15"
            rows={1}
          />
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
          aria-label="Upload image"
        />

        {/* Emoji Picker Button */}
        <motion.button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-3 text-white/60 hover:text-white hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-orange-500/20 rounded-xl border border-white/20 hover:border-yellow-400/30 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-yellow-500/20"
          title="Add emoji"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Smile className="w-4 h-4" />
        </motion.button>

        {/* Image Upload Button */}
        <motion.button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingImage}
          className="p-3 text-white/60 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 rounded-xl border border-white/20 hover:border-blue-400/30 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Upload image"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isUploadingImage ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <ImageIcon className="w-4 h-4" />
          )}
        </motion.button>

        <motion.button
          onClick={onSendMessage}
          disabled={!newMessage.trim() || !isConnected}
          className="p-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 rounded-xl text-white hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-xl hover:shadow-emerald-500/30 border border-emerald-400/30 disabled:border-white/20"
          title="Send message"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            className="absolute bottom-full left-6 mb-8 z-50"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl ring-1 ring-white/20 overflow-hidden">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                searchPlaceHolder="Search emojis..."
                width={350}
                height={400}
                previewConfig={{
                  showPreview: false
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {newMessage.length > 0 && (
          <motion.div
            className="text-xs text-white/50 mt-3 text-right"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            Press Enter to send • Shift+Enter for new line
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}