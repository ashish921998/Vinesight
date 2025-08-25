"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sprout, Calculator, FileText } from "lucide-react";
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
      href: "/farms"
    },
    {
      title: "Calculators",
      description: "Scientific calculations for irrigation and nutrients",
      icon: Calculator,
      href: "/calculators"
    },
    {
      title: "Farm Journal",
      description: "Track daily operations and activities",
      icon: FileText,
      href: "/journal"
    }
  ];

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

      {/* Mobile Quick Actions - Only show on mobile */}
      <div className="lg:hidden px-3 mb-6">
        <QuickActions />
      </div>

      {/* Main Features - Only show on desktop */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6 px-3 mb-8">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="hover:shadow-md transition-shadow border-green-100">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg text-gray-900">{feature.title}</CardTitle>
                </div>
                <CardDescription className="text-gray-600">{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => window.location.href = feature.href}
                >
                  Open
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Get Started Section */}
      {!user && (
        <div className="px-3 mt-8">
          <Card className="max-w-md mx-auto border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <CardTitle className="text-green-800">Start Your Journey</CardTitle>
              <CardDescription className="text-green-700">
                Join thousands of grape farmers using VineSight
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Button disabled className="w-full h-12 bg-green-600">
                  Loading...
                </Button>
              ) : (
                <LoginButton className="w-full h-12 bg-green-600 hover:bg-green-700 text-white">
                  Get Started
                </LoginButton>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Welcome Back Section */}
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
    </div>
  );
}
