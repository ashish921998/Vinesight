'use client'

import type React from 'react'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2, Mail } from 'lucide-react'

interface SetPasswordCardProps {
  header: React.ReactNode
  subtitle: string
  email: string
  password: string
  onPasswordChange: (value: string) => void
  confirmPassword: string
  onConfirmPasswordChange: (value: string) => void
  submitting: boolean
  onSubmit: (e: React.FormEvent) => void
  footer?: React.ReactNode
}

// Shared "set a password to join" screen used by both member-invite flows: the logged-in
// invited (passwordless) user setting their first password, and the logged-out shared-link
// claim. The two differ only in their submit handler, subtitle, and optional footer — the
// form itself is identical, so it lives here once.
export function SetPasswordCard({
  header,
  subtitle,
  email,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  submitting,
  onSubmit,
  footer
}: SetPasswordCardProps) {
  const passwordsMismatch = password !== confirmPassword
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md">
        {header}
        <p className="text-center text-muted-foreground text-base font-normal font-sans -mt-4 mb-6">
          {subtitle}
        </p>

        <Card className="p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="member-email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="member-email"
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  className="w-full pl-9 min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                required
                minLength={6}
                placeholder="Create a password"
                label="Password"
              />
              <p className="mt-1 text-xs text-muted-foreground">Minimum 6 characters</p>
            </div>

            <div>
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => onConfirmPasswordChange(e.target.value)}
                required
                minLength={6}
                placeholder="Confirm password"
                label="Confirm password"
                error={passwordsMismatch && confirmPassword ? 'Passwords do not match' : undefined}
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || password.length < 6 || passwordsMismatch || !confirmPassword}
              className="w-full min-h-[48px]"
            >
              {submitting ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Joining organization…
                </div>
              ) : (
                'Set password & join'
              )}
            </Button>

            {footer}
          </form>
        </Card>
      </div>
    </div>
  )
}
