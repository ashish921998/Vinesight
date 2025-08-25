"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sprout, Calculator, FileText, Lock, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { LoginButton } from "@/components/auth/LoginButton";
import { QuickActions } from "@/components/mobile/QuickActions";

export default function Home() {
  const { user, loading } = useAuth();
  
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

  return (
    <div className="container mx-auto">
      {/* Header */}
      <header className="text-center mb-8 px-3">
        <h1 className="text-3xl font-bold text-green-800 mb-2">
          🍇 VineSight
        </h1>
        <p className="text-gray-600">
          Your digital grape farming companion
        </p>
      </header>

      {/* User Status */}
      {user && (
        <div className="px-3 mb-6">
          <div className="max-w-md mx-auto p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Signed in as {user.user_metadata?.full_name || user.email}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Quick Actions - Only show for authenticated users */}
      {user && (
        <div className="lg:hidden px-3 mb-6">
          <QuickActions />
        </div>
      )}

      {/* Main Features - Only show on desktop */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6 px-3 mb-8">
        {features.map((feature) => {
          const Icon = feature.icon;
          const isLocked = feature.requiresAuth && !user;
          
          return (
            <Card key={feature.title} className={`hover:shadow-md transition-shadow ${
              isLocked ? 'border-gray-200 bg-gray-50' : 'border-green-100'
            }`}>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isLocked ? 'bg-gray-100' : 'bg-green-100'
                  }`}>
                    {isLocked ? (
                      <Lock className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Icon className={`h-5 w-5 ${isLocked ? 'text-gray-400' : 'text-green-600'}`} />
                    )}
                  </div>
                  <CardTitle className={`text-lg ${isLocked ? 'text-gray-500' : 'text-gray-900'}`}>
                    {feature.title}
                  </CardTitle>
                </div>
                <CardDescription className={isLocked ? 'text-gray-400' : 'text-gray-600'}>
                  {feature.description}
                </CardDescription>
                {isLocked && (
                  <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    <Lock className="h-3 w-3" />
                    Sign in required
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <Button 
                  className={`w-full ${
                    isLocked 
                      ? 'bg-gray-300 hover:bg-gray-400 text-gray-600' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
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
          <Card className="max-w-md mx-auto border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <CardTitle className="text-green-800">Start Your Journey</CardTitle>
              <CardDescription className="text-green-700">
                Sign in to access all farming features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-green-700">
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
                <Button disabled className="w-full h-12 bg-green-600">
                  Loading...
                </Button>
              ) : (
                <div className="space-y-2">
                  <LoginButton className="w-full h-12 bg-green-600 hover:bg-green-700 text-white">
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

      {/* Welcome Back Section - Only show for authenticated users on mobile */}
      {user && (
        <div className="px-3 mt-8 lg:hidden">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold text-green-800 mb-2">Welcome back!</h3>
              <p className="text-green-700 text-sm mb-4">
                Ready to manage your vineyard?
              </p>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => window.location.href = "/farms"}
              >
                Go to My Farms
              </Button>
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
  );
}