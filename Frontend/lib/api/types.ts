import { ChatItem } from '../../types/chat';

// API configuration and utilities
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Re-export ChatItem for convenience
export type { ChatItem };

// Auth interfaces
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nickname?: string;
  aboutMe?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  avatar: string;
  nickname: string;
  about_me: string;
  gender: string;
  is_private: boolean;
  status: string;
  last_status_change: string;
  created_at: string;
  updated_at: string;
  gender_privacy: string;
  birthday_privacy: string;
  is_deleted?: boolean;
}

// Post interfaces
export interface Bookmark {
  id: number;
  post_id: number;
  user_id: number;
  created_at: string;
  // additional fields may be present
  [key: string]: unknown;
}

export interface Post {
  id: number;
  user: {
    id: number;
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  timeAgo: string;
  privacy: string;
  isLiked: boolean;
  isBookmarked?: boolean;
  created_at: string;
}

export interface APIPost {
  id: number;
  user_id: number;
  content: string;
  image_url?: string;
  privacy: string;
  created_at: string;
  updated_at: string;
  user: User;
  like_count: number;
  comment_count: number;
  share_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  specific_user_ids?: number[];
  comments?: Comment[];
}

export interface Comment {
  id: number;
  user_id: number;
  post_id: number;
  content: string;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
  user: User;
}

export interface PostResponse {
  id: number;
  content: string;
  image_url?: string;
  privacy: string;
  user: User;
  like_count: number;
  dislike_count: number;
  comment_count: number;
  share_count: number;
  is_liked: boolean;
  is_disliked: boolean;
  is_bookmarked: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePostRequest {
  content: string;
  privacy?: 'public' | 'followers' | 'friends' | 'listed';
  image_url?: string;
  specific_user_ids?: number[];
}

export interface UpdatePostRequest {
  content?: string;
  image_url?: string;
  privacy?: 'public' | 'followers' | 'friends' | 'listed';
  specific_user_ids?: number[];
}

export interface PostsResponse {
  posts: APIPost[];
}

// Group interfaces
export interface Member {
  id: number;
  user: User;
  role?: string;
  joined_at?: string;
  [key: string]: unknown;
}

export type GroupMemberStatus = 'member' | 'sent' | 'requested' | 'rejected' | 'none'

export interface Group {
  id: number;
  name: string;
  description: string;
  members: number;
  isJoined: boolean;
  lastActivity: string;
  timestamp?: string; // Add timestamp for sorting
  privacy?: 'public' | 'private';
  memberStatus?: GroupMemberStatus;
  role?: 'admin' | 'member';
}

export interface GroupResponse {
  id: number;
  title: string;
  description: string;
  privacy: 'public' | 'private';
  create_posts: 'all_members' | 'admins_only';
  create_polls: 'all_members' | 'admins_only';
  create_events: 'all_members' | 'admins_only';
  send_messages: 'all_members' | 'admins_only';
  avatar?: string;
  creator_id: number;
  member_count: number;
  is_member: boolean;
  member_status?: GroupMemberStatus;
  role?: 'admin' | 'member' | 'creator';
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar?: string;
    nickname?: string;
  };
  members?: Array<{
    id: number;
    user: {
      id: number;
      first_name: string;
      last_name: string;
      avatar?: string;
      nickname?: string;
    };
    role: string;
    joined_at: string;
  }>;
}

export interface CreateGroupRequest {
  title: string;
  description?: string;
  privacy: 'public' | 'private';
  create_posts: 'all_members' | 'admins_only';
  create_polls: 'all_members' | 'admins_only';
  create_events: 'all_members' | 'admins_only';
  send_messages: 'all_members' | 'admins_only';
  invite_members?: number[];
  avatar?: string;
}

export interface GroupInvitationItem {
  id: number;
  group: GroupResponse;
  inviter: User;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

// Event interfaces
export interface Event {
  id: number
  group_id: number
  creator_id: number
  title: string
  description: string
  location?: string
  event_time: string
  created_at: string
  updated_at: string
  canceled: boolean
  cancel_reason: string | null
  creator: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    avatar: string
  }
  group: {
    id: number
    title: string
  }
  going_count: number
  not_going_count: number
  user_response: string
  responses?: Array<{
    id: number
    event_id: number
    user: {
      id: number
      username: string
      email: string
      first_name: string
      last_name: string
      avatar: string
    }
    option: string
    created_at: string
  }>
}

export interface EventResponse {
  id: number
  group_id: number
  creator_id: number
  title: string
  description: string
  location?: string
  event_time: string
  created_at: string
  updated_at: string
  canceled: boolean
  cancel_reason: string | null
  creator: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    avatar: string
  }
  group: {
    id: number
    title: string
  }
  going_count: number
  not_going_count: number
  user_response: string
  responses?: Array<{
    id: number
    event_id: number
    user: {
      id: number
      username: string
      email: string
      first_name: string
      last_name: string
      avatar: string
    }
    option: string
    created_at: string
  }>
}

export interface CreateEventRequest {
  title: string;
  description: string;
  location?: string;
  event_time: string; // ISO string format
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  location?: string;
  event_time?: string; // ISO string format
}

export interface CancelEventRequest {
  cancel_reason: string;
}

export interface EventResponseDetail {
  id: number;
  event_id: number;
  user: User;
  option: 'going' | 'not_going';
  created_at: string;
}

export interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  timestamp?: string; // Add timestamp for sorting
  unread: number;
  isOnline: boolean;
  isGroup: boolean;
  type: 'private' | 'group';
  participantId?: number;
  participantAvatar?: string; // Add participant avatar
  groupId?: number; // Add group ID for group chats
}

// Poll interfaces
export interface PollOption {
  id: number;
  option_text: string;
  option_order: number;
  vote_count: number;
  percentage: number;
  voters: string[];
  total_voters: number;
}

export interface PollResponse {
  id: number;
  user_id: number;
  group_id?: number;
  title: string;
  description?: string;
  allow_multiple_choices: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  creator: User;
  options: PollOption[];
  total_votes: number;
  user_voted: boolean;
  user_votes: number[]; // Option IDs user voted for
  is_expired: boolean;
}

export interface CreatePollRequest {
  group_id?: number;
  title: string;
  description?: string;
  options: string[];
  allow_multiple_choices: boolean;
  expires_at?: string;
}

export interface VotePollRequest {
  option_ids: number[];
}

// Message/Chat interfaces
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

export interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  timestamp?: string; // Add timestamp for sorting
  unread: number;
  isOnline: boolean;
  isGroup: boolean;
  type: 'private' | 'group';
  participantId?: number;
  participantAvatar?: string; // Add participant avatar
  groupId?: number; // Add group ID for group chats
}

export interface ConversationResponse {
  id: number;
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

// Notification interfaces
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

// Follow interfaces
export interface FollowRequestItem {
  request_id: number;
  user: {
    id: number;
    first_name?: string;
    last_name?: string;
    avatar?: string;
    nickname?: string;
  };
  requested_at: string;
  [key: string]: unknown;
}

// Error types
export interface APIError {
  error: string;
  code?: string;
  details?: unknown;
  status?: number;
}

export class NetworkError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message)
    this.name = 'AuthenticationError'
  }
}