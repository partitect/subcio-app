/**
 * Authentication API service
 */

import { AuthTokens, LoginCredentials, RegisterCredentials, User, UsageStats } from '../types/auth';
import { logger } from './logService';

// Re-export types for convenience
export type { UsageStats } from '../types/auth';

// API URL from environment or fallback to localhost
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Token storage keys
const ACCESS_TOKEN_KEY = 'subcio_access_token';
const REFRESH_TOKEN_KEY = 'subcio_refresh_token';

// Error types
export class ConnectionError extends Error {
  constructor(message: string = 'Sunucuya bağlanılamadı') {
    super(message);
    this.name = 'ConnectionError';
  }
}

export class AuthError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'AuthError';
  }
}

// OAuth providers interface
export interface OAuthProviders {
  providers: {
    google: { enabled: boolean; name: string };
    github: { enabled: boolean; name: string };
  };
}

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Get stored refresh token
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Store tokens in localStorage
 */
export function storeTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

/**
 * Clear stored tokens
 */
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

/**
 * Create headers with auth token
 */
function authHeaders(): HeadersInit {
  const token = getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new AuthError(error.detail || 'An error occurred', response.status);
  }
  return response.json();
}

/**
 * Fetch wrapper with connection error handling
 */
async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  const method = options?.method || 'GET';
  const requestId = Math.random().toString(36).substring(7);
  
  logger.debug(`[${requestId}] API Request: ${method} ${url}`);
  const startTime = performance.now();
  
  try {
    const response = await fetch(url, options);
    const duration = Math.round(performance.now() - startTime);
    
    logger.requestLog(method, url, response.status, duration);
    
    if (!response.ok) {
      logger.warn(`[${requestId}] API Error: ${method} ${url} -> ${response.status}`);
    }
    
    return response;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    logger.requestLog(method, url, 0, duration);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      logger.error(`[${requestId}] Connection failed: ${url}`, error);
      throw new ConnectionError('Sunucuya bağlanılamadı. Backend çalışıyor mu?');
    }
    logger.error(`[${requestId}] Network error: ${url}`, error);
    throw new ConnectionError('Ağ hatası oluştu. Lütfen internet bağlantınızı kontrol edin.');
  }
}

/**
 * Register new user
 */
export async function register(credentials: RegisterCredentials): Promise<AuthTokens> {
  const response = await safeFetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  
  const tokens = await handleResponse<AuthTokens>(response);
  storeTokens(tokens);
  return tokens;
}

/**
 * Login user
 */
export async function login(credentials: LoginCredentials): Promise<AuthTokens> {
  const response = await safeFetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  
  const tokens = await handleResponse<AuthTokens>(response);
  storeTokens(tokens);
  return tokens;
}

/**
 * Refresh tokens
 */
export async function refreshTokens(): Promise<AuthTokens> {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new AuthError('No refresh token available');
  }
  
  const response = await safeFetch(`${API_BASE}/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  
  const tokens = await handleResponse<AuthTokens>(response);
  storeTokens(tokens);
  return tokens;
}

/**
 * Get current user info
 */
export async function getCurrentUser(): Promise<User> {
  const response = await safeFetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    headers: authHeaders(),
  });
  
  return handleResponse<User>(response);
}

/**
 * Update user profile
 */
export async function updateProfile(data: { name?: string; email?: string }): Promise<User> {
  const response = await safeFetch(`${API_BASE}/auth/me`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  
  return handleResponse<User>(response);
}

/**
 * Change password
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const response = await safeFetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
  
  await handleResponse<{ message: string }>(response);
}

/**
 * Request password reset
 */
export async function forgotPassword(email: string): Promise<void> {
  const response = await safeFetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  
  await handleResponse<{ message: string }>(response);
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const response = await safeFetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  
  await handleResponse<{ message: string }>(response);
}

/**
 * Get usage statistics
 */
export async function getUsageStats(): Promise<UsageStats> {
  const response = await safeFetch(`${API_BASE}/auth/usage`, {
    method: 'GET',
    headers: authHeaders(),
  });
  
  return handleResponse<UsageStats>(response);
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: authHeaders(),
    });
  } catch (e) {
    // Ignore errors on logout
  } finally {
    clearTokens();
  }
}

// ==================== OAuth Functions ====================

/**
 * Get available OAuth providers
 */
export async function getOAuthProviders(): Promise<OAuthProviders> {
  const response = await safeFetch(`${API_BASE}/auth/oauth/providers`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  
  return handleResponse<OAuthProviders>(response);
}

/**
 * Initiate Google OAuth login
 */
export function initiateGoogleOAuth(): void {
  window.location.href = `${API_BASE}/auth/oauth/google`;
}

/**
 * Initiate GitHub OAuth login
 */
export function initiateGitHubOAuth(): void {
  window.location.href = `${API_BASE}/auth/oauth/github`;
}

/**
 * Handle OAuth callback - exchange code for tokens
 */
export async function handleOAuthCallback(provider: 'google' | 'github', code: string): Promise<AuthTokens> {
  const response = await fetch(`${API_BASE}/auth/oauth/${provider}/callback?code=${encodeURIComponent(code)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  
  const tokens = await handleResponse<AuthTokens>(response);
  storeTokens(tokens);
  return tokens;
}

/**
 * API fetch with automatic token refresh
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  let response = await fetch(url, { ...options, headers });
  
  // If unauthorized, try to refresh token
  if (response.status === 401) {
    try {
      await refreshTokens();
      const newToken = getAccessToken();
      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await fetch(url, { ...options, headers });
      }
    } catch (e) {
      clearTokens();
      throw new Error('Session expired. Please login again.');
    }
  }
  
  return response;
}
