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
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

// Frontend-specific data structures
export interface Post {
  id: number;
  user: {
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
  is_liked: boolean;
  comments?: Comment[];
}

export interface Comment {
  id: number;
  user_id: number;
  post_id: number;
  content: string;
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

export interface Group {
  id: number;
  name: string;
  description: string;
  members: number;
  isJoined: boolean;
  lastActivity: string;
}

export interface Event {
  id: number
  group_id: number
  creator_id: number
  title: string
  description: string
  event_time: string
  created_at: string
  updated_at: string
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
  unread: number;
  isOnline: boolean;
  isGroup: boolean;
}

// API Response types
export interface PostResponse {
  id: number;
  content: string;
  image_url?: string;
  privacy: string;
  user: User;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
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
  creator_id: number;
  member_count: number;
  is_member: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventResponse {
  id: number
  group_id: number
  creator_id: number
  title: string
  description: string
  event_time: string
  created_at: string
  updated_at: string
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
  event_time: string; // ISO string format
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  event_time?: string; // ISO string format
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
  last_message: {
    content: string;
    created_at: string;
  };
  unread_count: number;
  updated_at: string;
}

export interface CreatePostRequest {
  content: string;
  privacy?: string;
  image_url?: string;
  specific_user_ids?: number[];
}

export interface UpdatePostRequest {
  content: string;
  image_url?: string;
}

export interface CreateGroupRequest {
  title: string;
  description: string;
}

export interface PostsResponse {
  posts: APIPost[];
}

// Error types
export interface APIError {
  error: string;
  code?: string;
  details?: any;
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
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        if (retryCount < this.maxRetries) {
          console.log(`Network error, retrying (${retryCount + 1}/${this.maxRetries}) after ${this.retryDelay}ms`);
          await this.delay(this.retryDelay * Math.pow(2, retryCount));
          return this.request<T>(endpoint, options, retryCount + 1);
        }
        throw new NetworkError('Network connection failed. Please check your internet connection.');
      }
      
      // Re-throw custom errors
      if (error instanceof AuthenticationError || error instanceof ValidationError || error instanceof NetworkError) {
        throw error;
      }
      
      console.error('API request failed:', error);
      throw new NetworkError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  private shouldRetry(method?: string): boolean {
    // Only retry safe HTTP methods
    return !method || ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check with timeout
  async checkConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
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
  async getFeed(limit: number = 20, offset: number = 0): Promise<{ data: PostResponse[] }> {
    const response = await this.request<{ count: number; limit: number; offset: number; posts: PostResponse[] }>(`/api/feed?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
    // Transform the response to match the expected format
    return { data: response.posts };
  }

  async getPosts(): Promise<PostsResponse> {
    return this.request<PostsResponse>('/api/posts', {
      method: 'GET',
    });
  }

  async getPost(id: number): Promise<APIPost> {
    return this.request<APIPost>(`/api/posts/${id}`, {
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

  // Alternative like endpoint that returns detailed info
  async toggleLike(id: number): Promise<{ message: string; is_liked: boolean }> {
    return this.request<{ message: string; is_liked: boolean }>(`/api/posts/${id}/like`, {
      method: 'POST',
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

  // Groups endpoints
  async getUserGroups(userId: number): Promise<{ data: GroupResponse[] }> {
  const response = await this.request<{ groups: GroupResponse[], count: number, limit: number, offset: number }>(`/api/groups`, {
      method: 'GET',
    });
    // Return only the groups the user is a member of (defensive filter)
    return { data: (response.groups || []).filter(g => g.is_member) };
  }

  async getGroup(groupId: number): Promise<GroupResponse> {
    return this.request<GroupResponse>(`/api/groups/${groupId}`, {
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
      method: 'POST',
    });
  }

  async inviteUserToGroup(groupId: number, userId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/groups/${groupId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
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

  async getGroupMembers(groupId: number): Promise<{ members: any[], count: number }> {
    return this.request<{ members: any[], count: number }>(`/api/groups/${groupId}/members`, {
      method: 'GET',
    });
  }

  async getUserRole(groupId: number): Promise<{ role: string; is_admin_or_creator: boolean }> {
    return this.request<{ role: string; is_admin_or_creator: boolean }>(`/api/groups/${groupId}/role`, {
      method: 'GET',
    });
  }

  async getGroupPosts(groupId: number, limit: number = 20, offset: number = 0): Promise<{ posts: PostResponse[], count: number }> {
    return this.request<{ posts: PostResponse[], count: number }>(`/api/groups/${groupId}/posts?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  async createGroupPost(groupId: number, data: CreatePostRequest): Promise<PostResponse> {
    return this.request<PostResponse>(`/api/groups/${groupId}/posts`, {
      method: 'POST',
      body: JSON.stringify(data),
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

  async deleteEvent(eventId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  async respondToEvent(eventId: number, option: 'going' | 'not_going'): Promise<{ message: string; response: string }> {
    return this.request<{ message: string; response: string }>(`/api/events/${eventId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ option }),
    });
  }

  async getEventResponses(eventId: number): Promise<{ responses: { going: EventResponseDetail[], not_going: EventResponseDetail[] }, counts: { going: number, not_going: number, total: number } }> {
    return this.request<{ responses: { going: EventResponseDetail[], not_going: EventResponseDetail[] }, counts: { going: number, not_going: number, total: number } }>(`/api/events/${eventId}/responses`, {
      method: 'GET',
    });
  }

  // Messages endpoints
  async getConversations(): Promise<{ conversations: ConversationResponse[] }> {
    return this.request<{ conversations: ConversationResponse[] }>('/api/conversations', {
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

  async respondToFollowRequest(userId: number, action: 'accept' | 'decline'): Promise<{ message: string; status: string }> {
    return this.request<{ message: string; status: string }>(`/api/users/${userId}/follow`, {
      method: 'PUT',
      body: JSON.stringify({ action }),
    });
  }

  async getUsers(): Promise<{ users: any[] }> {
    return this.request<{ users: any[] }>('/api/users', {
      method: 'GET',
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
  } catch (error) {
    console.error('Logout error:', error);
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
