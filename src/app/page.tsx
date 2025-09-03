"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sprout, Calculator, FileText, Lock, CheckCircle } from "lucide-react";
import { LoginButton } from "@/components/auth/LoginButton";
import { QuickActions } from "@/components/mobile/QuickActions";
import { FarmerDashboard } from "@/components/dashboard/FarmerDashboard";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { SEOSchema } from "@/components/SEOSchema";

export default function Home() {
  const { user, loading } = useSupabaseAuth();
  
  const features = [
    {
      title: "Farm Management",
      description: "Manage your grape farms and vineyard details",
      icon: Sprout,
      href: "/farms",
      requiresAuth: true
    },
    {
      title: "Calculators",
      description: "Scientific calculations for irrigation and nutrients",
      icon: Calculator,
      href: "/calculators",
      requiresAuth: false
    },
    {
      title: "Farm Journal",
      description: "Track daily operations and activities", 
      icon: FileText,
      href: "/journal",
      requiresAuth: true
    }
  ];

  const handleFeatureClick = (feature: typeof features[0]) => {
    if (feature.requiresAuth && !user) {
      // Redirect to auth page with return URL
      window.location.href = `/auth?return=${encodeURIComponent(feature.href)}`;
    } else {
      window.location.href = feature.href;
    }
  };

  // If user is authenticated, show the comprehensive dashboard
  if (user) {
    return <FarmerDashboard />;
  }

  return (
    <>
      <SEOSchema 
        type="homepage"
        title="FarmAI - AI-Powered Smart Farm Management System"
        description="Transform your farming operations with AI-driven crop monitoring, yield prediction, disease detection, and automation for modern agriculture."
        url="/"
        image="https://farmai.vercel.app/og-image.png"
      />
      <div className="container mx-auto">
        {/* Header */}
        <header className="text-center mb-8 px-3">
          <h1 className="text-3xl font-bold text-primary mb-2">
            🧠 FarmAI
          </h1>
          <p className="text-muted-foreground">
            AI-Powered Smart Farm Management System
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Precision Agriculture • Crop Monitoring • Yield Prediction • Disease Detection
          </p>
        </header>

      {/* Main Features - Only show on desktop */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6 px-3 mb-8">
        {features.map((feature) => {
          const Icon = feature.icon;
          const isLocked = feature.requiresAuth && !user;
          
          return (
            <Card key={feature.title} className={`hover:shadow-md transition-shadow ${
              isLocked ? 'border-border bg-muted' : 'border-secondary'
            }`}>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isLocked ? 'bg-muted' : 'bg-secondary'
                  }`}>
                    {isLocked ? (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Icon className={`h-5 w-5 ${isLocked ? 'text-muted-foreground' : 'text-primary'}`} />
                    )}
                  </div>
                  <CardTitle className={`text-lg ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {feature.title}
                  </CardTitle>
                </div>
                <CardDescription className={isLocked ? 'text-muted-foreground' : 'text-muted-foreground'}>
                  {feature.description}
                </CardDescription>
                {isLocked && (
                  <div className="flex items-center gap-1 text-xs text-destructive bg-secondary px-2 py-1 rounded">
                    <Lock className="h-3 w-3" />
                    Sign in required
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <Button 
                  className={`w-full ${
                    isLocked 
                      ? 'bg-muted hover:bg-muted text-muted-foreground' 
                      : 'bg-primary hover:bg-primary text-primary-foreground'
                  }`}
                  onClick={() => handleFeatureClick(feature)}
                >
                  {isLocked ? 'Sign in to Access' : 'Open'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Get Started Section - Only show for unauthenticated users */}
      {!user && (
        <div className="px-3 mt-8">
          <Card className="max-w-md mx-auto border-secondary bg-secondary">
            <CardHeader className="text-center">
              <CardTitle className="text-secondary-foreground">Start Your Journey</CardTitle>
              <CardDescription className="text-secondary-foreground">
                Sign in to access all farming features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-secondary-foreground">
                <div className="font-medium mb-2">What you can do:</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    <span>Use farming calculators (no sign-in needed)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>Manage farms & records (sign-in required)</span>
                  </div>
                </div>
              </div>
              {loading ? (
                <Button disabled className="w-full h-12 bg-primary">
                  Loading...
                </Button>
              ) : (
                <div className="space-y-2">
                  <LoginButton className="w-full h-12 hover:bg-green-700">
                    Sign In to Get Started
                  </LoginButton>
                  <Button 
                    variant="outline" 
                    className="w-full border-green-300 text-green-700 hover:bg-green-50"
                    onClick={() => window.location.href = '/calculators'}
                  >
                    Try Calculators First
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}


      {/* Quick Feature Access for Mobile - Unauthenticated */}
      {!user && (
        <div className="lg:hidden px-3 mt-6 space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start h-14 border-green-200 hover:bg-green-50"
            onClick={() => window.location.href = '/calculators'}
          >
            <Calculator className="h-5 w-5 mr-3 text-green-600" />
            <div className="text-left">
              <div className="font-medium text-green-800">Try Calculators</div>
              <div className="text-xs text-green-600">No sign-in needed</div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start h-14 border-gray-200 bg-gray-50"
            onClick={() => window.location.href = '/auth'}
          >
            <Lock className="h-5 w-5 mr-3 text-gray-400" />
            <div className="text-left">
              <div className="font-medium text-gray-600">Farm Management</div>
              <div className="text-xs text-gray-500">Sign-in required</div>
            </div>
          </Button>
        </div>
      )}
      </div>
    </>
  );
}