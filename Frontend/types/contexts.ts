import { ReactNode } from 'react';
import { User } from './auth';
import { ToastNotification } from './notifications';


export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nickname?: string;
  aboutMe?: string;
  avatar?: string;
}

export interface AuthProviderProps {
  children: ReactNode;
}


export interface NotificationToastContextType {
  notifications: ToastNotification[];
  addNotification: (notification: Omit<ToastNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: number) => void;
  clearAll: () => void;
}


export interface SidebarData {
  followers: { id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; }[];
  following: { id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; }[];
  chats: any[];
  groups: any[];
  isLoadingChats: boolean;
  isLoadingGroups: boolean;
  refetchFollowers: () => void;
  refetchChats: () => void;
  refetchGroups: () => void;
}


export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
}

export interface ToastProviderProps {
  children: React.ReactNode;
}


export interface WebSocketMessage {
  type: 'private_message' | 'group_message' | 'notification' | 'user_status' | 'typing' |
        'post_update' | 'comment_update' | 'like_update' | 'like' | 'follow_update' |
        'follow' | 'unfollow' | 'follow_request' | 'cancel_follow_request' | 'follow_status' |
        'group_update' | 'event_update' | 'category_update' | 'follower_count_update' |
        'poll_update' | 'poll_vote_update' | 'layout_sync' | 'ping' | 'pong' | 'error' |
        'message_deleted' | 'shared_post' | 'image_shared';
  from?: number;
  to?: number;
  group_id?: number;
  GroupID?: number;
  post_id?: number;
  event_id?: number;
  EventID?: number;
  poll_id?: number;
  PollID?: number;
  content?: string;
  action?: string;
  data?: any;
  message_id?: string;
  timestamp: number;
}

export interface OnlineUser {
  user_id: number;
  username: string;
  status: 'online' | 'busy' | 'away' | 'invisible' | 'offline';
  last_status_change?: string;
}

export interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  onlineUsers: OnlineUser[];
  sendMessage: (message: Omit<WebSocketMessage, 'timestamp'>) => void;
  addMessageListener: (callback: (message: WebSocketMessage) => void) => () => void;
}

export interface WebSocketProviderProps {
  children: React.ReactNode;
}