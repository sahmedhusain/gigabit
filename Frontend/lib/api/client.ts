import { API_BASE_URL, NetworkError, ValidationError, AuthenticationError } from './types';


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


export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};

export const logoutUser = async (): Promise<void> => {
  try {
    await api.logout();
  } catch  {
    
  } finally {
    removeToken();
    
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
};


export const handleSessionExpired = (): void => {
  removeToken();
  if (typeof window !== 'undefined') {
    alert('Your session has expired. Please log in again.');
    window.location.href = '/login';
  }
};


export class ApiClient {
  private baseURL: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  protected async request<T>(
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

        
        if (response.status === 401) {
          const code = errorData.code;
          if (code === 'TOKEN_EXPIRED' || code === 'SESSION_EXPIRED') {
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

        if (response.status === 409) {
          throw new Error(errorData.error || 'Conflict');
        }

        if (response.status >= 500) {
          
          if (retryCount < this.maxRetries && this.shouldRetry(options.method)) {
            await this.delay(this.retryDelay * Math.pow(2, retryCount)); 
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
        
        const text = await response.text();
        return text as unknown as T;
      }
    } catch {
      
      throw new NetworkError('Network connection failed. Please check your internet connection.');
    }
  }

  private shouldRetry(method?: string): boolean {
    
    return !method || ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  protected formatTimeAgo(date: Date): string {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  
  async checkConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health', {
      method: 'GET',
    });
  }

  
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

  
  async toggleLike(post: { id: number; group_id?: number }, isLiking: boolean): Promise<void> {
    if (post.group_id) {
      
      if (isLiking) {
        await this.likeGroupPost(post.group_id, post.id);
      } else {
        await this.unlikeGroupPost(post.group_id, post.id);
      }
    } else {
      
      if (isLiking) {
        await this.likePost(post.id);
      } else {
        await this.unlikePost(post.id);
      }
    }
  }

  async toggleDislike(post: { id: number; group_id?: number }, isDisliking: boolean): Promise<void> {
    if (post.group_id) {
      
      if (isDisliking) {
        await this.dislikeGroupPost(post.group_id, post.id);
      } else {
        await this.undislikeGroupPost(post.group_id, post.id);
      }
    } else {
      
      if (isDisliking) {
        await this.dislikePost(post.id);
      } else {
        await this.undislikePost(post.id);
      }
    }
  }
}


export const api = new ApiClient(API_BASE_URL);
export { API_BASE_URL };