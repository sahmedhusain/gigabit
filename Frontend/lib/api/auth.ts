import { ApiClient } from './client';
import { RegisterRequest, LoginRequest, AuthResponse, User } from './types';

declare module './client' {
  interface ApiClient {
    // Auth endpoints
    register(data: RegisterRequest): Promise<AuthResponse>;
    login(data: LoginRequest): Promise<AuthResponse>;
    getMe(): Promise<User>;
    logout(): Promise<{ message: string }>;
  }
}

ApiClient.prototype.register = async function(data: RegisterRequest): Promise<AuthResponse> {
  return this.request<AuthResponse>('/api/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

ApiClient.prototype.login = async function(data: LoginRequest): Promise<AuthResponse> {
  return this.request<AuthResponse>('/api/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

ApiClient.prototype.getMe = async function(): Promise<User> {
  return this.request<User>('/api/me', {
    method: 'GET',
  });
};

ApiClient.prototype.logout = async function(): Promise<{ message: string }> {
  return this.request<{ message: string }>('/api/logout', {
    method: 'POST',
  });
};