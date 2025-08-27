"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if we have tokens in the URL fragment
        const hashFragment = window.location.hash.substring(1);
        const searchParams = new URLSearchParams(hashFragment);
        
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // console.log('Client callback processing:', { 
        //   hasAccessToken: !!accessToken, 
        //   hasRefreshToken: !!refreshToken, 
        //   error: error,
        //   fragment: hashFragment 
        // });

        // Handle errors
        if (error) {
          console.error('OAuth error in fragment:', error, errorDescription);
          router.push(`/auth/auth-code-error?error=${error}`);
          return;
        }

        // If we have tokens in fragment, set the session directly
        if (accessToken && refreshToken) {
          const supabase = getSupabaseClient();
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('Error setting session from tokens:', error);
            router.push(`/auth/auth-code-error?error=session_failed`);
            return;
          }

          if (data?.session) {
            console.log('Successfully authenticated user:', data.session.user.email);
            // Clear the fragment from URL and redirect to home
            window.history.replaceState({}, document.title, window.location.pathname);
            router.push('/');
            return;
          }
        }

        // If no tokens in fragment, let the server handle it (authorization code flow)
        // Convert current URL to let server-side handler process it
        const currentUrl = new URL(window.location.href);
        if (currentUrl.search) {
          // There are query parameters, let server handle it
          window.location.href = `/auth/callback${currentUrl.search}`;
          return;
        }

        // No tokens found anywhere
        console.error('No authentication tokens found in callback');
        router.push(`/auth/auth-code-error?error=no_tokens`);
        
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        router.push(`/auth/auth-code-error?error=unexpected`);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}