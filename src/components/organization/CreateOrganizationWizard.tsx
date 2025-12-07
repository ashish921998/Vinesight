'use client'

/**
 * CreateOrganizationWizard - Multi-step wizard to create a new organization
 * Converts individual user to organization structure
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { organizationService } from '@/lib/organization-service'
import { getSupabaseClient } from '@/lib/supabase'
import type { OrganizationType, SubscriptionTier } from '@/types/rbac'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  ArrowRight,
  ArrowLeft,
  Check,
  Users,
  Package,
  CreditCard,
  AlertCircle
} from 'lucide-react'

const STEPS = [
  { id: 1, name: 'Basic Info', icon: Building2 },
  { id: 2, name: 'Details', icon: Users },
  { id: 3, name: 'Subscription', icon: CreditCard }
]

export function CreateOrganizationWizard() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    type: 'business' as OrganizationType,
    subscriptionTier: 'business' as SubscriptionTier,
    registrationNumber: '',
    taxId: '',
    address: '',
    contactEmail: '',
    contactPhone: ''
  })

  const handleCreate = async () => {
    setCreating(true)
    setError(null)

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Please sign in to create an organization')
        setCreating(false)
        return
      }

      const org = await organizationService.createOrganization({
        name: formData.name,
        type: formData.type,
        subscriptionTier: formData.subscriptionTier,
        registrationNumber: formData.registrationNumber || undefined,
        taxId: formData.taxId || undefined,
        address: formData.address || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
        createdBy: user.id
      })

      if (org) {
        // Redirect to organization settings or dashboard
        router.push('/organization/settings')
      } else {
        setError('Failed to create organization')
      }
    } catch (err) {
      console.error('Error creating organization:', err)
      setError('An error occurred while creating the organization')
    } finally {
      setCreating(false)
    }
  }

  const canGoNext = () => {
    if (currentStep === 1) {
      return formData.name.trim().length > 0 && formData.type
    }
    if (currentStep === 2) {
      return true // Optional fields
    }
    if (currentStep === 3) {
      return formData.subscriptionTier
    }
    return false
  }

  const progress = (currentStep / STEPS.length) * 100

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id

            return (
              <div
                key={step.id}
                className={`flex items-center gap-2 ${
                  isActive
                    ? 'text-primary'
                    : isCompleted
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    isActive
                      ? 'border-primary bg-primary/10'
                      : isCompleted
                        ? 'border-green-600 bg-green-100'
                        : 'border-muted bg-background'
                  }`}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className="text-sm font-medium hidden sm:block">{step.name}</span>
              </div>
            )
          })}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && 'Create Your Organization'}
            {currentStep === 2 && 'Organization Details'}
            {currentStep === 3 && 'Choose Your Plan'}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && 'Start by providing basic information about your organization'}
            {currentStep === 2 && 'Add optional details to complete your organization profile'}
            {currentStep === 3 && 'Select the subscription tier that fits your needs'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  placeholder="My Vineyard Enterprise"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  This will be visible to all members of your organization
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Organization Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as OrganizationType })
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">
                      <div className="flex flex-col gap-1 py-1">
                        <span className="font-medium">Business</span>
                        <span className="text-xs text-muted-foreground">
                          Small to medium agricultural business
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="enterprise">
                      <div className="flex flex-col gap-1 py-1">
                        <span className="font-medium">Enterprise</span>
                        <span className="text-xs text-muted-foreground">
                          Large-scale agricultural corporation
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    placeholder="REG123456"
                    value={formData.registrationNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, registrationNumber: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / GSTIN</Label>
                  <Input
                    id="taxId"
                    placeholder="29AABCU9603R1ZV"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter organization address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="contact@organization.com"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  These details are optional but recommended for enterprise customers
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 3: Subscription */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Business Tier */}
                <Card
                  className={`cursor-pointer transition-all ${
                    formData.subscriptionTier === 'business'
                      ? 'border-primary ring-2 ring-primary'
                      : 'border-muted'
                  }`}
                  onClick={() => setFormData({ ...formData, subscriptionTier: 'business' })}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Business
                      {formData.subscriptionTier === 'business' && (
                        <Badge className="bg-primary">Selected</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>For small to medium teams</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-3xl font-bold">
                        ₹2,999
                        <span className="text-base font-normal text-muted-foreground">/month</span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Up to 10 users</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Up to 50 farms</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>7 standard roles</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Basic audit logs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Priority support</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enterprise Tier */}
                <Card
                  className={`cursor-pointer transition-all ${
                    formData.subscriptionTier === 'enterprise'
                      ? 'border-primary ring-2 ring-primary'
                      : 'border-muted'
                  }`}
                  onClick={() => setFormData({ ...formData, subscriptionTier: 'enterprise' })}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Enterprise
                      {formData.subscriptionTier === 'enterprise' && (
                        <Badge className="bg-primary">Selected</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>For large organizations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-3xl font-bold">
                        ₹9,999
                        <span className="text-base font-normal text-muted-foreground">/month</span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Unlimited users</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Unlimited farms</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Custom roles</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Advanced audit trails</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>SSO integration</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>API access</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Dedicated support</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1 || creating}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canGoNext() || creating}
                className="gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={!canGoNext() || creating} className="gap-2">
                {creating ? 'Creating...' : 'Create Organization'}
                <Building2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
