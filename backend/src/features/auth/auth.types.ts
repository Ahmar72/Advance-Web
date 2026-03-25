// Auth-specific types
export interface SignInWithGitHubResponse {
  url: string;
  data: {
    provider: string;
  };
}

export interface SessionData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: {
    id: string;
    email: string;
    user_metadata?: Record<string, any>;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
}
