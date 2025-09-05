"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FarmerDashboard } from "@/components/dashboard/FarmerDashboard";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function DashboardPage() {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();

  // Redirect unauthenticated users to homepage
  useEffect(() => {
    if (!user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't show dashboard if user is not logged in (will redirect)
  if (!user) {
    return null;
  }

  return <FarmerDashboard />;
}