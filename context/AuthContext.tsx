"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient, supabase } from '@/lib/supabase';
import { isRefreshTokenError, handleRefreshTokenError } from '@/lib/auth-utils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ data: any; error: AuthError | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          
          // Enhanced error logging for production debugging
          if (process.env.NODE_ENV === 'production') {
            console.error('Session error details:', {
              message: error.message,
              status: error.status,
              url: window.location.href,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString()
            });
          }
          
          // Handle refresh token errors
          if (isRefreshTokenError(error)) {
            await handleRefreshTokenError();
            setSession(null);
            setUser(null);
          }
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        
        // Enhanced error logging for mobile debugging
        if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
          console.error('Auth initialization details:', {
            error: error instanceof Error ? error.message : String(error),
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            hasSupabase: !!supabase
          });
        }
        
        // Clear session on any auth error
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    try {
      const supabase = getSupabaseClient();
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth event:', event, session);
          
          // Handle specific auth events
          if (event === 'TOKEN_REFRESHED' && !session) {
            // Token refresh failed, clear session
            console.log('Token refresh failed, clearing session');
            setSession(null);
            setUser(null);
          } else if (event === 'SIGNED_OUT' || !session) {
            // User signed out or session is null
            setSession(null);
            setUser(null);
          } else {
            // Valid session
            setSession(session);
            setUser(session?.user ?? null);
          }
          setLoading(false);
        }
      );

      return () => {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from auth changes:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      return () => {};
    }
  }, []);

  const signInWithGoogle = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      return { data, error };
    } catch (error) {
      console.error('Google sign-in error:', error);
      return { data: null, error: error as AuthError };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      console.error('Email sign-in error:', error);
      return { data: null, error: error as AuthError };
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      console.error('Email sign-up error:', error);
      return { data: null, error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error as AuthError };
    }
  };

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};