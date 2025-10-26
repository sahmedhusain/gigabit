import { ApiClient } from './client';
import { ChatItem } from './types';

declare module './client' {
  interface ApiClient {
    // Share endpoints
    sharePost(data: { post_id: number; conversation_ids: number[]; group_ids: number[]; user_ids?: number[] }): Promise<{ message: string }>;
    getRecentChatsAndGroups(): Promise<{ chats: ChatItem[] }>;
    searchShareableEntities(query: string): Promise<{ chats: ChatItem[] }>;
  }
}

ApiClient.prototype.sharePost = async function(data: { post_id: number; conversation_ids: number[]; group_ids: number[]; user_ids?: number[] }): Promise<{ message: string }> {
  return this.request<{ message: string }>('/api/share', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

ApiClient.prototype.getRecentChatsAndGroups = async function(): Promise<{ chats: ChatItem[] }> {
  return this.request<{ chats: ChatItem[] }>('/api/share/recent', {
    method: 'GET',
  });
};

ApiClient.prototype.searchShareableEntities = async function(query: string): Promise<{ chats: ChatItem[] }> {
  const params = new URLSearchParams({ q: query });
  return this.request<{ chats: ChatItem[] }>(`/api/share/search?${params}`, {
    method: 'GET',
  });
};