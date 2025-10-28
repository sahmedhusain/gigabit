import { ReactNode } from 'react';
import { User as UserType } from '@/lib/api';


export interface User {
  id?: number
  user_id?: number
  username?: string
  nickname?: string
  name?: string
  display_name?: string
  first_name?: string
  last_name?: string
  avatar?: string
  profile_image?: string
  status?: string
}

export interface FollowRequest {
  request_id: number
  user: {
    id: number
    first_name?: string
    last_name?: string
    avatar?: string
    nickname?: string
  }
  requested_at: string
}

export interface GroupInvitation {
  id: number
  group?: {
    id: number
    title?: string
    avatar?: string
    creator?: {
      id: number
      first_name?: string
      last_name?: string
      avatar?: string
    }
  }
  created_at: string
  
  type?: 'invite' | 'join_request'
  request_user?: {
    id: number
    first_name?: string
    last_name?: string
    avatar?: string
    nickname?: string
  } | null
}

export interface RightSidebarProps {
  onlineUsers: User[]
  followingUsers?: User[]
  followersUsers?: User[]
  onUserClick: (user: User) => void
  currentUser: {
    id: number
    name: string
    username: string
    avatar?: string
    isPrivate: boolean
    followers: number
    following: number
    posts: number
    status: string
    lastStatusChange: string
  } | null
  setActiveTab: (tab: string) => void
  logout: () => void
  isMobileOpen: boolean
}

export interface StatusOption {
  id: string
  label: string
  color: string
  icon: React.ReactNode
}


export interface FollowStatus {
  isFollowing: boolean
  isPending: boolean
  isFollowedBy: boolean
  status: 'not_following' | 'pending' | 'following' | 'follow_back'
}

export interface UserWithFollowStatus extends UserType {
  followStatus: FollowStatus
  status: 'online' | 'busy' | 'away' | 'invisible' | 'offline'
  lastStatusChange?: string
}

export interface UsersSidebarProps {
  className?: string
  onUserClick?: (user: UserType) => void
}