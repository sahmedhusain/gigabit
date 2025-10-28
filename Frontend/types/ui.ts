import { ReactNode } from 'react'


export type Theme = 'light' | 'dark'

export interface BackgroundThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export interface BackgroundThemeProviderProps {
  children: ReactNode
}


export interface CookiesPopupProps {
  isOpen: boolean
  onClose: () => void
}


export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

export interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}


export interface ErrorPageProps {
  errorCode: number
  title?: string
  message?: string
  showBackButton?: boolean
  showHomeButton?: boolean
  onRetry?: () => void
}


export interface ImagePreviewModalProps {
  isOpen: boolean
  imageUrl: string | null
  alt?: string
  onClose: () => void
}


export interface PrivacyPopupProps {
  isOpen: boolean
  onClose: () => void
}


export interface SharePopupProps {
  postId: number
  isOpen: boolean
  onClose: () => void
  onShareSuccess?: () => void
}

export interface ChatItem {
  id: number | string
  type: 'private' | 'group' | 'following'
  name?: string
  avatar?: string | null
  lastMessage?: string
  lastMessageTime?: string
  timestamp?: string
  unread?: number
  isGroup?: boolean
  participantId?: number
  lastMessageSenderId?: number
  groupStatus?: string
  groupPrivacy?: string
  groupRole?: string
  groupId?: number
}


export interface SupportPopupProps {
  isOpen: boolean
  onClose: () => void
}


export interface TermsPopupProps {
  isOpen: boolean
  onClose: () => void
}


export interface ThemeProviderProps {
  children: ReactNode
}