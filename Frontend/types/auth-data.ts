
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nickname?: string;
  aboutMe?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  avatar: string;
  nickname: string;
  about_me: string;
  gender: string;
  is_private: boolean;
  status: string;
  last_status_change: string;
  created_at: string;
  updated_at: string;
  gender_privacy: string;
  birthday_privacy: string;
  is_deleted?: boolean;
}