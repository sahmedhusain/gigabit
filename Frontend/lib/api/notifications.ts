import { ApiClient } from './client';
import { NotificationResponse, NotificationSettings, NotificationSettingsRequest } from './types';

declare module './client' {
  interface ApiClient {
    
    getNotifications(limit?: number, offset?: number): Promise<{ data: NotificationResponse[] }>;
    getUnreadNotificationCount(): Promise<{ unread_count: number }>;
    markNotificationAsRead(notificationIds: number[]): Promise<{ message: string; count: number }>;
    markAllNotificationsAsRead(): Promise<{ message: string }>;
    deleteNotification(notificationId: number): Promise<{ message: string }>;
    deleteAllReadNotifications(): Promise<{ message: string }>;
    getNotificationSettings(): Promise<NotificationSettings>;
    updateNotificationSettings(settings: NotificationSettingsRequest): Promise<{ message: string; settings: NotificationSettings }>;
  }
}

ApiClient.prototype.getNotifications = async function(limit: number = 20, offset: number = 0): Promise<{ data: NotificationResponse[] }> {
  return this.request<{ data: NotificationResponse[] }>(`/api/notifications?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
};

ApiClient.prototype.getUnreadNotificationCount = async function(): Promise<{ unread_count: number }> {
  return this.request<{ unread_count: number }>('/api/notifications/unread', {
    method: 'GET',
  });
};

ApiClient.prototype.markNotificationAsRead = async function(notificationIds: number[]): Promise<{ message: string; count: number }> {
  return this.request<{ message: string; count: number }>('/api/notifications/read', {
    method: 'PUT',
    body: JSON.stringify({ notification_ids: notificationIds, mark_all: false }),
  });
};

ApiClient.prototype.markAllNotificationsAsRead = async function(): Promise<{ message: string }> {
  return this.request<{ message: string }>('/api/notifications/read', {
    method: 'PUT',
    body: JSON.stringify({ mark_all: true }),
  });
};

ApiClient.prototype.deleteNotification = async function(notificationId: number): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/notifications/${notificationId}`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.deleteAllReadNotifications = async function(): Promise<{ message: string }> {
  return this.request<{ message: string }>('/api/notifications/read', {
    method: 'DELETE',
  });
};

ApiClient.prototype.getNotificationSettings = async function(): Promise<NotificationSettings> {
  return this.request<NotificationSettings>('/api/notifications/settings', {
    method: 'GET',
  });
};

ApiClient.prototype.updateNotificationSettings = async function(settings: NotificationSettingsRequest): Promise<{ message: string; settings: NotificationSettings }> {
  return this.request<{ message: string; settings: NotificationSettings }>('/api/notifications/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
};