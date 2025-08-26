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
    let mounted = true;
    
    // Set up auth state listener first to catch any immediate changes
    const supabase = getSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session?.user?.id);
        
        if (!mounted) return; // Prevent state updates if component unmounted
        
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
        } else if (session) {
          // Valid session - this handles both SIGNED_IN and TOKEN_REFRESHED with valid session
          setSession(session);
          setUser(session.user);
        }
        
        if (event === 'INITIAL_SESSION') {
          // Only set loading to false after we've processed the initial session
          setLoading(false);
        }
      }
    );

    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return; // Prevent state updates if component unmounted
        
        if (error) {
          console.error('Error getting session:', error);
          
          // Handle refresh token errors
          if (isRefreshTokenError(error)) {
            await handleRefreshTokenError();
            setSession(null);
            setUser(null);
          } else {
            // For other errors, still clear the session
            setSession(null);
            setUser(null);
          }
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    return () => {
      mounted = false;
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from auth changes:', error);
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const supabase = getSupabaseClient();
      console.log('Initiating Google OAuth with redirect to:', `${window.location.origin}/auth/callback`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error('OAuth initiation error:', error);
      } else {
        console.log('OAuth initiation successful:', data);
      }
      
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