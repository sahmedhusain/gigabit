import { ApiClient } from './client';
import { GroupResponse, CreateGroupRequest, Member, PostResponse, EventResponse, CreatePostRequest, User } from './types';

declare module './client' {
  interface ApiClient {
    
    getUserGroups(userId: number): Promise<{ groups: GroupResponse[], count: number, limit: number, offset: number }>;
    getAllGroups(limit?: number, offset?: number): Promise<{ groups: GroupResponse[], count: number, limit: number, offset: number }>;
    getGroup(groupId: number): Promise<GroupResponse>;
    createGroup(data: CreateGroupRequest): Promise<GroupResponse>;
    joinGroup(groupId: number): Promise<{ message: string }>;
    leaveGroup(groupId: number): Promise<{ message: string }>;
    inviteUserToGroup(groupId: number, userId: number): Promise<{ message: string }>;
    inviteUsersToGroup(groupId: number, userIds: number[]): Promise<{ message: string }>;
    acceptGroupInvitation(groupId: number): Promise<{ message: string }>;
    declineGroupInvitation(groupId: number): Promise<{ message: string }>;
    getGroupMembers(groupId: number): Promise<{ members: Member[]; count: number }>;
    getUserRole(groupId: number): Promise<{ role: string; is_admin_or_creator: boolean }>;
    promoteToAdmin(groupId: number, userId: number): Promise<{ message: string }>;
    demoteAdmin(groupId: number, userId: number): Promise<{ message: string }>;
    kickMember(groupId: number, userId: number): Promise<{ message: string }>;
    updateMemberRole(groupId: number, userId: number, role: 'admin' | 'member'): Promise<{ message: string }>;
    getNextAdmin(groupId: number): Promise<{ next_admin: string; has_admins: boolean; first_member: string }>;
    getGroupPosts(groupId: number, limit?: number, offset?: number): Promise<{ posts: PostResponse[], count: number }>;
    createGroupPost(groupId: number, data: CreatePostRequest): Promise<PostResponse>;
    deleteGroupPost(groupId: number, postId: number): Promise<{ message: string }>;
    likeGroupPost(groupId: number, postId: number): Promise<{ success: boolean }>;
    unlikeGroupPost(groupId: number, postId: number): Promise<{ success: boolean }>;
    dislikeGroupPost(groupId: number, postId: number): Promise<{ success: boolean }>;
    undislikeGroupPost(groupId: number, postId: number): Promise<{ success: boolean }>;
    createGroupEvent(groupId: number, data: { title: string; description: string; event_time: string }): Promise<EventResponse>;
    getPendingJoinRequests(groupId: number): Promise<{ requests: Array<{ user: User; requested_at: string }> }>;
    respondToJoinRequest(groupId: number, userId: number, action: 'accept' | 'decline'): Promise<{ message: string }>;
    updateGroupPrivacy(groupId: number, privacy: 'public' | 'private'): Promise<{ message: string }>;
    updateGroupPermissions(groupId: number, permissions: { create_posts: 'all_members' | 'admins_only'; create_polls: 'all_members' | 'admins_only'; create_events: 'all_members' | 'admins_only'; send_messages: 'all_members' | 'admins_only' }): Promise<{ message: string }>;
    getInvitableUsers(groupId: number, searchTerm?: string): Promise<{ users: User[]; count: number }>;
    getSentJoinRequests(groupId: number): Promise<{ requests: Member[]; count: number }>;
    getReceivedJoinRequests(groupId: number): Promise<{ requests: Member[]; count: number }>;
    deleteGroupMessage(groupId: number, messageId: number): Promise<{ message: string }>;
    updateGroup(groupId: number, data: { title?: string; description?: string; avatar?: string | null }): Promise<{ message: string }>;
    deleteGroup(groupId: number): Promise<{ message: string }>;
    cancelInvitation(groupId: number, invitationId: number): Promise<{ message: string }>;
  }
}

