// Auth Context - Provides authentication state across the app
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState } from '@/types/blog';
import { getAuthState, login as apiLogin, logout as apiLogout, initializeData } from '@/lib/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await initializeData();
      const state = await getAuthState();
      setAuthState(state);
      setIsLoading(false);
    };
    init();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = true): Promise<boolean> => {
    const result = await apiLogin(email, password, rememberMe);
    if (result) {
      setAuthState(result);
      return true;
    }
    return false;
  };

  const logout = () => {
    apiLogout();
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
