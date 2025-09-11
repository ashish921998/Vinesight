"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useSearchParams } from 'next/navigation';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase';
import { clearAllAppStorage } from '@/lib/storage';

function AuthCodeErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const { user, loading } = useSupabaseAuth();

  // If user is actually authenticated, redirect to home
  useEffect(() => {
    if (user && !loading) {
      window.location.href = '/';
    }
  }, [user, loading]);

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'exchange_failed':
        return 'Failed to exchange authorization code. This might be a temporary issue.';
      case 'no_code':
        return 'No authorization code received from the authentication provider.';
      case 'access_denied':
        return 'You denied access to the application. Please try again if you want to sign in.';
      case 'unexpected':
        return 'An unexpected error occurred during authentication.';
      default:
        return 'There was an error during the authentication process. This is often resolved by trying again.';
    }
  };

  const handleRetry = async () => {
    // Clear any stored auth state using Supabase's proper signOut method
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback: clear app storage namespaces only
      clearAllAppStorage();
    }
    window.location.href = '/';
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div>Checking authentication status...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-xl">Authentication Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {getErrorMessage(error)}
          </p>
          {error && (
            <p className="text-xs text-gray-500">
              Error code: {error}
            </p>
          )}
          <div className="space-y-2">
            <Button 
              onClick={handleRefresh}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
            <Button 
              onClick={handleRetry}
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthCodeError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div>Loading...</div>
      </div>
    }>
      <AuthCodeErrorContent />
    </Suspense>
  );
}