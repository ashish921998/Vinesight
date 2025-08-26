"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-10">
        <div className="p-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Settings</h1>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="p-4 space-y-3">
        
        {/* Account Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user ? (
              <>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-green-900 text-sm">
                        {user.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-green-600 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  disabled={signOutLoading}
                  className="w-full flex items-center gap-2 h-9"
                  size="sm"
                >
                  <LogOut className="h-4 w-4" />
                  {signOutLoading ? 'Signing out...' : 'Sign Out'}
                </Button>
              </>
            ) : (
              <div className="text-center py-6">
                <User className="h-8 w-8 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-3 text-sm">Not signed in</p>
                <Button onClick={() => window.location.href = '/auth'} size="sm">
                  Sign In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Languages className="h-4 w-4" />
              Language
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                variant={language === lang.code ? "default" : "outline"}
                onClick={() => handleLanguageChange(lang.code)}
                className="w-full justify-start h-9"
                size="sm"
              >
                <span className="mr-2">{lang.flag}</span>
                {lang.name}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Push Notifications</p>
                <p className="text-xs text-gray-600">Important updates</p>
              </div>
              <Button
                variant={notifications ? "default" : "outline"}
                onClick={handleNotificationToggle}
                size="sm"
                className="h-8 px-3"
              >
                {notifications ? 'On' : 'Off'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-start h-9" size="sm" disabled>
              <Palette className="h-4 w-4 mr-2" />
              Light Theme
            </Button>
            <p className="text-xs text-gray-500 mt-2">Dark theme coming soon</p>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 mb-1">
                <Shield className="h-4 w-4" />
                <span className="font-medium text-sm">Data is Safe</span>
              </div>
              <p className="text-xs text-blue-700">
                All data stored locally and encrypted
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Help & Support */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="h-4 w-4" />
              About
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-sm text-gray-600">VineSight v1.0.0</p>
              <p className="text-xs text-gray-500 mt-1">Built for grape farmers</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}