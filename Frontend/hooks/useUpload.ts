'use client'
import { useCallback, useMemo, useRef, useState } from 'react'
import { API_BASE_URL, getToken } from '@/lib/api'
import { UploadResult, UseUploadOptions } from '@/types/hooks'

export function useUpload(options: UseUploadOptions = {}) {
  const { maxSizeMB = 10, allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'] } = options
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const xhrRef = useRef<XMLHttpRequest | null>(null)

  const validate = useCallback((file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`File is too large. Max ${maxSizeMB}MB`)
    }
    if (allowedMimeTypes.length && !allowedMimeTypes.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}`)
    }
  }, [maxSizeMB, allowedMimeTypes])

  const buildImageUrl = useCallback((filename: string) => {
    
    return `${API_BASE_URL}/api/images/${encodeURIComponent(filename)}`
  }, [])

  const abort = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort()
    }
  }, [])

  const uploadImage = useCallback(async (file: File): Promise<UploadResult> => {
    setIsUploading(true)
    setError(null)
    setProgress(0)
    try {
      validate(file)

      const form = new FormData()
      form.append('image', file)

      const token = getToken()
      const url = `${API_BASE_URL}/api/uploads`
      
      const result: UploadResult = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhrRef.current = xhr
        xhr.open('POST', url)
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        }
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            setProgress(Math.round((evt.loaded / evt.total) * 100))
          }
        }
        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            try {
              const status = xhr.status
              const payload = JSON.parse(xhr.responseText || '{}')
              if (status >= 200 && status < 300) {
                const filename = payload.filename
                resolve({
                  filename,
                  url: buildImageUrl(filename),
                  size: payload.size,
                  mime_type: payload.mime_type
                })
              } else {
                reject(new Error(payload.error || `Upload failed (${status})`))
              }
            } catch (e: any) {
              reject(new Error(e?.message || 'Upload failed'))
            }
          }
        }
        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.onabort = () => reject(new Error('Upload aborted'))
        xhr.send(form)
      })

      return result
    } catch (e: any) {
      const msg = e?.message || 'Upload failed'
      setError(msg)
      throw e
    } finally {
      setIsUploading(false)
      setTimeout(() => setProgress(0), 500)
      xhrRef.current = null
    }
  }, [validate, buildImageUrl])

  return useMemo(() => ({ isUploading, error, progress, uploadImage, abort, buildImageUrl }), [isUploading, error, progress, uploadImage, abort, buildImageUrl])
}
