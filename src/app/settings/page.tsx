'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Languages, LogOut, User } from 'lucide-react'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function SettingsPage() {
  const { user, signOut } = useSupabaseAuth()
  const [language, setLanguage] = useState('en')
  const [signOutLoading, setSignOutLoading] = useState(false)

  useEffect(() => {
    // Load saved language preference
    const savedLang = localStorage.getItem('vinesight-language') || 'en'
    setLanguage(savedLang)
  }, [])

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    localStorage.setItem('vinesight-language', newLang)
  }

  const handleSignOut = async () => {
    try {
      setSignOutLoading(true)
      await signOut()
    } catch (error) {
      alert('Failed to sign out. Please try again.')
    } finally {
      setSignOutLoading(false)
    }
  }

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  ]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-10">
          <div className="p-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Profile</h1>
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
                        <p className="text-xs text-green-600 truncate">{user.email}</p>
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
                  <Button onClick={() => (window.location.href = '/auth')} size="sm">
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
                  variant={language === lang.code ? 'default' : 'outline'}
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
        </div>
      </div>
    </ProtectedRoute>
  )
}
