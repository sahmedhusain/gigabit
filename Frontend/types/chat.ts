import { User, GroupResponse } from '@/lib/api';

export interface ChatItem {
  id: number;
  type: 'private' | 'group';
  name?: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  hasUnread?: boolean;
  unreadCount?: number;
  unread_count: number;
  isOnline?: boolean;
  isTyping?: boolean;
  typingUsers?: string[];
  participants?: User[];
  participant?: User;
  group?: GroupResponse;
  groupStatus?: GroupResponse['member_status'];
  groupPrivacy?: GroupResponse['privacy'];
  groupRole?: GroupResponse['role'];
  conversationId?: number;
  participantId?: number;
  updated_at: string;
}
