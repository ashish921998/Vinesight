"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../../../context/AuthContext';
import { Loader2 } from 'lucide-react';
import { EmailAuthForm } from './EmailAuthForm';

interface LoginButtonProps {
  className?: string;
  children?: React.ReactNode;
  showForm?: boolean;
}

export function LoginButton({ className, children, showForm = false }: LoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(showForm);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Error signing in:', error);
      }
    } catch (error) {
      console.error('Error signing in:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showEmailAuth) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{authMode === 'signin' ? 'Sign In' : 'Sign Up'}</CardTitle>
          <CardDescription>
            {authMode === 'signin' 
              ? 'Sign in to your account' 
              : 'Create a new account'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EmailAuthForm 
            mode={authMode} 
            onToggleMode={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
          />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in with Google
          </Button>

          <Button 
            onClick={() => setShowEmailAuth(false)}
            variant="ghost"
            className="w-full"
          >
            Back to simple login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Button 
        onClick={handleGoogleSignIn}
        disabled={loading}
        variant="outline"
        className="w-full"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children || (loading ? 'Signing in...' : 'Sign in with Google')}
      </Button>
      
      <Button
        onClick={() => setShowEmailAuth(true)}
        variant="ghost"
        className="w-full text-sm"
      >
        Or sign in with email
      </Button>
    </div>
  );
}