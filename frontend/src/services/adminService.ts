/**
 * Admin Service - API calls for admin dashboard
 */

import { getAccessToken } from './authService';
import {
  AdminOverviewStats,
  GrowthStats,
  UserListResponse,
  UserFilters,
  AdminUserUpdate,
  AdminUser,
  ActivityLogsResponse,
  SystemSettings,
  BulkAction,
  BulkActionResult,
} from '../types/admin';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function adminFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP error ${response.status}`);
  }

  return response.json();
}

// ============ Dashboard Stats ============

export async function getOverviewStats(): Promise<AdminOverviewStats> {
  return adminFetch<AdminOverviewStats>('/api/admin/stats/overview');
}

export async function getGrowthStats(days: number = 30): Promise<GrowthStats> {
  return adminFetch<GrowthStats>(`/api/admin/stats/growth?days=${days}`);
}

// ============ User Management ============

export async function listUsers(filters: UserFilters = {}): Promise<UserListResponse> {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.plan) params.append('plan', filters.plan);
  if (filters.role) params.append('role', filters.role);
  if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
  if (filters.sort_by) params.append('sort_by', filters.sort_by);
  if (filters.sort_order) params.append('sort_order', filters.sort_order);

  const queryString = params.toString();
  return adminFetch<UserListResponse>(`/api/admin/users${queryString ? `?${queryString}` : ''}`);
}

export async function getUserDetail(userId: number): Promise<AdminUser> {
  return adminFetch<AdminUser>(`/api/admin/users/${userId}`);
}

export async function updateUser(userId: number, data: AdminUserUpdate): Promise<AdminUser> {
  return adminFetch<AdminUser>(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteUser(userId: number): Promise<{ message: string }> {
  return adminFetch<{ message: string }>(`/api/admin/users/${userId}`, {
    method: 'DELETE',
  });
}

export async function banUser(userId: number): Promise<{ message: string }> {
  return adminFetch<{ message: string }>(`/api/admin/users/${userId}/ban`, {
    method: 'POST',
  });
}

export async function unbanUser(userId: number): Promise<{ message: string }> {
  return adminFetch<{ message: string }>(`/api/admin/users/${userId}/unban`, {
    method: 'POST',
  });
}

export async function resetUserUsage(userId: number): Promise<{ message: string }> {
  return adminFetch<{ message: string }>(`/api/admin/users/${userId}/reset-usage`, {
    method: 'POST',
  });
}

// ============ Bulk Actions ============

export async function bulkUserAction(
  action: BulkAction,
  userIds: number[]
): Promise<BulkActionResult> {
  return adminFetch<BulkActionResult>(
    `/api/admin/users/bulk-action?action=${action}`,
    {
      method: 'POST',
      body: JSON.stringify(userIds),
    }
  );
}

// ============ Activity Logs ============

export async function getActivityLogs(
  page: number = 1,
  limit: number = 50
): Promise<ActivityLogsResponse> {
  return adminFetch<ActivityLogsResponse>(
    `/api/admin/activity-logs?page=${page}&limit=${limit}`
  );
}

// ============ System Settings ============

export async function getSystemSettings(): Promise<SystemSettings> {
  return adminFetch<SystemSettings>('/api/admin/settings');
}

// ============ Helper Functions ============

export function isAdmin(role?: string): boolean {
  return role === 'admin' || role === 'super_admin';
}

export function isSuperAdmin(role?: string): boolean {
  return role === 'super_admin';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export function getRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatDate(dateString);
}