ApiClient.prototype.getUserGroups = async function(userId: number): Promise<{ groups: GroupResponse[], count: number, limit: number, offset: number }> {
  return this.request<{ groups: GroupResponse[], count: number, limit: number, offset: number }>(`/api/groups/user/${userId}`, {
    method: 'GET',
  });
};

ApiClient.prototype.getAllGroups = async function(limit: number = 20, offset: number = 0): Promise<{ groups: GroupResponse[], count: number, limit: number, offset: number }> {
  const response = await this.request<{ groups: GroupResponse[], count: number, limit: number, offset: number }>(`/api/groups?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
  return response;
};

ApiClient.prototype.getGroup = async function(groupId: number): Promise<GroupResponse> {
  return this.request<GroupResponse>(`/api/groups/${groupId}`, {
    method: 'GET',
  });
};

ApiClient.prototype.createGroup = async function(data: CreateGroupRequest): Promise<GroupResponse> {
  return this.request<GroupResponse>('/api/groups', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

ApiClient.prototype.joinGroup = async function(groupId: number): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/groups/${groupId}/join`, {
    method: 'POST',
  });
};

ApiClient.prototype.leaveGroup = async function(groupId: number): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/groups/${groupId}/leave`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.inviteUserToGroup = async function(groupId: number, userId: number): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/groups/${groupId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });
};

ApiClient.prototype.inviteUsersToGroup = async function(groupId: number, userIds: number[]): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/groups/${groupId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ user_ids: userIds }),
  });
};

ApiClient.prototype.acceptGroupInvitation = async function(groupId: number): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/groups/${groupId}/invitation`, {
    method: 'PUT',
    body: JSON.stringify({ action: 'accept' }),
  });
};

ApiClient.prototype.declineGroupInvitation = async function(groupId: number): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/groups/${groupId}/invitation`, {
    method: 'PUT',
    body: JSON.stringify({ action: 'decline' }),
  });
};

ApiClient.prototype.getGroupMembers = async function(groupId: number): Promise<{ members: Member[]; count: number }> {
  return this.request<{ members: Member[]; count: number }>(`/api/groups/${groupId}/members`, {
    method: 'GET',
  });
};

ApiClient.prototype.getUserRole = async function(groupId: number): Promise<{ role: string; is_admin_or_creator: boolean }> {
  return this.request<{ role: string; is_admin_or_creator: boolean }>(`/api/groups/${groupId}/role`, {
    method: 'GET',
  });
};

ApiClient.prototype.promoteToAdmin = async function(groupId: number, userId: number): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/groups/${groupId}/promote`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });
};

ApiClient.prototype.demoteAdmin = async function(groupId: number, userId: number): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/groups/${groupId}/demote`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });
};

ApiClient.prototype.kickMember = async function(groupId: number, userId: number): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/groups/${groupId}/members/${userId}`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.updateMemberRole = async function(groupId: number, userId: number, role: 'admin' | 'member'): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/groups/${groupId}/members/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
};

ApiClient.prototype.getNextAdmin = async function(groupId: number): Promise<{ next_admin: string; has_admins: boolean; first_member: string }> {
  return this.request<{ next_admin: string; has_admins: boolean; first_member: string }>(`/api/groups/${groupId}/next-admin`, {
    method: 'GET',
  });
};

