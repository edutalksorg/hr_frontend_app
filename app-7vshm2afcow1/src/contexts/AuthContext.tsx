import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import type { User } from '@/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, latitude?: number, longitude?: number) => Promise<void>;
  register: (email: string, username: string, password: string, role: string, branchId?: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      console.log('🔐 AuthContext: Initializing authentication...');
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('⚠️ AuthContext: No token found');
        setLoading(false);
        return;
      }

      try {
        console.log('🔄 AuthContext: Fetching current user...');
        const currentUser = await apiService.getCurrentUser();
        console.log('✅ AuthContext: User authenticated:', currentUser.username, 'Role:', currentUser.role);
        setUser(currentUser);
      } catch (error) {
        console.warn("❌ AuthContext: Auth check failed, clearing session.");
        apiService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (user?.isBlocked) {
      if (window.location.pathname !== '/blocked') {
        navigate('/blocked');
      }
    }
  }, [user, navigate]);

  const login = async (email: string, password: string, latitude?: number, longitude?: number) => {
    try {
      const response = await apiService.login(email, password, latitude, longitude);
      setUser(response.user ?? null);
      toast.success('Login successful!');
      if (response.user?.isBlocked) {
        navigate('/blocked');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      // Error is handled by api interceptor
      throw error;
    }
  };

  const register = async (email: string, username: string, password: string, role: string, branchId?: string) => {
    try {
      const response = await apiService.register(email, username, password, role, branchId);

      if (!response.user) {
        toast.success('Registration successful! Please wait for admin approval.');
        navigate('/login');
        return;
      }

      setUser(response.user);
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Registration failed');
      throw error;
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const updatedUser = await apiService.updateProfile(user.id, updates);
      setUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
