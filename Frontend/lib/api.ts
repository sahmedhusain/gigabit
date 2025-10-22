import { ChatItem } from '../types/chat';
// API configuration and utilities
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
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
}

export interface Bookmark {
  id: number;
  post_id: number;
  user_id: number;
  created_at: string;
  // additional fields may be present
  [key: string]: unknown;
}

export interface Member {
  id: number;
  user: User;
  role?: string;
  joined_at?: string;
  [key: string]: unknown;
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

export interface GroupInvitationItem {
  id: number;
  group: GroupResponse;
  inviter: User;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

// Frontend-specific data structures
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

// Backend API Post interface
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

export interface Notification {
  id: number;
  type: string;
  user: string;
  message: string;
  time: string;
  isRead: boolean;
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

// API Response types
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

export interface NotificationResponse {
  id: number;
  type: string;
  message: string;
  actor: User;
  is_read: boolean;
  created_at: string;
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

export interface PostsResponse {
  posts: APIPost[];
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

// Token management
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
};

// API client class
export class ApiClient {
  private baseURL: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = getToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        }));

        // Handle specific error cases
        if (response.status === 401) {
          const code = errorData.code;
          if (code === 'TOKEN_EXPIRED' || code === 'SESSION_EXPIRED') {
            console.log('Token/session expired, logging out...');
            removeToken();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            throw new AuthenticationError('Session expired');
          }
          throw new AuthenticationError(errorData.error || 'Authentication failed');
        }

        if (response.status === 400) {
          throw new ValidationError(errorData.error || 'Validation failed', errorData.field);
        }

