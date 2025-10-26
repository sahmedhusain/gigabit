import { ApiClient } from './client';
import { PollResponse, CreatePollRequest } from './types';

declare module './client' {
  interface ApiClient {
    // Poll endpoints
    createPoll(data: CreatePollRequest): Promise<PollResponse>;
    getPoll(pollId: number): Promise<PollResponse>;
    getGroupPolls(groupId: number, limit?: number, offset?: number): Promise<PollResponse[]>;
    votePoll(pollId: number, optionIds: number[]): Promise<PollResponse>;
    unvotePoll(pollId: number): Promise<PollResponse>;
    deletePoll(pollId: number): Promise<{ message: string }>;
    expirePoll(pollId: number): Promise<PollResponse>;
  }
}

ApiClient.prototype.createPoll = async function(data: CreatePollRequest): Promise<PollResponse> {
  return this.request<PollResponse>('/api/polls', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

ApiClient.prototype.getPoll = async function(pollId: number): Promise<PollResponse> {
  return this.request<PollResponse>(`/api/polls/${pollId}`, {
    method: 'GET',
  });
};

ApiClient.prototype.getGroupPolls = async function(groupId: number, limit: number = 20, offset: number = 0): Promise<PollResponse[]> {
  return this.request<PollResponse[]>(`/api/groups/${groupId}/polls?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
};

ApiClient.prototype.votePoll = async function(pollId: number, optionIds: number[]): Promise<PollResponse> {
  return this.request<PollResponse>(`/api/polls/${pollId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ option_ids: optionIds }),
  });
};

ApiClient.prototype.unvotePoll = async function(pollId: number): Promise<PollResponse> {
  return this.request<PollResponse>(`/api/polls/${pollId}/vote`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.deletePoll = async function(pollId: number): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/polls/${pollId}`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.expirePoll = async function(pollId: number): Promise<PollResponse> {
  return this.request<PollResponse>(`/api/polls/${pollId}/expire`, {
    method: 'PUT',
  });
};