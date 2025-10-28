import { ReactNode } from 'react';
import { User as UserType } from '@/lib/api';
import type { GroupMemberStatus } from '@/lib/api';


export interface AppLayoutProps {
  children: ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  feedSubTab?: string;
  setFeedSubTab?: (tab: string) => void;
  activitySubTab?: string;
  setActivitySubTab?: (tab: string) => void;
  chatSubTab?: string;
  setChatSubTab?: (tab: string) => void;
  eventsSubTab?: string;
  setEventsSubTab?: (tab: string) => void;
  tempPostSubTab?: string;
  onTempPostClose?: () => void;
}


export interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  feedSubTab: string;
  setFeedSubTab: (subTab: string) => void;
  activitySubTab: string;
  setActivitySubTab: (subTab: string) => void;
  chatSubTab: string;
  setChatSubTab: (subTab: string) => void;
  eventsSubTab: string;
  setEventsSubTab: (subTab: string) => void;
  tempPostSubTab?: string;
  onTempPostClose?: () => void;
  chatUnreadAll?: number;
  chatUnreadDirect?: number;
  chatUnreadGroups?: number;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  color: string;
  count?: number | string;
  onClick: () => void;
  isActive: boolean;
  isTemp?: boolean;
  onClose?: () => void;
}

export interface MenuSection {
  id: 'chats' | 'feed' | 'activity' | 'events';
  title: string;
  icon: React.ReactNode;
  description: string;
  items: MenuItem[];
}


export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  nickname?: string;
  is_private?: boolean;
}

export interface FollowRequest {
  id: number;
  sender: User;
  created_at: string;
}

export interface GroupInvitation {
  id: number;
  group: {
    id: number;
    title: string;
    avatar?: string;
  };
  inviter: User;
  created_at: string;
}

export interface RightSidebarProps {
  followRequests: FollowRequest[];
  groupInvitations: GroupInvitation[];
  onAcceptFollow: (requestId: number) => void;
  onDeclineFollow: (requestId: number) => void;
  onAcceptGroupInvite: (invitationId: number) => void;
  onDeclineGroupInvite: (invitationId: number) => void;
  onUserClick: (userId: number) => void;
  onGroupClick: (groupId: number) => void;
}

export interface StatusOption {
  value: 'online' | 'busy' | 'away' | 'invisible';
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}


export interface UserWithFollowStatus extends UserType {
  is_following?: boolean;
  is_followed_by?: boolean;
}

export interface UsersSidebarProps {
  users: UserWithFollowStatus[];
  title: string;
  onUserClick: (userId: number) => void;
  onFollowToggle: (userId: number) => void;
  loading?: boolean;
}


export interface TopBarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  activeTab: string;
  onNotificationsClick: () => void;
  unreadCount: number;
  onDiscoverClick: () => void;
  isMobileRightSidebarOpen: boolean;
  setIsMobileRightSidebarOpen: (open: boolean) => void;
}

export interface SearchSuggestion {
  type: 'user' | 'event' | 'group' | 'post' | 'tag' | 'message' | 'chat';
  id: number | string;
  title: string;
  subtitle: string;
  image?: string;
  description?: string;
  url: string;
  metadata?: Record<string, unknown>;
}

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount: number;
}