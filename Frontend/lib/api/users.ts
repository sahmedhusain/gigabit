import { ApiClient } from './client';
import { User, FollowRequestItem, GroupInvitationItem, PostResponse } from './types';

declare module './client' {
  interface ApiClient {
    
    getUsers(): Promise<{ users: User[] }>;
    getProfile(userId: number): Promise<User>;
    updateUserStatus(status: string): Promise<User>;
    updateProfile(data: { first_name?: string; last_name?: string; email?: string; nickname?: string; date_of_birth?: string; bio?: string; avatar_url?: string; gender?: string }): Promise<User>;
    checkEmailUniqueness(email: string): Promise<{ available: boolean; message?: string }>;
    checkNicknameUniqueness(nickname: string): Promise<{ available: boolean; message?: string }>;
    getMyStatus(): Promise<{ user_id: number; status: string; last_status_change: string; is_online: boolean }>;
    updateMyStatus(status: 'online' | 'busy' | 'away' | 'invisible'): Promise<{ message: string }>;
    getOnlineUsers(): Promise<{ users: Array<{ user_id: number; username: string; status: string; last_status_change: string }> }>;
    updateUserPrivacy(userId: number, isPrivate: boolean): Promise<{ message: string; user: User }>;
    updateBirthdayPrivacy(birthdayPrivacy: string): Promise<{ message: string; user: User }>;
    updateGenderPrivacy(genderPrivacy: string): Promise<{ message: string; user: User }>;
    getFollowers(userId: number): Promise<{ followers: User[], count: number }>;
    getFollowing(userId: number): Promise<{ following: User[], count: number }>;
    sendFollowRequest(userId: number): Promise<{ message: string; status: string }>;
    unfollowUser(userId: number): Promise<{ message: string }>;
    respondToFollowRequest(userId: number, action: 'accept' | 'decline' | 'remove'): Promise<{ message: string; status: string }>;
    getFollowRequests(): Promise<{ requests: FollowRequestItem[]; count: number }>;
    getOutgoingFollowRequests(): Promise<{ requests: FollowRequestItem[]; count: number }>;
    getGroupInvitations(): Promise<{ invitations: GroupInvitationItem[]; count: number }>;
    getOutgoingGroupJoinRequests(): Promise<{ requests: GroupInvitationItem[]; count: number }>;
    getUserLikedPosts(limit?: number, offset?: number): Promise<{ posts: PostResponse[], count: number, limit: number, offset: number }>;
    getUserCommentedPosts(limit?: number, offset?: number): Promise<{ posts: PostResponse[], count: number, limit: number, offset: number }>;
    getFollowStatus(userId: number): Promise<{ is_following: boolean; is_pending: boolean; is_followed_by: boolean; status: string }>;
  }
}

ApiClient.prototype.getUsers = async function(): Promise<{ users: User[] }> {
  return this.request<{ users: User[] }>('/api/users', {
    method: 'GET',
  });
};

ApiClient.prototype.getProfile = async function(userId: number): Promise<User> {
  return this.request<User>(`/api/profile/${userId}`, {
    method: 'GET',
  });
};