ApiClient.prototype.getGroupPosts = async function(groupId: number, limit: number = 20, offset: number = 0): Promise<{ posts: PostResponse[], count: number }> {
  return this.request<{ posts: PostResponse[], count: number }>(`/api/groups/${groupId}/posts?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
};

ApiClient.prototype.createGroupPost = async function(groupId: number, data: CreatePostRequest): Promise<PostResponse> {
  const response = await this.request<{ message: string, post: PostResponse }>(`/api/groups/${groupId}/posts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.post;
};

ApiClient.prototype.deleteGroupPost = async function(groupId: number, postId: number): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/groups/${groupId}/posts/${postId}`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.likeGroupPost = async function(groupId: number, postId: number): Promise<{ success: boolean }> {
  return this.request<{ success: boolean }>(`/api/groups/${groupId}/posts/${postId}/like`, {
    method: 'POST',
  });
};

ApiClient.prototype.unlikeGroupPost = async function(groupId: number, postId: number): Promise<{ success: boolean }> {
  return this.request<{ success: boolean }>(`/api/groups/${groupId}/posts/${postId}/like`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.dislikeGroupPost = async function(groupId: number, postId: number): Promise<{ success: boolean }> {
  return this.request<{ success: boolean }>(`/api/groups/${groupId}/posts/${postId}/dislike`, {
    method: 'POST',
  });
};

ApiClient.prototype.undislikeGroupPost = async function(groupId: number, postId: number): Promise<{ success: boolean }> {
  return this.request<{ success: boolean }>(`/api/groups/${groupId}/posts/${postId}/dislike`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.createGroupEvent = async function(groupId: number, data: { title: string; description: string; event_time: string }): Promise<EventResponse> {
  return this.request<EventResponse>(`/api/groups/${groupId}/events`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

ApiClient.prototype.getPendingJoinRequests = async function(groupId: number): Promise<{ requests: Array<{ user: User; requested_at: string }> }> {
  return this.request<{ requests: Array<{ user: User; requested_at: string }> }>(`/api/groups/${groupId}/requests`, {
    method: 'GET',
  });
};

ApiClient.prototype.respondToJoinRequest = async function(groupId: number, userId: number, action: 'accept' | 'decline'): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/groups/${groupId}/request/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ action }),
  });
};

ApiClient.prototype.updateGroupPrivacy = async function(groupId: number, privacy: 'public' | 'private'): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/groups/${groupId}/privacy`, {
    method: 'PUT',
    body: JSON.stringify({ privacy }),
  });
};

ApiClient.prototype.updateGroupPermissions = async function(groupId: number, permissions: { create_posts: 'all_members' | 'admins_only'; create_polls: 'all_members' | 'admins_only'; create_events: 'all_members' | 'admins_only'; send_messages: 'all_members' | 'admins_only' }): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/groups/${groupId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify(permissions),
  });
};

ApiClient.prototype.getInvitableUsers = async function(groupId: number, searchTerm?: string): Promise<{ users: User[]; count: number }> {
  const params = new URLSearchParams();
  if (searchTerm) {
    params.append('search', searchTerm);
  }
  const queryString = params.toString();
  const url = queryString ? `/api/users/invitable/${groupId}?${queryString}` : `/api/users/invitable/${groupId}`;
  return this.request<{ users: User[]; count: number }>(url, {
    method: 'GET',
  });
};

ApiClient.prototype.getSentJoinRequests = async function(groupId: number): Promise<{ requests: Member[]; count: number }> {
  return this.request<{ requests: Member[]; count: number }>(`/api/groups/${groupId}/join-requests/sent`, {
    method: 'GET',
  });
};

ApiClient.prototype.getReceivedJoinRequests = async function(groupId: number): Promise<{ requests: Member[]; count: number }> {
  return this.request<{ requests: Member[]; count: number }>(`/api/groups/${groupId}/join-requests/received`, {
    method: 'GET',
  });
};

ApiClient.prototype.deleteGroupMessage = async function(groupId: number, messageId: number): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/groups/${groupId}/messages/${messageId}`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.updateGroup = async function(groupId: number, data: { title?: string; description?: string; avatar?: string | null }): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/groups/${groupId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

ApiClient.prototype.deleteGroup = async function(groupId: number): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/groups/${groupId}`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.cancelInvitation = async function(groupId: number, invitationId: number): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/groups/${groupId}/cancel-invitation/${invitationId}`, {
    method: 'DELETE',
  });
};