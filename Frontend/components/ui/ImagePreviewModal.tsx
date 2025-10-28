'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import { ImagePreviewModalProps } from '@/types/ui'

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  imageUrl,
  alt = 'Image preview',
  onClose
}) => {

  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: 0, y: 0 })

  
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setPosition({ x: 0, y: 0 })
    }
  }, [isOpen])

  
  useEffect(() => {
  }, [isOpen, imageUrl])

  
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }

  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25))
  }

  
  const handleResetZoom = () => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }

  
  const handleWheelZoom = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  
  const handleDownload = async () => {
    if (!imageUrl) return

    try {
      
      const response = await fetch(imageUrl, {
        credentials: 'include' 
      })

      if (!response.ok) {
        throw new Error('Failed to fetch image')
      }

      const blob = await response.blob()

      
      const blobUrl = URL.createObjectURL(blob)

      
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `image-${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Download failed:', error)
      
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `image-${Date.now()}.jpg`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  
  const handleDoubleClick = () => {
    handleResetZoom()
  }

    if (!isOpen || !imageUrl) {
    return null
  }


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

  
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  
  return modalContent
}

export default ImagePreviewModal