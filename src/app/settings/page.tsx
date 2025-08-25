"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Languages, 
  LogOut,
  User,
  Palette,
  Bell,
  Shield,
  HelpCircle
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [language, setLanguage] = useState('en');
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    // Load saved language preference
    const savedLang = localStorage.getItem('vinesight-language') || 'en';
    setLanguage(savedLang);
    
    // Load notification preference
    const savedNotifications = localStorage.getItem('vinesight-notifications');
    setNotifications(savedNotifications !== 'false');
  }, []);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem('vinesight-language', newLang);
  };

  const handleNotificationToggle = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    localStorage.setItem('vinesight-notifications', newValue.toString());
  };

  const handleSignOut = async () => {
    try {
      setSignOutLoading(true);
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out. Please try again.');
    } finally {
      setSignOutLoading(false);
    }
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-green-800 mb-2 flex items-center justify-center gap-2">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-gray-600">
          Manage your preferences and account
        </p>
      </header>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        
        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>
              Your profile and authentication settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-green-900">
                        {user.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-sm text-green-600 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  disabled={signOutLoading}
                  className="w-full flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {signOutLoading ? 'Signing out...' : 'Sign Out'}
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">Not signed in</p>
                <Button onClick={() => window.location.href = '/auth'}>
                  Sign In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Languages className="h-5 w-5" />
              Language
            </CardTitle>
            <CardDescription>
              Choose your preferred language
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-3">Current Language</p>
              <Badge variant="outline" className="text-sm">
                {languages.find(l => l.code === language)?.flag} {languages.find(l => l.code === language)?.name}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {languages.map((lang) => (
                <Button
                  key={lang.code}
                  variant={language === lang.code ? "default" : "outline"}
                  onClick={() => handleLanguageChange(lang.code)}
                  className="w-full justify-start"
                >
                  <span className="mr-2">{lang.flag}</span>
                  {lang.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Manage your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-gray-600">Get notified about important updates</p>
              </div>
              <Button
                variant={notifications ? "default" : "outline"}
                onClick={handleNotificationToggle}
                size="sm"
              >
                {notifications ? 'On' : 'Off'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the app appearance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" disabled>
                <Palette className="h-4 w-4 mr-2" />
                Light Theme (Default)
              </Button>
              <p className="text-xs text-gray-500">Dark theme coming soon</p>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
            <CardDescription>
              Your data protection settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium text-sm">Your Data is Safe</span>
                </div>
                <p className="text-sm text-blue-700">
                  All farm data is stored locally on your device and encrypted.
                </p>
              </div>
              <Button variant="outline" className="w-full" disabled>
                <Shield className="h-4 w-4 mr-2" />
                Data Export (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help & Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <HelpCircle className="h-5 w-5" />
              Help & Support
            </CardTitle>
            <CardDescription>
              Get help and contact support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" disabled>
                <HelpCircle className="h-4 w-4 mr-2" />
                User Guide (Coming Soon)
              </Button>
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600 text-center">
                  VineSight v1.0.0 MVP
                </p>
                <p className="text-xs text-gray-500 text-center mt-1">
                  Built for Indian grape farmers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}