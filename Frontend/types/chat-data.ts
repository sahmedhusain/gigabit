import { User } from './auth-data';
import { GroupResponse } from './group-data';


export interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  timestamp?: string; 
  unread: number;
  isOnline: boolean;
  isGroup: boolean;
  type: 'private' | 'group';
  participantId?: number;
  participantAvatar?: string; 
  groupId?: number; 
}

export interface MessageItem {
  id: number;
  sender: User;
  receiver_id?: number;
  group_id?: number;
  content: string;
  message_type: 'private' | 'group';
  image_url?: string;
  created_at: string;
  is_read?: boolean;
  is_deleted?: boolean;
  shared_post?: {
    id: number;
    user_id: number;
    content: string;
    image_url?: string;
    privacy: string;
    created_at: string;
    user: User;
    like_count: number;
    comment_count: number;
    share_count: number;
  };
  [key: string]: unknown;
}

export interface ConversationResponse {
  id: string | number;  // Changed to support prefixed IDs like "private_1" or numeric IDs for backward compatibility
  type: 'private' | 'group';
  participant?: User;
  group?: GroupResponse;
  last_message?: {
    content: string;
    created_at: string;
    sender_id: number;
    sender: User;
  };
  unread_count: number;
  updated_at: string;
}

export interface ConversationSearchResult {
  type: 'private' | 'group';
  conversation_id: number;
  participant_id?: number;
  group_id?: number;
  group_name?: string;
  group_avatar?: string;
  participant_name: string;
  participant_avatar?: string;
  sender_name: string;
  sender_avatar?: string;
  matching_message_id: number;
  matching_message: string;
  message_time: string;
}