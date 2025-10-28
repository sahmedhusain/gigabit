
export interface FollowRequestItem {
  request_id: number;
  user: {
    id: number;
    first_name?: string;
    last_name?: string;
    avatar?: string;
    nickname?: string;
  };
  requested_at: string;
  [key: string]: unknown;
}