        if (response.status >= 500) {
          // Server errors - retry if possible
          if (retryCount < this.maxRetries && this.shouldRetry(options.method)) {
            console.log(`Retrying request (${retryCount + 1}/${this.maxRetries}) after ${this.retryDelay}ms`);
            await this.delay(this.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
            return this.request<T>(endpoint, options, retryCount + 1);
          }
          throw new NetworkError(errorData.error || 'Server error', response.status, errorData.code);
        }

        throw new NetworkError(errorData.error || `HTTP error! status: ${response.status}`, response.status, errorData.code);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        return text as unknown as T;
      }
    } catch (_error) {
      const error = _error as unknown;
      // Handle network errors
      if (error instanceof TypeError && (error as Error).message === 'Failed to fetch') {
        if (retryCount < this.maxRetries) {
          console.log(`Network error, retrying (${retryCount + 1}/${this.maxRetries}) after ${this.retryDelay}ms`);
          await this.delay(this.retryDelay * Math.pow(2, retryCount));
          return this.request<T>(endpoint, options, retryCount + 1);
        }
        throw new NetworkError('Network connection failed. Please check your internet connection.');
      }

      // Re-throw custom errors
      if ((error instanceof AuthenticationError) || (error instanceof ValidationError) || (error instanceof NetworkError)) {
        throw error as Error;
      }

      console.error('API request failed:', error);
      throw new NetworkError((error instanceof Error) ? error.message : 'Unknown error occurred');
    }
  }

  private shouldRetry(method?: string): boolean {
    // Only retry safe HTTP methods
    return !method || ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private formatTimeAgo(date: Date): string {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  // Health check with timeout
  async checkConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (_error) {
      // mark variable as used to satisfy linter
      void _error;
      return false;
    }
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/api/me', {
      method: 'GET',
    });
  }

  async logout(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/logout', {
      method: 'POST',
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health', {
      method: 'GET',
    });
  }

  // Posts endpoints
  async getFeed(limit: number = 20, offset: number = 0, filter?: string): Promise<{ posts: PostResponse[]; limit: number; offset: number }> {
    let url = `/api/feed?limit=${limit}&offset=${offset}`;
    if (filter) {
      url += `&filter=${filter}`;
    }
    return this.request<{ limit: number; offset: number; posts: PostResponse[] }>(url, {
      method: 'GET',
    });
  }

  async getAllFeed(limit: number = 20, offset: number = 0): Promise<{ posts: PostResponse[]; limit: number; offset: number }> {
    return this.getFeed(limit, offset, 'all');
  }

  async getFollowingFeed(limit: number = 20, offset: number = 0): Promise<{ posts: PostResponse[]; limit: number; offset: number }> {
    return this.getFeed(limit, offset, 'following');
  }

  async getFriendsFeed(limit: number = 20, offset: number = 0): Promise<{ posts: PostResponse[]; limit: number; offset: number }> {
    return this.getFeed(limit, offset, 'friends');
  }

  async getPosts(): Promise<PostsResponse> {
    return this.request<PostsResponse>('/api/posts', {
      method: 'GET',
    });
  }

  async getPost(id: number, sort?: 'newest' | 'oldest'): Promise<APIPost> {
    const params = new URLSearchParams();
    if (sort) {
      params.append('sort', sort);
    }
    const queryString = params.toString();
    const url = queryString ? `/api/posts/${id}?${queryString}` : `/api/posts/${id}`;
    return this.request<APIPost>(url, {
      method: 'GET',
    });
  }

  async updatePost(id: number, data: UpdatePostRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePost(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/posts/${id}`, {
      method: 'DELETE',
    });
  }

  async createPost(data: CreatePostRequest): Promise<PostResponse> {
    return this.request<PostResponse>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async likePost(postId: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async unlikePost(postId: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/posts/${postId}/like`, {
      method: 'DELETE',
    });
  }

  async dislikePost(postId: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/posts/${postId}/dislike`, {
      method: 'POST',
    });
  }

  async undislikePost(postId: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/posts/${postId}/dislike`, {
      method: 'DELETE',
    });
  }

  // Alternative like endpoint that returns detailed info
  async toggleBookmark(id: number): Promise<{ message: string; is_bookmarked: boolean }> {
    return this.request<{ message: string; is_bookmarked: boolean }>(`/api/bookmarks/${id}`, {
      method: 'POST',
    });
  }

  async unbookmarkPost(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/bookmarks/${id}`, {
      method: 'DELETE',
    });
  }

  async checkBookmarkStatus(id: number): Promise<{ is_bookmarked: boolean }> {
    return this.request<{ is_bookmarked: boolean }>(`/api/bookmarks/${id}`, {
      method: 'GET',
    });
  }

  async getUserBookmarks(limit: number = 20, offset: number = 0): Promise<{ bookmarks: Bookmark[]; count: number }> {
    return this.request<{ bookmarks: Bookmark[]; count: number }>(`/api/bookmarks?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  // Share endpoints
  async sharePost(data: { post_id: number; conversation_ids: number[]; group_ids: number[]; user_ids?: number[] }): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/share', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRecentChatsAndGroups(): Promise<{ chats: any[] }> {
    return this.request<{ chats: any[] }>('/api/share/recent', {
      method: 'GET',
    });
  }

  async searchShareableEntities(query: string): Promise<{ chats: any[] }> {
    const params = new URLSearchParams({ q: query });
    return this.request<{ chats: any[] }>(`/api/share/search?${params}`, {
      method: 'GET',
    });
  }

  // Comment endpoints
  async getPostComments(postId: number, limit: number = 20, offset: number = 0): Promise<{ comments: Comment[], count: number, post_id: number }> {
    return this.request<{ comments: Comment[], count: number, post_id: number }>(`/api/posts/${postId}/comments?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  async createComment(postId: number, data: { content: string; image_url?: string }): Promise<{ message: string; comment: Comment }> {
    return this.request<{ message: string; comment: Comment }>(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Notifications endpoints
  async getNotifications(limit: number = 20, offset: number = 0): Promise<{ data: NotificationResponse[] }> {
    return this.request<{ data: NotificationResponse[] }>(`/api/notifications?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  async getUnreadNotificationCount(): Promise<{ unread_count: number }> {
    return this.request<{ unread_count: number }>('/api/notifications/unread', {
      method: 'GET',
    });
  }

  async markNotificationAsRead(notificationIds: number[]): Promise<{ message: string; count: number }> {
    return this.request<{ message: string; count: number }>('/api/notifications/read', {
      method: 'PUT',
      body: JSON.stringify({ notification_ids: notificationIds, mark_all: false }),
    });
  }

  async markAllNotificationsAsRead(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/notifications/read', {
      method: 'PUT',
      body: JSON.stringify({ mark_all: true }),
    });
  }

  async deleteNotification(notificationId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  async deleteAllReadNotifications(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/notifications/read', {
      method: 'DELETE',
    });
  }

  // Groups endpoints
  async getUserGroups(userId: number): Promise<{ groups: GroupResponse[], count: number, limit: number, offset: number }> {
    return this.request<{ groups: GroupResponse[], count: number, limit: number, offset: number }>(`/api/groups/user/${userId}`, {
      method: 'GET',
    });
  }

  async getAllGroups(limit: number = 20, offset: number = 0): Promise<{ groups: GroupResponse[], count: number, limit: number, offset: number }> {
    const response = await this.request<{ groups: GroupResponse[], count: number, limit: number, offset: number }>(`/api/groups?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
    return response;
  }

  async getGroup(groupId: number): Promise<GroupResponse> {
    return this.request<GroupResponse>(`/api/chats?group=${groupId}`, {
      method: 'GET',
    });
  }

  async createGroup(data: CreateGroupRequest): Promise<GroupResponse> {
    return this.request<GroupResponse>('/api/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinGroup(groupId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/groups/${groupId}/join`, {
      method: 'POST',
    });
  }

  async leaveGroup(groupId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/groups/${groupId}/leave`, {
      method: 'DELETE',
    });
  }

  async inviteUserToGroup(groupId: number, userId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/groups/${groupId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async inviteUsersToGroup(groupId: number, userIds: number[]): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/groups/${groupId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ user_ids: userIds }),
    });
  }

  async acceptGroupInvitation(groupId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/groups/${groupId}/invitation`, {
      method: 'PUT',
      body: JSON.stringify({ action: 'accept' }),
    });
  }

  async declineGroupInvitation(groupId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/groups/${groupId}/invitation`, {
      method: 'PUT',
      body: JSON.stringify({ action: 'decline' }),
    });
  }

  async getGroupMembers(groupId: number): Promise<{ members: Member[]; count: number }> {
    return this.request<{ members: Member[]; count: number }>(`/api/groups/${groupId}/members`, {
      method: 'GET',
    });
  }

  async getUserRole(groupId: number): Promise<{ role: string; is_admin_or_creator: boolean }> {
    return this.request<{ role: string; is_admin_or_creator: boolean }>(`/api/groups/${groupId}/role`, {
      method: 'GET',
    });
  }

  async promoteToAdmin(groupId: number, userId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/groups/${groupId}/promote`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async demoteAdmin(groupId: number, userId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/groups/${groupId}/demote`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async kickMember(groupId: number, userId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  async updateMemberRole(groupId: number, userId: number, role: 'admin' | 'member'): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/groups/${groupId}/members/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async getNextAdmin(groupId: number): Promise<{ next_admin: string; has_admins: boolean; first_member: string }> {
    return this.request<{ next_admin: string; has_admins: boolean; first_member: string }>(`/api/groups/${groupId}/next-admin`, {
      method: 'GET',
    });
  }

  async getGroupPosts(groupId: number, limit: number = 20, offset: number = 0): Promise<{ posts: PostResponse[], count: number }> {
    return this.request<{ posts: PostResponse[], count: number }>(`/api/groups/${groupId}/posts?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

    async createGroupPost(groupId: number, data: CreatePostRequest): Promise<PostResponse> {
      const response = await this.request<{ message: string, post: PostResponse }>(`/api/groups/${groupId}/posts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
      return response.post;
  }

  async deleteGroupPost(groupId: number, postId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/groups/${groupId}/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  async createGroupEvent(groupId: number, data: { title: string; description: string; event_time: string }): Promise<EventResponse> {
    return this.request<EventResponse>(`/api/groups/${groupId}/events`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Events endpoints
  async getUserEvents(): Promise<{ events: EventResponse[], count: number, limit: number, offset: number }> {
    return this.request<{ events: EventResponse[], count: number, limit: number, offset: number }>('/api/events?limit=20&offset=0', {
      method: 'GET',
    });
  }

  async getGroupEvents(groupId: number, limit: number = 20, offset: number = 0): Promise<{ events: EventResponse[], count: number, limit: number, offset: number }> {
    return this.request<{ events: EventResponse[], count: number, limit: number, offset: number }>(`/api/groups/${groupId}/events?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  async getEvent(eventId: number): Promise<EventResponse> {
    return this.request<EventResponse>(`/api/events/${eventId}`, {
      method: 'GET',
    });
  }

  async createEvent(groupId: number, data: CreateEventRequest): Promise<{ message: string; event: EventResponse }> {
    return this.request<{ message: string; event: EventResponse }>(`/api/groups/${groupId}/events`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEvent(eventId: number, data: UpdateEventRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async cancelEvent(eventId: number, data: CancelEventRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/events/${eventId}`, {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  async respondToEvent(eventId: number, option: 'going' | 'not_going'): Promise<{ message: string; response: string; removed: boolean }> {
    return this.request<{ message: string; response: string; removed: boolean }>(`/api/events/${eventId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ option }),
    });
  }

  async getEventResponses(eventId: number): Promise<{ responses: { going: EventResponseDetail[], not_going: EventResponseDetail[] }, counts: { going: number, not_going: number, total: number } }> {
    return this.request<{ responses: { going: EventResponseDetail[], not_going: EventResponseDetail[] }, counts: { going: number, not_going: number, total: number } }>(`/api/events/${eventId}/responses`, {
      method: 'GET',
    });
  }

  // Poll endpoints
  async createPoll(data: CreatePollRequest): Promise<PollResponse> {
    return this.request<PollResponse>('/api/polls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPoll(pollId: number): Promise<PollResponse> {
    return this.request<PollResponse>(`/api/polls/${pollId}`, {
      method: 'GET',
    });
  }

  async getGroupPolls(groupId: number, limit: number = 20, offset: number = 0): Promise<PollResponse[]> {
    return this.request<PollResponse[]>(`/api/groups/${groupId}/polls?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  async votePoll(pollId: number, optionIds: number[]): Promise<PollResponse> {
    return this.request<PollResponse>(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ option_ids: optionIds }),
    });
  }

  async unvotePoll(pollId: number): Promise<PollResponse> {
    return this.request<PollResponse>(`/api/polls/${pollId}/vote`, {
      method: 'DELETE',
    });
  }

  async deletePoll(pollId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/polls/${pollId}`, {
      method: 'DELETE',
    });
  }

  async expirePoll(pollId: number): Promise<PollResponse> {
    return this.request<PollResponse>(`/api/polls/${pollId}/expire`, {
      method: 'PUT',
    });
  }

  // Messages endpoints
  async getConversations(): Promise<{ conversations: ConversationResponse[] }> {
    return this.request<{ conversations: ConversationResponse[] }>('/api/conversations', {
      method: 'GET',
    });
  }

  async getChats(): Promise<{ chats: ChatItem[] }> {
    return this.request<{ chats: ChatItem[] }>('/api/chats', {
      method: 'GET',
    });
  }

  async sendMessage(data: { receiver_id?: number; group_id?: number; content: string; message_type: 'private' | 'group'; image_url?: string }): Promise<{ message: string; data: MessageItem; conversation_id: number }> {
    return this.request<{ message: string; data: MessageItem; conversation_id: number }>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPrivateMessages(userId: number, limit: number = 50, offset: number = 0): Promise<{ messages: MessageItem[]; count: number; limit: number; offset: number }> {
    return this.request<{ messages: MessageItem[]; count: number; limit: number; offset: number }>(`/api/messages/private/${userId}?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  async getGroupMessages(groupId: number, limit: number = 50, offset: number = 0): Promise<{ messages: MessageItem[]; count: number; limit: number; offset: number }> {
    return this.request<{ messages: MessageItem[]; count: number; limit: number; offset: number }>(`/api/messages/group/${groupId}?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  async markMessagesAsRead(messageIds: number[]): Promise<{ message: string; count: number }> {
    return this.request<{ message: string; count: number }>('/api/messages/read', {
      method: 'PUT',
      body: JSON.stringify({ message_ids: messageIds }),
    });
  }

  async markMessagesAsUnread(messageIds: number[]): Promise<{ message: string; count: number }> {
    return this.request<{ message: string; count: number }>('/api/messages/unread', {
      method: 'PUT',
      body: JSON.stringify({ message_ids: messageIds }),
    });
  }

  // Conversation-level read/unread methods
  async markConversationAsRead(conversationId: number, conversationType: 'private' | 'group'): Promise<{ message: string; conversation_id: number }> {
    return this.request<{ message: string; conversation_id: number }>('/api/messages/read', {
      method: 'PUT',
      body: JSON.stringify({ 
        conversation_id: conversationId, 
        conversation_type: conversationType 
      }),
    });
  }

  async markConversationAsUnread(conversationId: number, conversationType: 'private' | 'group'): Promise<{ message: string; conversation_id: number }> {
    return this.request<{ message: string; conversation_id: number }>('/api/messages/unread', {
      method: 'PUT',
      body: JSON.stringify({ 
        conversation_id: conversationId, 
        conversation_type: conversationType 
      }),
    });
  }

  async deleteConversation(conversationId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  }

  async getConversationMessages(conversationId: number, limit: number = 50, offset: number = 0): Promise<{ messages: MessageItem[]; count: number; limit: number; offset: number }> {
    return this.request<{ messages: MessageItem[]; count: number; limit: number; offset: number }>(`/api/messages/conversation/${conversationId}?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  async searchMessages(query: string, limit: number = 20, offset: number = 0): Promise<{ results: ConversationSearchResult[]; count: number; limit: number; offset: number }> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    return this.request<{ results: ConversationSearchResult[]; count: number; limit: number; offset: number }>(`/api/messages/search?${params}`, {
      method: 'GET',
    });
  }

  // New method for getting private chat data using query parameters
  async getPrivateChat(chatId: number): Promise<{ messages: MessageItem[]; count: number; limit: number; offset: number }> {
    return this.request<{ messages: MessageItem[]; count: number; limit: number; offset: number }>(`/api/chats?chats=${chatId}`, {
      method: 'GET',
    });
  }

  // Followers endpoints
  async getFollowers(userId: number): Promise<{ followers: User[], count: number }> {
    return this.request<{ followers: User[], count: number }>(`/api/users/${userId}/followers`, {
      method: 'GET',
    });
  }

  async getFollowing(userId: number): Promise<{ following: User[], count: number }> {
    return this.request<{ following: User[], count: number }>(`/api/users/${userId}/following`, {
      method: 'GET',
    });
  }

  async sendFollowRequest(userId: number): Promise<{ message: string; status: string }> {
    return this.request<{ message: string; status: string }>(`/api/users/${userId}/follow`, {
      method: 'POST',
    });
  }

  async unfollowUser(userId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/users/${userId}/follow`, {
      method: 'DELETE',
    });
  }

  async respondToFollowRequest(userId: number, action: 'accept' | 'decline' | 'remove'): Promise<{ message: string; status: string }> {
    return this.request<{ message: string; status: string }>(`/api/users/${userId}/follow`, {
      method: 'PUT',
      body: JSON.stringify({ action }),
    });
  }

  async getFollowRequests(): Promise<{ requests: FollowRequestItem[]; count: number }> {
    return this.request<{ requests: FollowRequestItem[]; count: number }>(`/api/follow/requests`, {
      method: 'GET',
    });
  }

  async getOutgoingFollowRequests(): Promise<{ requests: FollowRequestItem[]; count: number }> {
    return this.request<{ requests: FollowRequestItem[]; count: number }>(`/api/follow/requests/outgoing`, {
      method: 'GET',
    });
  }

  async getGroupInvitations(): Promise<{ invitations: GroupInvitationItem[]; count: number }> {
    return this.request<{ invitations: GroupInvitationItem[]; count: number }>(`/api/groups/invitations`, {
      method: 'GET',
    });
  }

  async getOutgoingGroupJoinRequests(): Promise<{ requests: GroupInvitationItem[]; count: number }> {
    return this.request<{ requests: GroupInvitationItem[]; count: number }>(`/api/groups/join-requests/outgoing`, {
      method: 'GET',
    });
  }

  async getUsers(): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>('/api/users', {
      method: 'GET',
    });
  }

  async getProfile(userId: number): Promise<User> {
    return this.request<User>(`/api/profile/${userId}`, {
      method: 'GET',
    });
  }

  async getUserPosts(userId: number, limit: number = 20, offset: number = 0): Promise<{ posts: Post[], count: number, limit: number, offset: number }> {
    const response = await this.request<{ posts: PostResponse[], count: number, limit: number, offset: number }>(`/api/posts/user/${userId}?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });

    // Ensure posts is an array
    const posts = response.posts || [];

    // Transform PostResponse[] to Post[]
    const transformedPosts: Post[] = posts.map(postResponse => ({
      id: postResponse.id,
      user: {
        id: postResponse.user.id,
        name: `${postResponse.user.first_name} ${postResponse.user.last_name}`,
        username: postResponse.user.nickname || postResponse.user.email.split('@')[0],
        avatar: postResponse.user.avatar,
      },
      content: postResponse.content,
      image: postResponse.image_url,
      likes: postResponse.like_count,
      comments: postResponse.comment_count,
      shares: postResponse.share_count,
      timeAgo: this.formatTimeAgo(new Date(postResponse.created_at)),
      privacy: postResponse.privacy,
      isLiked: Boolean(postResponse.is_liked),
      isBookmarked: Boolean(postResponse.is_bookmarked),
      created_at: postResponse.created_at,
    }));

    return {
      posts: transformedPosts,
      count: response.count || 0,
      limit: response.limit || limit,
      offset: response.offset || offset,
    };
  }

  async getUserLikedPosts(limit: number = 20, offset: number = 0): Promise<{ posts: PostResponse[], count: number, limit: number, offset: number }> {
    return this.request<{ posts: PostResponse[], count: number, limit: number, offset: number }>(`/api/posts/liked?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  async getUserCommentedPosts(limit: number = 20, offset: number = 0): Promise<{ posts: PostResponse[], count: number, limit: number, offset: number }> {
    return this.request<{ posts: PostResponse[], count: number, limit: number, offset: number }>(`/api/posts/commented?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  async updateUserStatus(status: string): Promise<User> {
    return this.request<User>('/api/users/status', {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }
  async updateProfile(data: { first_name?: string; last_name?: string; email?: string; nickname?: string; date_of_birth?: string; bio?: string; avatar_url?: string; gender?: string }): Promise<User> {
    return this.request<User>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Validation endpoints for uniqueness checks
  async checkEmailUniqueness(email: string): Promise<{ available: boolean; message?: string }> {
    return this.request<{ available: boolean; message?: string }>(`/api/validation/email?email=${encodeURIComponent(email)}`, {
      method: 'GET',
    });
  }

  async checkNicknameUniqueness(nickname: string): Promise<{ available: boolean; message?: string }> {
    return this.request<{ available: boolean; message?: string }>(`/api/validation/nickname?nickname=${encodeURIComponent(nickname)}`, {
      method: 'GET',
    });
  }

  // Status endpoints
  async getMyStatus(): Promise<{ user_id: number; status: string; last_status_change: string; is_online: boolean }> {
    return this.request<{ user_id: number; status: string; last_status_change: string; is_online: boolean }>('/api/status/me', {
      method: 'GET',
    });
  }

  async updateMyStatus(status: 'online' | 'busy' | 'away' | 'invisible'): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/status/update', {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getOnlineUsers(): Promise<{ users: Array<{ user_id: number; username: string; status: string; last_status_change: string }> }> {
    return this.request<{ users: Array<{ user_id: number; username: string; status: string; last_status_change: string }> }>('/api/status/online', {
      method: 'GET',
    });
  }

  async updateUserPrivacy(userId: number, isPrivate: boolean): Promise<{ message: string; user: User }> {
    return this.request<{ message: string; user: User }>(`/api/profile/privacy`, {
      method: 'PUT',
      body: JSON.stringify({ is_private: isPrivate }),
    });
  }

  // Validation helpers
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validatePostContent(content: string): { isValid: boolean; error?: string } {
    if (!content.trim()) {
      return { isValid: false, error: 'Post content cannot be empty' };
    }
    if (content.length > 5000) {
      return { isValid: false, error: 'Post content cannot exceed 5000 characters' };
    }
    return { isValid: true };
  }

  async getPendingJoinRequests(groupId: number): Promise<{ requests: Array<{ user: User; requested_at: string }> }> {
    return this.request<{ requests: Array<{ user: User; requested_at: string }> }>(`/api/groups/${groupId}/requests`, {
      method: 'GET',
    });
  }

  async respondToJoinRequest(groupId: number, userId: number, action: 'accept' | 'decline'): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/groups/${groupId}/request/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ action }),
    });
  }

  async updateGroupPrivacy(groupId: number, privacy: 'public' | 'private'): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/groups/${groupId}/privacy`, {
      method: 'PUT',
      body: JSON.stringify({ privacy }),
    });
  }

  async updateGroupPermissions(groupId: number, permissions: { create_posts: 'all_members' | 'admins_only'; create_polls: 'all_members' | 'admins_only'; create_events: 'all_members' | 'admins_only'; send_messages: 'all_members' | 'admins_only' }): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/groups/${groupId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify(permissions),
    });
  }

  async getInvitableUsers(groupId: number, searchTerm?: string): Promise<{ users: User[]; count: number }> {
    const params = new URLSearchParams();
    if (searchTerm) {
      params.append('search', searchTerm);
    }
    const queryString = params.toString();
    const url = queryString ? `/api/users/invitable/${groupId}?${queryString}` : `/api/users/invitable/${groupId}`;
    return this.request<{ users: User[]; count: number }>(url, {
      method: 'GET',
    });
  }

  async getSentJoinRequests(groupId: number): Promise<{ requests: Member[]; count: number }> {
    return this.request<{ requests: Member[]; count: number }>(`/api/groups/${groupId}/join-requests/sent`, {
      method: 'GET',
    });
  }

  async getReceivedJoinRequests(groupId: number): Promise<{ requests: Member[]; count: number }> {
    return this.request<{ requests: Member[]; count: number }>(`/api/groups/${groupId}/join-requests/received`, {
      method: 'GET',
    });
  }

  async deleteGroupMessage(groupId: number, messageId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/groups/${groupId}/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  async updateGroup(groupId: number, data: { title?: string; description?: string; avatar?: string | null }): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGroup(groupId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/groups/${groupId}`, {
      method: 'DELETE',
    });
  }

  async getFollowStatus(userId: number): Promise<{ is_following: boolean; is_pending: boolean; is_followed_by: boolean; status: string }> {
    return this.request<{ is_following: boolean; is_pending: boolean; is_followed_by: boolean; status: string }>(`/api/users/${userId}/follow-status`, {
      method: 'GET',
    });
  }

  async cancelInvitation(groupId: number, invitationId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/groups/${groupId}/cancel-invitation/${invitationId}`, {
      method: 'DELETE',
    });
  }
}

// Create and export API client instance
export const api = new ApiClient(API_BASE_URL);
export { API_BASE_URL };

// Auth utilities
export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};

export const logoutUser = async (): Promise<void> => {
  try {
    await api.logout();
  } catch (_error) {
    console.error('Logout error:', _error);
  } finally {
    removeToken();
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
};

// Session expiration handler
export const handleSessionExpired = (): void => {
  removeToken();
  if (typeof window !== 'undefined') {
    alert('Your session has expired. Please log in again.');
    window.location.href = '/login';
  }
};
