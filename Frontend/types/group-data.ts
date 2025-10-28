import { User } from './auth-data';


export interface Member {
  id: number;
  user: User;
  role?: string;
  joined_at?: string;
  [key: string]: unknown;
}

export type GroupMemberStatus = 'member' | 'sent' | 'requested' | 'rejected' | 'none'

export interface Group {
  id: number;
  name: string;
  description: string;
  members: number;
  isJoined: boolean;
  lastActivity: string;
  timestamp?: string; 
  privacy?: 'public' | 'private';
  memberStatus?: GroupMemberStatus;
  role?: 'admin' | 'member';
}

export interface GroupResponse {
  id: number;
  title: string;
  description: string;
  privacy: 'public' | 'private';
  create_posts: 'all_members' | 'admins_only';
  create_polls: 'all_members' | 'admins_only';
  create_events: 'all_members' | 'admins_only';
  send_messages: 'all_members' | 'admins_only';
  avatar?: string;
  creator_id: number;
  member_count: number;
  is_member: boolean;
  member_status?: GroupMemberStatus;
  role?: 'admin' | 'member' | 'creator';
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar?: string;
    nickname?: string;
  };
  members?: Array<{
    id: number;
    user: {
      id: number;
      first_name: string;
      last_name: string;
      avatar?: string;
      nickname?: string;
    };
    role: string;
    joined_at: string;
  }>;
}

export interface CreateGroupRequest {
  title: string;
  description?: string;
  privacy: 'public' | 'private';
  create_posts: 'all_members' | 'admins_only';
  create_polls: 'all_members' | 'admins_only';
  create_events: 'all_members' | 'admins_only';
  send_messages: 'all_members' | 'admins_only';
  invite_members?: number[];
  avatar?: string;
}

export interface GroupInvitationItem {
  id: number;
  group: GroupResponse;
  inviter: User;
  status: string;
  created_at: string;
  [key: string]: unknown;
}