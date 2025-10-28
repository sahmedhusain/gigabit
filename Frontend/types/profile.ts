export interface DeleteAccountModalProps {
  showDeleteModal: boolean;
  setShowDeleteModal: (show: boolean) => void;
  deleteConfirmation: string;
  setDeleteConfirmation: (confirmation: string) => void;
  deletePassword: string;
  setDeletePassword: (password: string) => void;
  deleteCountdown: number;
  setDeleteCountdown: (countdown: number) => void;
  deletePasswordError: string;
  setDeletePasswordError: (error: string) => void;
}

export interface AccountSettingsProps {
  showDeleteModal?: boolean;
  setShowDeleteModal?: (show: boolean) => void;
  deleteCountdown?: number;
  setDeleteCountdown?: (countdown: number) => void;
  setDeletePasswordError?: (error: string) => void;
  deleteConfirmation?: string;
  setDeleteConfirmation?: (confirmation: string) => void;
  deletePassword?: string;
  setDeletePassword?: (password: string) => void;
  deletePasswordError?: string;
}

export interface ActivitySectionProps {
  activitySubTab: string
  posts: import('@/types/posts').Post[]
  onPostLike: (postId: number) => void
  onPostBookmark?: (postId: number) => void
  sortOrder?: 'newest' | 'oldest'
  setSortOrder?: (sort: 'newest' | 'oldest') => void
  hasMoreResults?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
  resultsContainerRef?: React.RefObject<HTMLDivElement | null>
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

export interface ManagePrivacyProps {
  show: boolean
  onClose: () => void
  currentPrivacy: 'public' | 'followers' | 'friends' | 'listed'
  currentSelectedUsers: number[]
  availableUsers: UserOption[]
  loadingUsers: boolean
  onUpdatePrivacy: (privacy: 'public' | 'followers' | 'friends' | 'listed', selectedUsers: number[]) => Promise<void>
}

export interface FollowWebSocketData {
  user_id: number;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  email?: string;
  avatar?: string;
  is_private?: boolean;
  created_at?: string;
  about_me?: string;
  date_of_birth?: string;
  follower_id: number;
  follower_first_name?: string;
  follower_last_name?: string;
  follower_nickname?: string;
  follower_email?: string;
  follower_avatar?: string;
  follower_is_private?: boolean;
  follower_created_at?: string;
  follower_about_me?: string;
  follower_date_of_birth?: string;
  is_followed_by?: boolean;
  is_following_back?: boolean;
  action: 'follow' | 'unfollow' | 'accept';
}

export interface ProfileSectionProps {
  currentUser: {
    id: number
    name: string
    username: string
    avatar?: string
    isPrivate: boolean
    email: string
    firstName: string
    lastName: string
    dateOfBirth: string
    nickname: string
    aboutMe: string
    gender?: string
    memberSince: string
    genderPrivacy?: string
    birthdayPrivacy?: string
    is_private?: boolean
    first_name?: string
    last_name?: string
    is_deleted?: boolean
  } | null
  followers: unknown[]
  following: unknown[]
  posts: import('@/types/posts').Post[]
  isOwnProfile?: boolean
  showPrivacyOverlay?: boolean
  initialFollowerCount?: number
  initialFollowingCount?: number
  onPostLike?: (postId: number) => void
  onPostBookmark?: (postId: number) => void
  onPostPrivacyUpdate?: (postId: number, privacy: string) => void
}

export interface FollowStatus {
  isFollowing: boolean
  isPending: boolean
  isFollowedBy: boolean  
  status: 'not_following' | 'pending' | 'following' | 'follow_back'
}

export interface FollowHandlerProps {
  targetUser: import('@/lib/api').User
  currentFollowStatus: FollowStatus
  onStatusChange: (newStatus: FollowStatus) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  confirmUnfollow?: boolean
  onUnfollowConfirm?: (userId: number, userName: string) => void
  fullWidth?: boolean
}