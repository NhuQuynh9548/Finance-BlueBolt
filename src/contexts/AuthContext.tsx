import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from './AppContext';
import { authService } from '../services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { token, user } = await authService.login(email, password);

      // Store token and user in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify(user));

      setIsAuthenticated(true);
      setCurrentUser(user as User);

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setCurrentUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }
  };

  // Check token and verify user on mount
  React.useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('currentUser');

      if (token && storedUser) {
        try {
          // Verify token by fetching current user from API
          const user = await authService.getCurrentUser();
          setIsAuthenticated(true);
          setCurrentUser(user as User);
        } catch (error) {
          // Token invalid or expired
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
        }
      }

      setLoading(false);
    };

    verifyAuth();
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    currentUser,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
