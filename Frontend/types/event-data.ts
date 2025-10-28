import { User } from './auth-data';
import { GroupResponse } from './group-data';


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
  event_time: string; 
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  location?: string;
  event_time?: string; 
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