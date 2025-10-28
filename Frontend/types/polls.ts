import { User } from '../lib/api/types';


export interface PollOption {
  id: number;
  option_text: string;
  option_order: number;
  vote_count: number;
  percentage: number;
  voters: string[];
  total_voters: number;
}

export interface PollResponse {
  id: number;
  user_id: number;
  group_id?: number;
  title: string;
  description?: string;
  allow_multiple_choices: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  creator: User;
  options: PollOption[];
  total_votes: number;
  user_voted: boolean;
  user_votes: number[]; 
  is_expired: boolean;
}

export interface CreatePollRequest {
  group_id?: number;
  title: string;
  description?: string;
  options: string[];
  allow_multiple_choices: boolean;
  expires_at?: string;
}

export interface VotePollRequest {
  option_ids: number[];
}

export interface CreatePollModalProps {
  show: boolean
  onClose: () => void
  onCreatePoll: (pollData: {
    title: string
    description: string
    options: string[]
    allowMultipleChoices: boolean
    expiresAt?: string
  }) => Promise<void>
  groupId?: number
}

export interface PollCardProps {
  poll: PollResponse
  onVote: (pollId: number, optionIds: number[]) => Promise<void>
  onUnvote: (pollId: number) => Promise<void>
  onDelete?: (pollId: number) => Promise<void>
  onExpire?: (pollId: number) => Promise<void>
  canManage?: boolean 
  hideCounts?: boolean 
}