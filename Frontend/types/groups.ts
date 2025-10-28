import { Event, type Notification as NotificationType, User, GroupResponse } from '@/lib/api'
import type { Message } from '@/types/hooks'

export interface CommunitySectionProps {
  notifications: NotificationType[]
  isLoadingNotifications: boolean
  setShowCreateEvent: (show: boolean) => void
  communitySubTab: string
  eventsSubTab?: string
  events?: Event[]
  eventsLoading: boolean
  respondToEvent: (eventId: number, option: 'going' | 'not_going') => Promise<{ message: string; response: string; removed: boolean }>
  updateEvent: (eventId: number, eventData: { title?: string; description?: string; event_time?: string }) => Promise<{ message: string }>
  cancelEvent: (eventId: number, cancelReason: string) => Promise<{ message: string }>
  deleteEvent: (eventId: number) => Promise<{ message: string }>
  highlightedEventId?: number | null
}

export interface CreateGroupProps {
  show: boolean
  onClose: () => void
  onGroupCreated?: () => void
}

export interface CreateGroupEventProps {
  show: boolean
  onClose: () => void
  groupId: number
  groupTitle: string
  onEventCreated?: () => void
}

export interface CreateGroupPostProps {
  show: boolean
  onClose: () => void
  groupId: number
  groupTitle: string
  onPostCreated?: () => void
}

export interface GroupChatProps {
  groupId: number
  groupTitle: string
}

export interface GroupChatTabProps {
  conversationId: number
  groupId?: number
  onConversationResolved?: (conversationId: number) => void
  highlightMessageId?: number
}

export interface EmojiData {
  emoji: string
  names: string[]
  activeSkinTone: string
}

export interface ImageMessageProps {
  message: Message
  isCurrentUser: boolean
  createdAt: string
  onImageClick: (imageUrl: string) => void
  canDelete?: boolean
  onDeleteClick?: (messageId: number, event: React.MouseEvent) => void
}

export interface GroupPollsTabProps {
  groupId: number
  highlightPollId?: number
}

export interface GroupEventsTabProps {
  groupId: number
  groupTitle: string
}

export interface GroupInfoTabProps {
  groupId: number
  onLeaveGroup?: (groupId: number) => void
  onManageAdmins?: () => void
  onClose?: () => void
}

export interface GroupPostsTabProps {
  groupId: number
  groupTitle: string
}

export interface GroupMembersTabProps {
  groupId: number
}

export interface GroupSettingsTabProps {
  groupId: number
}

export interface EventListProps {
  events: Event[]
  eventsLoading: boolean
  sortBy: 'newest' | 'oldest'
  hideEndedEvents: boolean
  eventsSubTab: string
  highlightedEventId?: number
  respondingToEvent: number | null
  user: User | null
  groupRoles: { [groupId: number]: { role: string; is_admin_or_creator: boolean } }
  dropdownOpen: number | null
  onDropdownToggle: (eventId: number) => void
  onEditEvent: (event: Event) => void
  onCancelEvent: (event: Event) => void
  onDeleteEvent: (event: Event) => void
  onEventResponse: (eventId: number, option: 'going' | 'not_going') => void
  formatDate: (dateString: string) => string
  formatTime: (dateString: string) => string
  formatTimeAgo: (dateString: string) => string
  formatCancellationReason: (reason: string) => string
  isEventEnded: (event: Event) => boolean
}

export interface EventCardProps {
  event: Event
  isHighlighted: boolean
  respondingToEvent: number | null
  user: User | null
  groupRoles: { [groupId: number]: { role: string; is_admin_or_creator: boolean } }
  dropdownOpen: number | null
  onDropdownToggle: (eventId: number) => void
  onEditEvent: (event: Event) => void
  onCancelEvent: (event: Event) => void
  onDeleteEvent: (event: Event) => void
  onEventResponse: (eventId: number, option: 'going' | 'not_going') => void
  formatDate: (dateString: string) => string
  formatTime: (dateString: string) => string
  formatTimeAgo: (dateString: string) => string
  formatCancellationReason: (reason: string) => string
  isEventEnded: (event: Event) => boolean
}

