'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, User, Building2, CheckCircle2, Coins, Trash2 } from 'lucide-react'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { getTypedSupabaseClient } from '@/lib/supabase'
import { toast } from 'sonner'

// Partial organization type for settings page - only uses id, name, slug
type OrganizationInfo = {
  id: string
  name: string
  slug: string | null
}

export default function SettingsPage() {
  const { user, signOut } = useSupabaseAuth()
  const router = useRouter()
  const [signOutLoading, setSignOutLoading] = useState(false)
  const [currencyPreference, setCurrencyPreference] = useState<
    'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD'
  >('INR')
  const [currencyLoading, setCurrencyLoading] = useState(false)

  // Organization Consultant State
  const [organizations, setOrganizations] = useState<OrganizationInfo[]>([])
  const [currentOrg, setCurrentOrg] = useState<OrganizationInfo | null>(null)
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [orgLoading, setOrgLoading] = useState(false)
  const [connectionLoading, setConnectionLoading] = useState(false)

  const [isOrgMember, setIsOrgMember] = useState(false)

  // Fetch available organizations
  const fetchOrganizations = useCallback(async () => {
    try {
      const response = await fetch('/api/organizations/list')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
      } else {
        console.error('Failed to fetch organizations:', response.status)
        toast.error('Failed to load organizations')
        setOrganizations([])
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Failed to fetch organizations:', errorMessage)
      toast.error('Failed to load organizations')
      setOrganizations([])
    }
  }, [])

  // Fetch current consultant status
  const fetchCurrentStatus = useCallback(async () => {
    if (!user) return
    try {
      setOrgLoading(true)
      const supabase = getTypedSupabaseClient()

      // Check if user has a consultant organization in their profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('consultant_organization_id')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        toast.error('Failed to fetch organization status')
        return
      }

      if (profile?.consultant_organization_id) {
        // Fetch the organization details
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, slug')
          .eq('id', profile.consultant_organization_id)
          .maybeSingle()

        if (orgError) {
          console.error('Error fetching organization:', orgError)
          toast.error('Failed to fetch organization details')
          return
        }

        if (org) {
          setCurrentOrg(org)
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error fetching status:', errorMessage)
      toast.error('Failed to fetch organization status')
    } finally {
      setOrgLoading(false)
    }
  }, [user])

  // Fetch user preferences
  const fetchPreferences = useCallback(async () => {
    if (!user) return
    try {
      const supabase = getTypedSupabaseClient()
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('currency_preference')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching preferences:', error)
        return
      }

      if (profile?.currency_preference) {
        setCurrencyPreference(
          profile.currency_preference as 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD'
        )
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error fetching preferences:', errorMessage)
    }
  }, [user])

  // Check if user is an org member (same logic as navigation)
  const checkOrgMembership = useCallback(async () => {
    if (!user) return
    try {
      const supabase = getTypedSupabaseClient()
      const { data, error } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (error) {
        console.error('Error checking org membership:', error)
        return
      }

      const isMember = data && data.length > 0
      setIsOrgMember(isMember)

      // Only fetch consultant options if NOT an org member
      if (!isMember) {
        fetchOrganizations()
        fetchCurrentStatus()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error checking status:', errorMessage)
    }
  }, [user, fetchOrganizations, fetchCurrentStatus])

  useEffect(() => {
    if (user) {
      checkOrgMembership()
      fetchPreferences()
    }
  }, [user, checkOrgMembership, fetchPreferences])

  const handleConnectConsultant = async () => {
    if (!user || !selectedOrgId) return

    try {
      setConnectionLoading(true)
      const response = await fetch('/api/organizations/add-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          organizationId: selectedOrgId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to connect')
        return
      }

      toast.success('Successfully connected to organization')
      fetchCurrentStatus()
      setSelectedOrgId('')

      // Refresh to update any other context if needed
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error connecting to organization:', errorMessage)
      toast.error('An unexpected error occurred')
    } finally {
      setConnectionLoading(false)
    }
  }

  const handleCurrencyChange = async (
    newCurrency: 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD'
  ) => {
    if (!user) return
    if (newCurrency === currencyPreference) return
    try {
      setCurrencyLoading(true)
      const supabase = getTypedSupabaseClient()

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ currency_preference: newCurrency })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating currency preference:', updateError)
        toast.error('Failed to update currency preference')
        return
      }

      setCurrencyPreference(newCurrency)
      toast.success(`Currency preference updated to ${newCurrency}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error updating currency preference:', errorMessage)
      toast.error('Failed to update currency preference')
    } finally {
      setCurrencyLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setSignOutLoading(true)
      const result = await signOut()
      if (result.success) {
        router.push('/')
      }
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out. Please try again.')
    } finally {
      setSignOutLoading(false)
    }
  }

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

          {/* Currency Preference */}
          {user && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Coins className="h-4 w-4" />
                  Currency Preference
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-500">
                  Choose your preferred currency for costs and expenses
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={currencyPreference === 'INR' ? 'default' : 'outline'}
                    onClick={() => handleCurrencyChange('INR')}
                    disabled={currencyLoading}
                    className="h-9"
                    size="sm"
                  >
                    ₹ INR
                  </Button>
                  <Button
                    variant={currencyPreference === 'USD' ? 'default' : 'outline'}
                    onClick={() => handleCurrencyChange('USD')}
                    disabled={currencyLoading}
                    className="h-9"
                    size="sm"
                  >
                    $ USD
                  </Button>
                  <Button
                    variant={currencyPreference === 'EUR' ? 'default' : 'outline'}
                    onClick={() => handleCurrencyChange('EUR')}
                    disabled={currencyLoading}
                    className="h-9"
                    size="sm"
                  >
                    € EUR
                  </Button>
                  <Button
                    variant={currencyPreference === 'GBP' ? 'default' : 'outline'}
                    onClick={() => handleCurrencyChange('GBP')}
                    disabled={currencyLoading}
                    className="h-9"
                    size="sm"
                  >
                    £ GBP
                  </Button>
                  <Button
                    variant={currencyPreference === 'AUD' ? 'default' : 'outline'}
                    onClick={() => handleCurrencyChange('AUD')}
                    disabled={currencyLoading}
                    className="h-9"
                    size="sm"
                  >
                    A$ AUD
                  </Button>
                  <Button
                    variant={currencyPreference === 'CAD' ? 'default' : 'outline'}
                    onClick={() => handleCurrencyChange('CAD')}
                    disabled={currencyLoading}
                    className="h-9"
                    size="sm"
                  >
                    C$ CAD
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Organization Consultant Settings - Only for Farmers (non-members) */}
          {!isOrgMember && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" />
                  Organization Consultant
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orgLoading ? (
                  <div className="text-sm text-gray-500">Loading status...</div>
                ) : currentOrg ? (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-xs text-blue-500 font-medium uppercase tracking-wide">
                          Connected to
                        </p>
                        <p className="font-medium text-blue-900">{currentOrg.name}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">
                      Select an organization to connect with as your consultant.
                    </p>
                    {organizations.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">
                        No organizations available at this time.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Organization" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          className="w-full"
                          onClick={handleConnectConsultant}
                          disabled={!selectedOrgId || connectionLoading}
                        >
                          {connectionLoading ? 'Connecting...' : 'Connect'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Danger Zone */}
          {user && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-red-600">
                  <Trash2 className="h-4 w-4" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-500">Irreversible and destructive actions</p>
                <Button
                  variant="destructive"
                  onClick={() => router.push('/delete-account')}
                  className="w-full"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
