/**
 * Admin types
 */

import { User, UserRole, SubscriptionPlan } from './auth';

// Admin Stats
export interface AdminOverviewStats {
  users: {
    total: number;
    active: number;
    new_this_month: number;
    by_plan: Record<SubscriptionPlan, number>;
  };
  usage: {
    total_storage_mb: number;
    total_minutes_used: number;
    total_projects: number;
  };
  revenue: {
    mrr: number;
    paying_customers: number;
  };
}

export interface GrowthStats {
  period_days: number;
  daily_signups: Array<{
    date: string;
    count: number;
  }>;
  total_signups: number;
}

// User Management
export interface AdminUser extends User {
  updated_at: string | null;
}

export interface UserListResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  plan?: SubscriptionPlan;
  role?: UserRole;
  is_active?: boolean;
  sort_by?: 'created_at' | 'email' | 'name' | 'plan' | 'last_login';
  sort_order?: 'asc' | 'desc';
}

export interface AdminUserUpdate {
  name?: string;
  email?: string;
  plan?: SubscriptionPlan;
  role?: UserRole;
  is_active?: boolean;
  is_verified?: boolean;
  monthly_minutes_limit?: number;
  monthly_exports_limit?: number;
  storage_limit_mb?: number;
}

// Activity Logs
export interface ActivityLog {
  type: 'login' | 'signup' | 'export' | 'subscription_change';
  user_id: number;
  user_email: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface ActivityLogsResponse {
  activities: ActivityLog[];
  page: number;
  limit: number;
}

// System Settings
export interface SystemSettings {
  maintenance_mode: boolean;
  registration_enabled: boolean;
  email_verification_required: boolean;
  max_file_size_mb: number;
  allowed_file_types: string[];
  default_plan: SubscriptionPlan;
  plans: Record<SubscriptionPlan, {
    price: number;
    videos: number;
    max_length: number;
  }>;
}

// Bulk Actions
export type BulkAction = 'activate' | 'deactivate' | 'delete' | 'reset_usage';

export interface BulkActionResult {
  message: string;
  affected: number;
}
