import { User } from '@/lib/api';

export interface ChatItem {
  id: string;
  type: 'private' | 'group';
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime: string;
  hasUnread: boolean;
  unreadCount: number;
  isOnline?: boolean;
  participants?: User[];
}
