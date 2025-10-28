export interface ToastNotification {
  id: number
  type: 'like' | 'comment' | 'follow' | 'message' | 'group' | 'event' | 'general'
  title: string
  message: string
  avatar?: string
  actorName?: string
  link?: string
  timestamp: number
}

export interface NotificationToastProps {
  notification: ToastNotification
  onClose: (id: number) => void
  duration?: number
}

export interface NotificationFilters {
  type: 'all' | 'social' | 'groups' | 'events' | 'posts' | 'messages' | 'polls'
  sortBy: 'newest' | 'oldest'
}

export interface NotificationSettings {
  sound_enabled: boolean;
  sound_theme: 'classic' | 'soft' | 'modern';
  browser_push_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  muted_conversations: Array<{id: number, type: 'private' | 'group'}>;
}