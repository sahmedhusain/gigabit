'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, getToken, setToken, removeToken, User } from '@/lib/api';
import { AuthContextType, RegisterData, AuthProviderProps } from '@/types/contexts';

const DEBUG = process.env.DEBUG;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch (error) {
      
      removeToken();
      setUser(null);
      
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await api.login({ email, password });
      setToken(response.token);
      setUser(response.user);
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('freshLogin', 'true');
      }
    } catch (error) {
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await api.register(userData);
      setToken(response.token);
      setUser(response.user);
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('freshLogin', 'true');
      }
    } catch (error) {
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      
    } finally {
      removeToken();
      setUser(null);
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
