'use client'
import React from 'react'
import { Image as ImageIcon, ZoomIn } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface ImageMessageProps {
  message: {
    id: number
    content: string
    created_at: string
  }
  isCurrentUser: boolean
  createdAt: string
  onImageClick: (imageUrl: string) => void
  canDelete?: boolean
  onDeleteClick?: (messageId: number, event: React.MouseEvent) => void
}


const parseDate = (value: string | number | undefined | null): Date => {
  if (!value && value !== 0) return new Date(0)
  const raw = typeof value === 'number' ? value : String(value).trim()

  
  if (/^\d+$/.test(String(raw))) {
    const n = Number(raw)
    
    const asMs = new Date(n)
    if (asMs.getFullYear() >= 2000) return asMs

    
    const asSeconds = new Date(n * 1000)
    if (asSeconds.getFullYear() >= 2000) return asSeconds

    
    const asMicros = new Date(Math.floor(n / 1000))
    if (asMicros.getFullYear() >= 2000) return asMicros

    
    if (asSeconds.getTime() !== 0) return asSeconds
    
    console.warn('parseDate: suspicious numeric date value', value, '->', asMs)
    return asMs
  }

  
  const d = new Date(String(raw))
  if (isNaN(d.getTime())) {
    
    console.warn('parseDate: failed to parse date', value)
    return new Date(0)
  }
  return d
}


const ImageMessage: React.FC<ImageMessageProps> = ({ message, isCurrentUser, createdAt, onImageClick, canDelete = false, onDeleteClick }) => {
  const formatMessageTime = (dateString: string) => {
    const date = parseDate(dateString)
    if (isNaN(date.getTime()) || date.getTime() === 0) return ''
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const imageUrl = message.content.startsWith('http')
    ? message.content
    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${message.content}`

  return (
    <div className={`w-full max-w-md ${isCurrentUser ? 'ml-auto' : 'mr-auto'}`}>
      {/* Image Header */}
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
          <ImageIcon className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="text-xs font-medium text-white/70">
          Shared an image
        </span>
        <span className="text-xs text-white/50">·</span>
        <span className="text-xs text-white/60">
          {formatMessageTime(createdAt)}
        </span>
      </div>

      {/* Image Content Container */}
      <motion.div
        className={`relative rounded-xl p-4 border transition-all duration-300 hover:shadow-lg cursor-pointer bg-gradient-to-br from-white/10 to-white/5 border-white/20 hover:from-white/15 hover:to-white/10 ${
          isCurrentUser ? 'rounded-br-lg' : 'rounded-bl-lg'
        }`}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => {
          e.stopPropagation()
          onImageClick(imageUrl)
        }}
      >
        {/* Message menu button - positioned outside container in top right */}
        {isCurrentUser && canDelete && onDeleteClick && (
          <motion.button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDeleteClick(message.id, e)
            }}
            className="absolute -top-4 -right-1 z-20 p-2 text-white/70 hover:text-white transition-all duration-200 rounded-full hover:bg-white/10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Message options"
          >
            <div className="flex space-x-0.5">
              <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
            </div>
          </motion.button>
        )}
        {/* Message tail */}
        <div className={`absolute bottom-0 ${
          isCurrentUser
            ? '-right-2 border-l-emerald-400 border-l-8 border-t-8 border-t-transparent border-b-8 border-b-transparent'
            : '-left-2 border-r-white/20 border-r-8 border-t-8 border-t-transparent border-b-8 border-b-transparent'
        }`}></div>

        {/* Image */}
        <motion.div
          className="relative rounded-lg overflow-hidden bg-gradient-to-br from-white/10 to-white/5 max-w-xs"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Image
            src={imageUrl}
            alt="Shared image"
            width={400}
            height={300}
            unoptimized={true}
            className="w-full h-auto max-h-96 object-cover rounded-lg hover:brightness-110 transition-all duration-200"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-lg cursor-pointer pointer-events-none hover:pointer-events-auto"
               onClick={(e) => {
                 e.stopPropagation()
                 onImageClick(imageUrl)
               }}>
            <div className="bg-black/50 backdrop-blur-sm rounded-full p-2">
              <ZoomIn className="w-4 h-4 text-white" />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default ImageMessage