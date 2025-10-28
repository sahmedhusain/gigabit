import { User } from './auth-data';
import { GroupResponse } from './group-data';

export interface Notification {
  id: number;
  type: string;
  user: string;
  message: string;
  time: string;
  isRead: boolean;
}

export interface NotificationResponse {
  id: number;
  type: string;
  message: string;
  actor: User;
  is_read: boolean;
  created_at: string;
  redirect_url?: string;
  redirect_type?: string;
  group?: GroupResponse;
}

export interface NotificationSettings {
  id: number;
  user_id: number;
  sound_enabled: boolean;
  sound_theme: string;
  browser_push_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  muted_conversations: Array<{id: number, type: 'private' | 'group'}>;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettingsRequest {
  sound_enabled: boolean;
  sound_theme: string;
  browser_push_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  muted_conversations: Array<{id: number, type: 'private' | 'group'}>;
}