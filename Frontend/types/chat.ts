import { User, GroupResponse } from '@/lib/api';

export interface ChatItem {
  id: number;
  type: 'private' | 'group';
  name?: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageStatus?: 'sending' | 'sent' | 'delivered' | 'read';
  lastMessageSenderId?: number;
  hasUnread?: boolean;
  unreadCount?: number;
  unread_count: number;
  has_unread?: boolean; // manually marked as unread (conversation-level flag)
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
  groupId?: number; // Add group ID for group chats
  updated_at: string;
}
