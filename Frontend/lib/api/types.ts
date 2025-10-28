import { ChatItem } from '../../types/chat';


export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';


export type { ChatItem };


export type { RegisterRequest, LoginRequest, AuthResponse, User } from '../../types/auth-data';


export type { Bookmark, Post, APIPost, Comment, PostResponse, CreatePostRequest, UpdatePostRequest, PostsResponse } from '../../types/posts';


export type { Member, GroupMemberStatus, Group, GroupResponse, CreateGroupRequest, GroupInvitationItem } from '../../types/group-data';


export type { Event, EventResponse, CreateEventRequest, UpdateEventRequest, CancelEventRequest, EventResponseDetail } from '../../types/event-data';


export type { Chat, MessageItem, ConversationResponse, ConversationSearchResult } from '../../types/chat-data';


export type { Notification, NotificationResponse, NotificationSettings, NotificationSettingsRequest } from '../../types/notification-data';


export type { FollowRequestItem } from '../../types/follow-data';


export type { APIError } from '../../types/error-data';
export { NetworkError, ValidationError, AuthenticationError } from '../../types/error-data';