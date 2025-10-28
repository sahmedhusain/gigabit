import { User } from '../lib/api/types';


export interface Bookmark {
  id: number;
  post_id: number;
  user_id: number;
  created_at: string;
  
  [key: string]: unknown;
}

export interface Post {
  id: number;
  user: {
    id: number;
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  timeAgo: string;
  privacy: string;
  isLiked: boolean;
  isBookmarked?: boolean;
  created_at: string;
}

export interface APIPost {
  id: number;
  user_id: number;
  content: string;
  image_url?: string;
  privacy: string;
  created_at: string;
  updated_at: string;
  user: User;
  like_count: number;
  comment_count: number;
  share_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  specific_user_ids?: number[];
  comments?: Comment[];
}

export interface Comment {
  id: number;
  user_id: number;
  post_id: number;
  content: string;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
  user: User;
}

export interface PostResponse {
  id: number;
  content: string;
  image_url?: string;
  privacy: string;
  user: User;
  like_count: number;
  dislike_count: number;
  comment_count: number;
  share_count: number;
  is_liked: boolean;
  is_disliked: boolean;
  is_bookmarked: boolean;
  created_at: string;
  updated_at: string;
  group_id?: number; 
}

export interface CreatePostRequest {
  content: string;
  privacy?: 'public' | 'followers' | 'friends' | 'listed';
  image_url?: string;
  specific_user_ids?: number[];
}

export interface UpdatePostRequest {
  content?: string;
  image_url?: string;
  privacy?: 'public' | 'followers' | 'friends' | 'listed';
  specific_user_ids?: number[];
}

export interface PostsResponse {
  posts: APIPost[];
}


export interface UserOption {
  id: number
  display_name?: string
  first_name: string
  last_name: string
  nickname?: string
  email: string
  avatar?: string
}

export interface CreatePostProps {
  show: boolean
  onClose: () => void
  newPostContent: string
  setNewPostContent: (content: string) => void
  newPostImage: File | null
  setNewPostImage: (image: File | null) => void
  postPrivacy: 'public' | 'followers' | 'friends' | 'listed'
  setPostPrivacy: (privacy: 'public' | 'followers' | 'friends' | 'listed') => void
  selectedUsers: number[]
  setSelectedUsers: (users: number[]) => void
  availableUsers: UserOption[]
  loadingUsers: boolean
  onCreatePost: () => void
}

export interface HomeFeedProps {
  posts: Post[]
  onPostLike: (postId: number) => void
  onPostBookmark?: (postId: number) => void
  showCreatePost: boolean
  setShowCreatePost: (show: boolean) => void
  newPostContent: string
  setNewPostContent: (content: string) => void
  newPostImage: File | null
  setNewPostImage: (image: File | null) => void
  postPrivacy: 'public' | 'followers' | 'friends' | 'listed'
  setPostPrivacy: (privacy: 'public' | 'followers' | 'friends' | 'listed') => void
  selectedUsers: number[]
  setSelectedUsers: (users: number[]) => void
  availableUsers: { id: number; email: string; first_name: string; last_name: string; avatar?: string; nickname?: string; display_name?: string; }[]
  loadingUsers: boolean
  onCreatePost: () => Promise<void>
  feedSubTab: string
  sortOrder: 'newest' | 'oldest'
  setSortOrder: (sort: 'newest' | 'oldest') => void
  hasMoreResults?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
  resultsContainerRef?: React.RefObject<HTMLDivElement | null>
}

export interface SharedPostMessageProps {
  sharedPost: {
    id: number
    user_id: number
    content: string
    image_url?: string
    privacy: string
    created_at: string
    user: {
      id: number
      email: string
      first_name: string
      last_name: string
      avatar?: string
      nickname?: string
    }
    like_count: number
    comment_count: number
    share_count: number
  }
  isCurrentUser: boolean
  messageId: number
  messageCreatedAt: string
  canDelete?: boolean
  onDeleteClick?: (messageId: number, event: React.MouseEvent) => void
}