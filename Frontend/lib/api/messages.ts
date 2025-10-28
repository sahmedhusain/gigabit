import { ApiClient } from './client';
import { ConversationResponse, MessageItem, ConversationSearchResult, ChatItem } from './types';

declare module './client' {
  interface ApiClient {
    
    getConversations(): Promise<{ conversations: ConversationResponse[] }>;
    getChats(): Promise<{ chats: ChatItem[] }>;
    sendMessage(data: { receiver_id?: number; group_id?: number; content: string; message_type: 'private' | 'group'; image_url?: string }): Promise<{ message: string; data: MessageItem; conversation_id: number }>;
    getPrivateMessages(userId: number, limit?: number, offset?: number): Promise<{ messages: MessageItem[]; count: number; limit: number; offset: number }>;
    getGroupMessages(groupId: number, limit?: number, offset?: number): Promise<{ messages: MessageItem[]; count: number; limit: number; offset: number }>;
    markMessagesAsRead(messageIds: number[]): Promise<{ message: string; count: number }>;
    deleteMessage(messageId: number): Promise<{ message: string }>;
    markConversationAsRead(conversationId: number, conversationType: 'private' | 'group'): Promise<{ message: string; conversation_id: number }>;
    markConversationAsUnread(conversationId: number, conversationType: 'private' | 'group'): Promise<{ message: string; conversation_id: number }>;
    deleteConversation(conversationId: number): Promise<{ message: string }>;
    getConversationMessages(conversationId: number, limit?: number, offset?: number): Promise<{ messages: MessageItem[]; count: number; limit: number; offset: number }>;
    searchMessages(query: string, limit?: number, offset?: number): Promise<{ results: ConversationSearchResult[]; count: number; limit: number; offset: number }>;
    getPrivateChat(chatId: number): Promise<{ messages: MessageItem[]; count: number; limit: number; offset: number }>;
  }
}

ApiClient.prototype.getConversations = async function(): Promise<{ conversations: ConversationResponse[] }> {
  return this.request<{ conversations: ConversationResponse[] }>('/api/conversations', {
    method: 'GET',
  });
};

ApiClient.prototype.getChats = async function(): Promise<{ chats: ChatItem[] }> {
  return this.request<{ chats: ChatItem[] }>('/api/chats', {
    method: 'GET',
  });
};

ApiClient.prototype.sendMessage = async function(data: { receiver_id?: number; group_id?: number; content: string; message_type: 'private' | 'group'; image_url?: string }): Promise<{ message: string; data: MessageItem; conversation_id: number }> {
  return this.request<{ message: string; data: MessageItem; conversation_id: number }>('/api/messages', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

ApiClient.prototype.getPrivateMessages = async function(userId: number, limit: number = 50, offset: number = 0): Promise<{ messages: MessageItem[]; count: number; limit: number; offset: number }> {
  return this.request<{ messages: MessageItem[]; count: number; limit: number; offset: number }>(`/api/messages/private/${userId}?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
};

ApiClient.prototype.getGroupMessages = async function(groupId: number, limit: number = 50, offset: number = 0): Promise<{ messages: MessageItem[]; count: number; limit: number; offset: number }> {
  return this.request<{ messages: MessageItem[]; count: number; limit: number; offset: number }>(`/api/messages/group/${groupId}?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
};

ApiClient.prototype.markMessagesAsRead = async function(messageIds: number[]): Promise<{ message: string; count: number }> {
  return this.request<{ message: string; count: number }>('/api/messages/read', {
    method: 'PUT',
    body: JSON.stringify({ message_ids: messageIds }),
  });
};

ApiClient.prototype.deleteMessage = async function(messageId: number): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/messages/${messageId}`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.markConversationAsRead = async function(conversationId: number, conversationType: 'private' | 'group'): Promise<{ message: string; conversation_id: number }> {
  return this.request<{ message: string; conversation_id: number }>('/api/messages/read', {
    method: 'PUT',
    body: JSON.stringify({
      conversation_id: conversationId,
      conversation_type: conversationType
    }),
  });
};

ApiClient.prototype.markConversationAsUnread = async function(conversationId: number, conversationType: 'private' | 'group'): Promise<{ message: string; conversation_id: number }> {
  return this.request<{ message: string; conversation_id: number }>('/api/messages/unread', {
    method: 'PUT',
    body: JSON.stringify({
      conversation_id: conversationId,
      conversation_type: conversationType
    }),
  });
};

ApiClient.prototype.deleteConversation = async function(conversationId: number): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/conversations/${conversationId}`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.getConversationMessages = async function(conversationId: number, limit: number = 50, offset: number = 0): Promise<{ messages: MessageItem[]; count: number; limit: number; offset: number }> {
  return this.request<{ messages: MessageItem[]; count: number; limit: number; offset: number }>(`/api/messages/conversation/${conversationId}?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
};

ApiClient.prototype.searchMessages = async function(query: string, limit: number = 20, offset: number = 0): Promise<{ results: ConversationSearchResult[]; count: number; limit: number; offset: number }> {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
    offset: offset.toString(),
  });
  return this.request<{ results: ConversationSearchResult[]; count: number; limit: number; offset: number }>(`/api/messages/search?${params}`, {
    method: 'GET',
  });
};

ApiClient.prototype.getPrivateChat = async function(chatId: number): Promise<{ messages: MessageItem[]; count: number; limit: number; offset: number }> {
  return this.request<{ messages: MessageItem[]; count: number; limit: number; offset: number }>(`/api/chats?chats=${chatId}`, {
    method: 'GET',
  });
};