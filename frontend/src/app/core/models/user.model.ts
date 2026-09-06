export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: 'student' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  full_name: string;
  password: string;
}
