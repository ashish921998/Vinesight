"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sprout } from 'lucide-react';
import { LoginButton } from '@/components/auth/LoginButton';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

function AuthPageContent() {
  const { user } = useSupabaseAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const returnUrl = searchParams.get('return') || '/';
      router.push(returnUrl);
    }
  }, [user, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Sprout className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome to VineSight
            </h1>
            <p className="text-gray-600 mt-2">
              Sign in with Google to access your farming assistant
            </p>
          </div>

          {/* Google OAuth */}
          <LoginButton className="h-12 bg-green-600 hover:bg-green-700">
            Continue with Google
          </LoginButton>

          {/* Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              By signing in, you agree to our terms and can access all farming features including AI assistance, farm management, and calculators.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Sprout className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-green-600" />
            <p className="text-gray-600 mt-2">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}