/**
 * Authentication types
 */

export interface User {
  id: number;
  email: string;
  name: string | null;
  avatar_url: string | null;
  oauth_provider: 'google' | 'github' | null;
  plan: 'free' | 'starter' | 'creator' | 'pro';
  monthly_minutes_used: number;
  monthly_exports_used: number;
  storage_used_mb: number;
  monthly_minutes_limit: number;
  monthly_exports_limit: number;
  storage_limit_mb: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string | null;
  last_login: string | null;
  // Stripe fields
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface UsageStats {
  plan: string;
  usage: {
    minutes_used: number;
    minutes_limit: number;
    minutes_remaining: number;
    exports_used: number;
    exports_limit: number;
    exports_remaining: number;
    storage_used_mb: number;
    storage_limit_mb: number;
    storage_remaining_mb: number;
  };
  features: {
    watermark: boolean;
    priority_processing: boolean;
    max_video_length_minutes: number;
  };
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}
