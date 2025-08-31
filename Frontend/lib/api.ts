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
  category?: {
    id: number;
    name: string;
    color: string;
    icon: string;
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
  category_id: number;
  created_at: string;
  updated_at: string;
  user: User;
  category: CategoryResponse;
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
  category_id?: number;
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

export interface Category {
  id: number;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  is_active: boolean;
  post_count: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  is_active: boolean;
  post_count: number;
  created_at: string;
  updated_at: string;
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
    const response = await this.request<{ groups: GroupResponse[], count: number, limit: number, offset: number }>('/api/groups', {
      method: 'GET',
    });
    // Transform the response to match the expected format
    return { data: response.groups };
  }

  async getGroup(groupId: number): Promise<GroupResponse> {
    return this.request<GroupResponse>(`/api/groups/${groupId}`, {
      method: 'GET',
    });
  }

  // Events endpoints
  async getUserEvents(): Promise<{ data: EventResponse[] }> {
    const response = await this.request<{ events: EventResponse[], count: number, limit: number, offset: number }>('/api/events', {
      method: 'GET',
    });
    // Transform the response to match the expected format
    return { data: response.events };
  }

  // Messages endpoints
  async getConversations(): Promise<{ conversations: ConversationResponse[] }> {
    return this.request<{ conversations: ConversationResponse[] }>('/api/conversations', {
      method: 'GET',
    });
  }

  // Followers endpoints
  async getFollowers(userId: number): Promise<{ data: User[] }> {
    return this.request<{ data: User[] }>(`/api/users/${userId}/followers`, {
      method: 'GET',
    });
  }

  async getFollowing(userId: number): Promise<{ data: User[] }> {
    return this.request<{ data: User[] }>(`/api/users/${userId}/following`, {
      method: 'GET',
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

  // Category methods
  async getCategories(): Promise<{ categories: CategoryResponse[], count: number }> {
    return this.request<{ categories: CategoryResponse[], count: number }>('/api/categories', {
      method: 'GET',
    });
  }

  async getCategory(categoryId: number): Promise<CategoryResponse> {
    return this.request<CategoryResponse>(`/api/categories/${categoryId}`, {
      method: 'GET',
    });
  }

  async getPostsByCategory(categoryId: number, limit: number = 20, offset: number = 0): Promise<{ posts: PostResponse[], count: number, category_id: number }> {
    return this.request<{ posts: PostResponse[], count: number, category_id: number }>(`/api/posts/category/${categoryId}?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  async getCategoryStats(): Promise<{ stats: any[], count: number }> {
    return this.request<{ stats: any[], count: number }>('/api/categories/stats', {
      method: 'GET',
    });
  }

  async searchCategories(query: string): Promise<{ categories: CategoryResponse[], count: number, search: string }> {
    return this.request<{ categories: CategoryResponse[], count: number, search: string }>(`/api/categories/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
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
