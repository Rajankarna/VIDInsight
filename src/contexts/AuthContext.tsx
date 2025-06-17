
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/utils/api';

interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await api('/');
      
      if (response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        setIsLoading(false);
        return true;
      }
      
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await api('/login', {
        method: 'POST',
        body: { email, password },
      });

      if (response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        toast.success('Login successful');
        setIsLoading(false);
        return true;
      } else {
        toast.error(response.message || 'Login failed');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const signup = async (username: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await api('/signup', {
        method: 'POST',
        body: { username, email, password },
      });

      if (response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        toast.success('Signup successful');
        setIsLoading(false);
        return true;
      } else {
        toast.error(response.message || 'Signup failed');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Signup error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api('/logout');
      
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = user?.is_admin || false;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isAdmin,
        login,
        signup,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
