import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { authService } from '../services/authService';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isSupabaseConnected: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const profile = await authService.getCurrentProfile();
      setUser(profile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    if (isSupabaseConfigured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async () => {
        await fetchUser();
      });
      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const data = await authService.signIn(email, password);
    await fetchUser();
    return data;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const data = await authService.signUp(email, password, fullName);
    await fetchUser();
    return data;
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSupabaseConnected: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        refreshProfile: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
