

import { User, GroupResponse } from '@/lib/api'
import { FollowStatus } from '@/types/profile'

export interface GroupData {
  id: number;
}


export interface DiscoverUser extends User {
  followStatus: FollowStatus & { isFollowedBy: boolean }
  isOnline: boolean
}

export interface DiscoverGroup extends GroupResponse {
  joinStatus: 'none' | 'sent' | 'requested' | 'member' | 'rejected'
}

export interface GroupJoinRequest {
  id: number
  group: GroupResponse
  user: User
  requested_at: string
  status: 'pending' | 'accepted' | 'declined'
}

export type RequestItem = {
  request_id: number
  user: {
    id: number
    first_name?: string
    last_name?: string
    avatar?: string
    nickname?: string
  }
  requested_at: string
  type: 'follow'
  direction?: 'incoming' | 'outgoing'
} | {
  request_id: number
  user: {
    id: number
    first_name?: string
    last_name?: string
    avatar?: string
    nickname?: string
  }
  requested_at: string
  type: 'group_join'
  group: GroupResponse
  direction?: 'incoming' | 'outgoing'
} | {
  request_id: number
  user: {
    id: number
    first_name?: string
    last_name?: string
    avatar?: string
    nickname?: string
  }
  requested_at: string
  type: 'group_invitation'
  group: GroupResponse
  direction?: 'incoming' | 'outgoing'
}

export type ViewMode = 'grid' | 'list'
export type ActiveTab = 'users' | 'groups' | 'requests'
export type UserFilter = 'all' | 'following' | 'not_following' | 'pending'
export type GroupFilter = 'all' | 'member' | 'not_member' | 'requested' | 'sent' | 'rejected'
export type RequestType = 'all' | 'incoming' | 'outgoing'


export interface EventSearchResultProps {
  result: any 
}

export interface GroupSearchResultProps {
  result: any 
}

export interface MessageSearchResultProps {
  result: any 
}

export interface PostSearchResultProps {
  result: any 
}

export interface SearchPageProps {
  onClose: () => void
}

export interface SearchResultsProps {
  filter: string
  query: string
}

export interface UserSearchResultProps {
  result: any 
}