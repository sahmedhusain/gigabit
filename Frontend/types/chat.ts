import { User, GroupResponse, ConversationSearchResult, ConversationResponse, PostResponse, EventResponse, Member } from "@/lib/api";
import { LucideIcon } from 'lucide-react';
import { TypingUser } from '@/types//hooks';

export interface ChatItem {
  id: number;
  type: "private" | "group";
  name?: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageType?: string;
  lastMessageTime?: string;
  lastMessageStatus?: "sending" | "sent" | "delivered" | "read";
  lastMessageSenderId?: number;
  hasUnread?: boolean;
  unreadCount?: number;
  unread_count: number;
  has_unread?: boolean;
  isOnline?: boolean;
  isTyping?: boolean;
  typingUsers?: string[];
  participants?: User[];
  participant?: User;
  group?: GroupResponse;
  groupStatus?: GroupResponse["member_status"];
  groupPrivacy?: GroupResponse["privacy"];
  groupRole?: GroupResponse["role"];
  conversationId?: number;
  participantId?: number;
  groupId?: number;
  updated_at: string;
  joinedAt?: string;
  timestamp?: string;
}


export interface MessageMenuProps {
  isOpen: boolean;
  messageId: number | null;
  x: number;
  y: number;
  onClose: () => void;
  onDeleteClick: () => void;
}


export interface FilterTab {
  key: string;
  label: string;
  icon: LucideIcon;
  count: number;
}

export interface ChatHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
  searchPlaceholder: string;
  filters: FilterTab[];
  showNewChat: boolean;
  showNewGroup: boolean;
  newChatLabel: string;
  newGroupLabel: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchMode: 'normal' | 'messages';
  setSearchMode: (mode: 'normal' | 'messages') => void;
  filterType: 'all' | 'unread' | 'online';
  setFilterType: (type: 'all' | 'unread' | 'online') => void;
  searchResults: ConversationSearchResult[];
  onCreateDirectMessage: () => void;
  onCreateGroup: () => void;
}


export interface Follower {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  nickname?: string;
}

export interface CreateDirectMessageProps {
  show: boolean;
  onClose: () => void;
  followings: Follower[];
  conversations: ConversationResponse[];
  onStartChat: (followerId: number) => void;
  isLoading: boolean;
  getUserStatus: (userId: number) => string;
}


export interface ChatItemMenuProps {
  isOpen: boolean;
  position: { top: number; left: number };
  openingUpward: boolean;
  hasUnread: boolean;
  isMuted: boolean;
  isGroup: boolean;
  showAdminSettings: boolean;
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
  onToggleMute: () => void;
  onShowProfile?: () => void;
  onShowInfo?: () => void;
  onShowSettings?: () => void;
  onLeaveGroup?: () => void;
  onDeleteChat?: () => void;
}


export interface DeleteChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}


export interface PrivateChatHeaderProps {
  conversationType: 'private' | 'group';
  participantId?: number;
  participantData: User | null;
  participantName: string;
  isConnected: boolean;
  typingUsers: TypingUser[];
  getParticipantStatus: () => string;
  formatLastOnlineTime: (lastStatusChange: string | number | undefined | null) => string;
  hideHeader?: boolean;
  onClose?: () => void;
}

export interface GroupChatHeaderProps {
  participantName: string;
  groupData: GroupResponse | null;
  getOnlineGroupMembersCount: () => number;
  typingUsers: TypingUser[];
  hideHeader?: boolean;
  onClose?: () => void;
  onInfoClick: () => void;
}


export interface EmojiData {
  emoji: string;
  names: string[];
  activeSkinTone: string;
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
      is_private?: boolean;
    };
    like_count: number;
    comment_count: number;
    share_count: number;
  };
}

export interface ChatWindowProps {
  conversationId: number;
  conversationType: 'private' | 'group';
  chatType?: 'group' | 'private';
  participantName: string;
  participantId?: number;
  groupId?: number;
  onConversationResolved?: (conversationId: number) => void;
  onClose?: () => void;
  hideHeader?: boolean;
  initialTab?: string;
  highlightMessageId?: number;
  highlightPollId?: number;
}


export interface SearchResultsProps {
  searchResults: ConversationSearchResult[];
  onChatClick: (chat: { conversationId: number; type: 'private' | 'group'; name: string; participantId?: number; groupId?: number; initialTab?: string; highlightMessageId?: number; highlightPollId?: number }) => void;
  currentUser: User | null;
}

export interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchMode: 'normal' | 'messages';
  setSearchMode: (mode: 'normal' | 'messages') => void;
  placeholder: string;
}


export interface ChatsSectionProps {
  chatSubTab: string;
  onChatClick: (chat: { conversationId: number; type: 'private' | 'group'; name: string; participantId?: number; groupId?: number; initialTab?: string; highlightMessageId?: number; highlightPollId?: number }) => void;
  getUserStatus: (userId: number) => string;
  currentUser: User | null;
  showCreateGroup: boolean;
  setShowCreateDirectMessage: (show: boolean) => void;
  setShowCreateGroup: (show: boolean) => void;
}


export interface ChatInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  isConnected: boolean;
  isUploadingImage: boolean;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onTyping: () => void;
  onEmojiClick: (emojiData: EmojiData) => void;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  participantData?: {
    first_name: string;
    last_name: string;
    avatar?: string;
  };
}