export interface EventModalsProps {
  onCancelEvent: (eventId: number, reason: string) => Promise<void>
  onDeleteEvent: (eventId: number) => Promise<void>
  onEditEvent: (eventId: number, data: { event_time: string; location: string }) => Promise<void>
}

export interface EventModalsRef {
  openCancelModal: (event: Event) => void
  openDeleteModal: (event: Event) => void
  openEditModal: (event: Event) => void
}

export interface ActivityHistoryProps {
  notifications: NotificationType[]
  isLoadingNotifications: boolean
}

export interface CommunityHeaderProps {
  communitySubTab: string
  eventsSubTab: string
  sortBy: 'newest' | 'oldest'
  hideEndedEvents: boolean
  onSortChange: (sort: 'newest' | 'oldest') => void
  onHideEndedToggle: () => void
  onCreateEvent: () => void
}

export interface MessageListProps {
  messages: Message[]
  currentUserId: number
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onDeleteClick: (messageId: number, event: React.MouseEvent) => void
  onImageClick: (imageUrl: string) => void
  formatDateSeparator: (dateString: string | number) => string
  formatTime: (dateString: string | number) => string
  parseDate: (value: string | number | undefined | null) => Date
  unreadCount: number
  lastReadMessageId: number | null
  isGroupChat: boolean
  canDeleteMessage: (message: Message) => boolean
}

export interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
  showAvatar: boolean;
  showSenderName: boolean;
  showDateSeparator: boolean;
  isFirstUnreadMessage: boolean;
  unreadCount: number;
  canDelete: boolean;
  onDeleteClick: (messageId: number, event: React.MouseEvent) => void;
  onImageClick: (imageUrl: string) => void;
  formatDateSeparator: (dateString: string | number) => string;
  formatTime: (dateString: string | number) => string;
  parseDate: (value: string | number | undefined | null) => Date;
}

export interface MessageInputProps {
  newMessage: string
  setNewMessage: (message: string) => void
  onSendMessage: () => void
  onTyping: () => void
  onImageSelect: (file: File) => void
  isUploadingImage: boolean
  canSendMessages: boolean
  isConnected: boolean
}

export interface LoadMoreButtonProps {
  onClick: () => void
}

export interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export interface MessageMenuProps {
  isOpen: boolean
  x: number
  y: number
  onClose: () => void
  onDelete: () => void
}

export interface GroupRemoveModalProps {
  isOpen: boolean
  onClose: () => void
  pendingAction: {
    type: 'remove'
    memberName: string
  } | null
  onConfirm: () => void
}

export interface GroupCreateModalProps {
  show: boolean
  onClose: () => void
  onCreateGroup: (groupData: {
    title: string
    description: string
    is_private: boolean
    avatar?: File
  }) => void
  isCreating: boolean
}

export interface GroupPrivacyTabProps {
  isAdmin: boolean
  groupInfo: GroupResponse | null
  onUpdatePrivacy: (privacy: 'public' | 'private') => void
  onUpdatePermissions: (permissions: {
    create_posts: 'all_members' | 'admins_only'
    create_polls: 'all_members' | 'admins_only'
    create_events: 'all_members' | 'admins_only'
    send_messages: 'all_members' | 'admins_only'
  }) => void
}

export interface GroupDeleteModalProps {
  show: boolean
  onClose: () => void
  groupTitle: string
  memberCount: number
  onDeleteGroup: () => void
  isDeleting: boolean
}

export interface GroupSettingsTabsProps {
  activeTab: 'members' | 'privacy' | 'requests' | 'danger'
  isAdmin: boolean
  receivedRequestsCount: number
  onTabChange: (tab: 'members' | 'privacy' | 'requests' | 'danger') => void
}

export interface GroupInviteModalProps {
  show: boolean
  onClose: () => void
  groupTitle: string
  allUsers: User[]
  filteredUsers: User[]
  searchTerm: string
  selectedUsers: number[]
  isInviting: boolean
  isLoading?: boolean
  onSearchUsers: (term: string) => void
  onUserSelect: (userId: number) => void
  onInviteUsers: () => void
}