/**
 * Authentication Context and Provider
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, LoginCredentials, RegisterCredentials, AuthContextType } from '../types/auth';
import * as authService from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Check if running in Electron (desktop mode)
const isElectron = !!(window as any).electron?.isElectron;

// Desktop mode user - no auth required
const DESKTOP_USER: User = {
  id: 'desktop-user',
  email: 'desktop@subcio.local',
  name: 'Desktop User',
  role: 'admin',
  is_active: true,
  subscription_status: 'premium',
  credits: 999999,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(isElectron ? DESKTOP_USER : null);
  const [isLoading, setIsLoading] = useState(!isElectron);

  // Check for existing session on mount (skip for Electron)
  useEffect(() => {
    // Desktop mode - already authenticated
    if (isElectron) {
      setUser(DESKTOP_USER);
      setIsLoading(false);
      return;
    }

    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          // Token might be expired, try to refresh
          try {
            await authService.refreshTokens();
            const userData = await authService.getCurrentUser();
            setUser(userData);
          } catch (refreshError) {
            // Clear invalid tokens
            authService.clearTokens();
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    // Desktop mode - auto success
    if (isElectron) {
      setUser(DESKTOP_USER);
      return;
    }
    
    setIsLoading(true);
    try {
      await authService.login(credentials);
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    // Desktop mode - auto success
    if (isElectron) {
      setUser(DESKTOP_USER);
      return;
    }
    
    setIsLoading(true);
    try {
      await authService.register(credentials);
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    // Desktop mode - don't actually logout
    if (isElectron) {
      return;
    }
    
    authService.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    // Desktop mode - always return desktop user
    if (isElectron) {
      setUser(DESKTOP_USER);
      return;
    }
    
    if (authService.isAuthenticated()) {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    // Desktop mode - just update local state
    if (isElectron) {
      setUser(prev => prev ? { ...prev, ...data } : DESKTOP_USER);
      return;
    }
    
    const updatedUser = await authService.updateProfile({
      name: data.name || undefined,
      email: data.email || undefined,
    });
    setUser(updatedUser);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
