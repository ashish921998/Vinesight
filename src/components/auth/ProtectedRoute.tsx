"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginButton } from './LoginButton';
import { Loader2, Lock } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useSupabaseAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Development mode - bypass auth for local testing ONLY
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = mounted && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const bypassAuth = isDevelopment && isLocalhost && process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';

  // Show loading until component is mounted and auth check is complete
  if (!mounted || (loading && !bypassAuth)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user && !bypassAuth) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Lock className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-xl">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              You need to sign in to access this page. Please use Google to continue.
            </p>
            <LoginButton className="w-full">
              Sign in to continue
            </LoginButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}