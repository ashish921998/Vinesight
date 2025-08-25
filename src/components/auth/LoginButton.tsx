"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface LoginButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function LoginButton({ className, children }: LoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();

  const handleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Error signing in:', error);
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error signing in:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSignIn}
      disabled={loading}
      className={className}
      variant="outline"
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children || (loading ? 'Signing in...' : 'Sign in with Google')}
    </Button>
  );
}