import { ApiClient } from './client';
import { EventResponse, CreateEventRequest, UpdateEventRequest, CancelEventRequest, EventResponseDetail } from './types';

declare module './client' {
  interface ApiClient {
    // Events endpoints
    getUserEvents(): Promise<{ events: EventResponse[], count: number, limit: number, offset: number }>;
    getGroupEvents(groupId: number, limit?: number, offset?: number): Promise<{ events: EventResponse[], count: number, limit: number, offset: number }>;
    getEvent(eventId: number): Promise<EventResponse>;
    createEvent(groupId: number, data: CreateEventRequest): Promise<{ message: string; event: EventResponse }>;
    updateEvent(eventId: number, data: UpdateEventRequest): Promise<{ message: string }>;
    cancelEvent(eventId: number, data: CancelEventRequest): Promise<{ message: string }>;
    deleteEvent(eventId: number): Promise<{ message: string }>;
    respondToEvent(eventId: number, option: 'going' | 'not_going'): Promise<{ message: string; response: string; removed: boolean }>;
    getEventResponses(eventId: number): Promise<{ responses: { going: EventResponseDetail[], not_going: EventResponseDetail[] }, counts: { going: number, not_going: number, total: number } }>;
  }
}

ApiClient.prototype.getUserEvents = async function(): Promise<{ events: EventResponse[], count: number, limit: number, offset: number }> {
  return this.request<{ events: EventResponse[], count: number, limit: number, offset: number }>('/api/events?limit=20&offset=0', {
    method: 'GET',
  });
};

ApiClient.prototype.getGroupEvents = async function(groupId: number, limit: number = 20, offset: number = 0): Promise<{ events: EventResponse[], count: number, limit: number, offset: number }> {
  return this.request<{ events: EventResponse[], count: number, limit: number, offset: number }>(`/api/groups/${groupId}/events?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
};

ApiClient.prototype.getEvent = async function(eventId: number): Promise<EventResponse> {
  return this.request<EventResponse>(`/api/events/${eventId}`, {
    method: 'GET',
  });
};

ApiClient.prototype.createEvent = async function(groupId: number, data: CreateEventRequest): Promise<{ message: string; event: EventResponse }> {
  return this.request<{ message: string; event: EventResponse }>(`/api/groups/${groupId}/events`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

ApiClient.prototype.updateEvent = async function(eventId: number, data: UpdateEventRequest): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

ApiClient.prototype.cancelEvent = async function(eventId: number, data: CancelEventRequest): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/events/${eventId}/cancel`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

ApiClient.prototype.deleteEvent = async function(eventId: number): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/events/${eventId}`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.respondToEvent = async function(eventId: number, option: 'going' | 'not_going'): Promise<{ message: string; response: string; removed: boolean }> {
  return this.request<{ message: string; response: string; removed: boolean }>(`/api/events/${eventId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ option }),
  });
};

ApiClient.prototype.getEventResponses = async function(eventId: number): Promise<{ responses: { going: EventResponseDetail[], not_going: EventResponseDetail[] }, counts: { going: number, not_going: number, total: number } }> {
  return this.request<{ responses: { going: EventResponseDetail[], not_going: EventResponseDetail[] }, counts: { going: number, not_going: number, total: number } }>(`/api/events/${eventId}/responses`, {
    method: 'GET',
  });
};