ApiClient.prototype.updateUserStatus = async function(status: string): Promise<User> {
  return this.request<User>('/api/users/status', {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

ApiClient.prototype.updateProfile = async function(data: { first_name?: string; last_name?: string; email?: string; nickname?: string; date_of_birth?: string; bio?: string; avatar_url?: string; gender?: string }): Promise<User> {
  return this.request<User>('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

ApiClient.prototype.checkEmailUniqueness = async function(email: string): Promise<{ available: boolean; message?: string }> {
  return this.request<{ available: boolean; message?: string }>(`/api/validation/email?email=${encodeURIComponent(email)}`, {
    method: 'GET',
  });
};

ApiClient.prototype.checkNicknameUniqueness = async function(nickname: string): Promise<{ available: boolean; message?: string }> {
  return this.request<{ available: boolean; message?: string }>(`/api/validation/nickname?nickname=${encodeURIComponent(nickname)}`, {
    method: 'GET',
  });
};

ApiClient.prototype.getMyStatus = async function(): Promise<{ user_id: number; status: string; last_status_change: string; is_online: boolean }> {
  return this.request<{ user_id: number; status: string; last_status_change: string; is_online: boolean }>('/api/status/me', {
    method: 'GET',
  });
};

ApiClient.prototype.updateMyStatus = async function(status: 'online' | 'busy' | 'away' | 'invisible'): Promise<{ message: string }> {
  return this.request<{ message: string }>('/api/status/update', {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

ApiClient.prototype.getOnlineUsers = async function(): Promise<{ users: Array<{ user_id: number; username: string; status: string; last_status_change: string }> }> {
  return this.request<{ users: Array<{ user_id: number; username: string; status: string; last_status_change: string }> }>('/api/status/online', {
    method: 'GET',
  });
};

ApiClient.prototype.updateUserPrivacy = async function(userId: number, isPrivate: boolean): Promise<{ message: string; user: User }> {
  return this.request<{ message: string; user: User }>(`/api/profile/privacy`, {
    method: 'PUT',
    body: JSON.stringify({ is_private: isPrivate }),
  });
};

ApiClient.prototype.updateBirthdayPrivacy = async function(birthdayPrivacy: string): Promise<{ message: string; user: User }> {
  return this.request<{ message: string; user: User }>('/api/privacy/birthday', {
    method: 'PUT',
    body: JSON.stringify({ birthday_privacy: birthdayPrivacy }),
  });
};

ApiClient.prototype.updateGenderPrivacy = async function(genderPrivacy: string): Promise<{ message: string; user: User }> {
  return this.request<{ message: string; user: User }>('/api/privacy/gender', {
    method: 'PUT',
    body: JSON.stringify({ gender_privacy: genderPrivacy }),
  });
};

ApiClient.prototype.getFollowers = async function(userId: number): Promise<{ followers: User[], count: number }> {
  return this.request<{ followers: User[], count: number }>(`/api/users/${userId}/followers`, {
    method: 'GET',
  });
};

ApiClient.prototype.getFollowing = async function(userId: number): Promise<{ following: User[], count: number }> {
  return this.request<{ following: User[], count: number }>(`/api/users/${userId}/following`, {
    method: 'GET',
  });
};

ApiClient.prototype.sendFollowRequest = async function(userId: number): Promise<{ message: string; status: string }> {
  return this.request<{ message: string; status: string }>(`/api/users/${userId}/follow`, {
    method: 'POST',
  });
};

ApiClient.prototype.unfollowUser = async function(userId: number): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/users/${userId}/follow`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.respondToFollowRequest = async function(userId: number, action: 'accept' | 'decline' | 'remove'): Promise<{ message: string; status: string }> {
  return this.request<{ message: string; status: string }>(`/api/users/${userId}/follow`, {
    method: 'PUT',
    body: JSON.stringify({ action }),
  });
};

ApiClient.prototype.getFollowRequests = async function(): Promise<{ requests: FollowRequestItem[]; count: number }> {
  return this.request<{ requests: FollowRequestItem[]; count: number }>(`/api/follow/requests`, {
    method: 'GET',
  });
};

ApiClient.prototype.getOutgoingFollowRequests = async function(): Promise<{ requests: FollowRequestItem[]; count: number }> {
  return this.request<{ requests: FollowRequestItem[]; count: number }>(`/api/follow/requests/outgoing`, {
    method: 'GET',
  });
};

ApiClient.prototype.getGroupInvitations = async function(): Promise<{ invitations: GroupInvitationItem[]; count: number }> {
  return this.request<{ invitations: GroupInvitationItem[]; count: number }>(`/api/groups/invitations`, {
    method: 'GET',
  });
};

ApiClient.prototype.getOutgoingGroupJoinRequests = async function(): Promise<{ requests: GroupInvitationItem[]; count: number }> {
  return this.request<{ requests: GroupInvitationItem[]; count: number }>(`/api/groups/join-requests/outgoing`, {
    method: 'GET',
  });
};

ApiClient.prototype.getUserLikedPosts = async function(limit: number = 20, offset: number = 0): Promise<{ posts: PostResponse[], count: number, limit: number, offset: number }> {
  return this.request<{ posts: PostResponse[], count: number, limit: number, offset: number }>(`/api/posts/liked?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
};

ApiClient.prototype.getUserCommentedPosts = async function(limit: number = 20, offset: number = 0): Promise<{ posts: PostResponse[], count: number, limit: number, offset: number }> {
  return this.request<{ posts: PostResponse[], count: number, limit: number, offset: number }>(`/api/posts/commented?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
};

ApiClient.prototype.getFollowStatus = async function(userId: number): Promise<{ is_following: boolean; is_pending: boolean; is_followed_by: boolean; status: string }> {
  return this.request<{ is_following: boolean; is_pending: boolean; is_followed_by: boolean; status: string }>(`/api/users/${userId}/follow-status`, {
    method: 'GET',
  });
};