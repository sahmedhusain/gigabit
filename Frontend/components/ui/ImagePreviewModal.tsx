'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react'
import Image from 'next/image'
import { createPortal } from 'react-dom'

interface ImagePreviewModalProps {
  isOpen: boolean
  imageUrl: string | null
  alt?: string
  onClose: () => void
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  imageUrl,
  alt = 'Image preview',
  onClose
}) => {
  console.log('🎬 ImagePreviewModal: Component called with props:', { isOpen, imageUrl, alt })

  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: 0, y: 0 })

  // Reset zoom and position when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setPosition({ x: 0, y: 0 })
    }
  }, [isOpen])

  // Debug effect to track modal state changes
  useEffect(() => {
    console.log('🔄 ImagePreviewModal: useEffect triggered - isOpen changed to:', isOpen, 'imageUrl:', imageUrl)
  }, [isOpen, imageUrl])

  // Handle zoom in
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }

  // Handle zoom out
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25))
  }

  // Handle reset zoom
  const handleResetZoom = () => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }

  // Handle mouse wheel zoom
  const handleWheelZoom = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  // Handle download
  const handleDownload = async () => {
    if (!imageUrl) return

    try {
      // Fetch the image as a blob
      const response = await fetch(imageUrl, {
        credentials: 'include' // Include cookies for authentication
      })

      if (!response.ok) {
        throw new Error('Failed to fetch image')
      }

      const blob = await response.blob()

      // Create a blob URL for download
      const blobUrl = URL.createObjectURL(blob)

      // Create download link
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `image-${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback to direct download
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `image-${Date.now()}.jpg`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Handle double click to reset zoom
  const handleDoubleClick = () => {
    handleResetZoom()
  }

    if (!isOpen || !imageUrl) {
    console.log('❌ ImagePreviewModal: Not rendering because isOpen is false or imageUrl is null:', { isOpen, imageUrl })
    return null
  }

  console.log('✅ ImagePreviewModal: Rendering modal content for:', { isOpen, imageUrl })

  const modalContent = (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center"
        style={{ zIndex: 999999 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      >
        {/* Control Bar */}
        <motion.div
          className="absolute top-20 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black/50 backdrop-blur-xl rounded-2xl p-3 border border-white/20"
          style={{ zIndex: 1000000 }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
            className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleResetZoom(); }}
            className="px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105 text-sm font-medium"
            title="Reset Zoom"
          >
            100%
          </button>
          <span className="text-white text-sm font-medium min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
            className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <div className="w-px h-8 bg-white/20 mx-2"></div>
          <button
            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
            className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105"
            title="Download Image"
          >
            <Download className="w-5 h-5" />
          </button>
          <div className="w-px h-8 bg-white/20 mx-2"></div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Image Container */}
        <motion.div
          className="relative w-full h-full max-w-[90vw] max-h-[calc(100vh-200px)] flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
        >
          <div
            className={`transition-transform duration-300 ${isDragging ? '' : 'ease-out'}`}
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              transformOrigin: 'center center'
            }}
          >
            <Image
              src={imageUrl}
              alt={alt}
              width={800}
              height={600}
              unoptimized={true}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl select-none"
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={handleDoubleClick}
              onWheel={handleWheelZoom}
              draggable={false}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  // Use portal to render at document body level
  if (typeof document !== 'undefined') {
    console.log('🚪 ImagePreviewModal: About to create portal with modalContent:', !!modalContent, 'document.body exists:', !!document.body)
    return createPortal(modalContent, document.body)
  }

  // Fallback for SSR
  console.log('🔄 ImagePreviewModal: Using SSR fallback')
  return modalContent
}

export default ImagePreviewModal