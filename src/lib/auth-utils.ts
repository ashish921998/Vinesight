/**
 * Auth utility functions for handling authentication errors and cleanup
 */

import { getSupabaseClient } from './supabase';

/**
 * Clear all authentication data from browser storage
 * This helps resolve refresh token issues
 */
export async function clearAuthStorage(): Promise<void> {
  try {
    // Clear Supabase session
    const supabase = getSupabaseClient();
    await supabase.auth.signOut({ scope: 'local' });

    // Clear localStorage items related to auth
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || 
      key.includes('auth') || 
      key.includes('session') ||
      key.includes('token')
    );
    
    authKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear sessionStorage items
    const sessionAuthKeys = Object.keys(sessionStorage).filter(key =>
      key.includes('supabase') ||
      key.includes('auth') ||
      key.includes('session') ||
      key.includes('token')
    );

    sessionAuthKeys.forEach(key => {
      sessionStorage.removeItem(key);
    });

    console.log('Auth storage cleared successfully');
  } catch (error) {
    console.error('Error clearing auth storage:', error);
  }
}

/**
 * Check if error is a refresh token error
 */
export function isRefreshTokenError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message || error.error_description || '';
  return (
    errorMessage.includes('refresh_token_not_found') ||
    errorMessage.includes('Invalid Refresh Token') ||
    errorMessage.includes('refresh token not found') ||
    errorMessage.includes('invalid_grant')
  );
}

/**
 * Handle refresh token errors by clearing storage and redirecting
 */
export async function handleRefreshTokenError(): Promise<void> {
  console.log('Handling refresh token error - clearing auth state');
  await clearAuthStorage();
  
  // Redirect to auth page if not already there
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
    window.location.href = '/auth?message=session_expired';
  }
}