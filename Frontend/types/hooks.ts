


export interface AudioNotificationOptions {
  volume?: number;
  enabled?: boolean;
  soundUrl?: string;
  vibrationPattern?: number[];
}


export interface CacheOptions<T> {
  maxAge?: number; 
  maxSize?: number; 
  keyGenerator?: (params: any) => string;
  onCacheHit?: (key: string, data: T) => void;
  onCacheMiss?: (key: string) => void;
  onCacheInvalidate?: (key: string) => void;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}


export interface ConnectionStatus {
  isOnline: boolean;
  isConnected: boolean;
  lastConnected: Date | null;
  connectionAttempts: number;
  connectionError: string | null;
}


export interface DocumentTitleOptions {
  separator?: string;
  includeUnreadCount?: boolean;
  maxUnreadDisplay?: number;
  template?: string;
  showFavicon?: boolean;
}


export interface FeedItem {
  id: number;
  user: { name: string; username: string; avatar: string };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  timeAgo: string;
  privacy: string;
  isLiked: boolean;
}


export interface FollowerCounts {
  followers_count: number;
  following_count: number;
}


export interface InfiniteScrollOptions<T> {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => Promise<void>;
  onError?: (error: any) => void;
}


export interface LayoutSyncData {
  component: 'sidebar' | 'topbar' | 'navigation' | 'settings';
  action: 'update' | 'refresh' | 'toggle' | 'change';
  data: any;
  timestamp: number;
}


export interface NotificationSettings {
  sound_enabled: boolean
  sound_theme: 'classic' | 'soft' | 'modern'
  browser_push_enabled: boolean
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  muted_conversations: number[]
}


export interface UserStatus {
  user_id: number;
  username: string;
  status: 'online' | 'busy' | 'away' | 'invisible' | 'offline';
  last_status_change?: string;
}

export interface DatabaseUserStatus {
  user_id: number;
  status: 'online' | 'away' | 'busy' | 'invisible' | 'offline';
  last_status_change: string;
  is_online: boolean;
}


export interface PaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  maxLimit?: number;
  preloadNextPage?: boolean;
}


export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  message_type: 'text' | 'image' | 'file';
  created_at: string;
  is_read: boolean;
  sender: {
    id: number;
    first_name: string;
    last_name: string;
    avatar: string;
  };
  shared_post?: {
    id: number;
    user_id: number;
    content: string;
    image_url?: string;
    privacy: string;
    created_at: string;
    user: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      avatar?: string;
      nickname?: string;
    };
    like_count: number;
    comment_count: number;
    share_count: number;
  };
}


export interface SearchOptions<T> {
  minQueryLength?: number;
  debounceMs?: number;
  placeholder?: string;
  onSearch?: (query: string) => Promise<T[]>;
  onError?: (error: any) => void;
  onClear?: () => void;
  filterFn?: (items: T[], query: string) => T[];
}

export interface SearchResult {
  type: 'user' | 'group' | 'event' | 'post' | 'message' | 'chat' | 'tag';
  id: string | number;
  title: string;
  subtitle?: string;
  image?: string;
  description?: string;
  url: string;
  metadata?: any;
}

export interface SearchResponse {
  results: SearchResult[];
  count: number;
  query: string;
  filter?: string;
  page?: number;
  limit?: number;
}


export interface TypingUser {
  user_id: number;
  username: string;
  timestamp: number;
}

export interface TypingIndicatorOptions {
  intervalMs?: number;
  stopDelayMs?: number;
  debounceMs?: number;
  maxDisplayUsers?: number;
  includeOwnTyping?: boolean;
}


export interface UploadResult {
  filename: string;
  url: string;
  size?: number;
  mime_type?: string;
}

export interface UseUploadOptions {
  maxSizeMB?: number;
  allowedMimeTypes?: string[];
}


export interface SubscriptionOptions {
  onMessage?: (message: any) => void;
  messageTypes?: string[];
  debounceMs?: number;
  autoReconnect?: boolean;
}