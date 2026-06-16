import { type SupabaseClient, type User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Shared types and dependency seams for the auth modules under `src/lib/auth`.
 *
 * These modules contain no React imports and no module-level side effects, so
 * they can be unit-tested by injecting fakes (see `farm-access.test.ts` for the
 * dependency-injection pattern). The runtime React glue lives in
 * `useSupabaseAuth`, which builds these deps from the real Supabase client,
 * `sonner`'s `toast`, and `posthog-js`.
 */

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

// --- Operation parameter types (kept identical to the pre-extraction hook) ---

export interface SignInWithEmailParams {
  email: string
  password: string
}

export interface SignUpWithEmailParams {
  email: string
  password: string
  confirmPassword?: string
  firstName?: string
  lastName?: string
}

export interface ResetPasswordParams {
  email: string
}

export interface VerifyOtpParams {
  email: string
  token: string
  otpType?: 'email' | 'recovery' | 'invite' | 'email_change'
}

export interface SendPhoneOtpParams {
  phone: string // E.164, e.g. +919876543210
  firstName?: string
  lastName?: string
  // Defaults to true so the invite flow still creates the farmer account. The
  // login page passes false so an unknown number can't silently create an
  // orphaned account with no profile/org.
  shouldCreateUser?: boolean
}

export interface VerifyPhoneOtpParams {
  phone: string // E.164
  token: string
}

export interface SignInWithGoogleParams {
  redirectTo?: string
}

// --- Operation result types (identical to the shapes returned today) ---

export type SignInWithEmailResult =
  | { success: true; user: User }
  | { success: false; error: string }

export type SignUpWithEmailResult =
  | { success: true; user: User | null; needsOtpVerification: boolean }
  | { success: false; error: string }

export type VerifyOtpResult =
  | { success: true; user: User | null }
  | { success: false; error: string }

export type SendPhoneOtpResult = { success: true } | { success: false; error: string }

export type VerifyPhoneOtpResult =
  | { success: true; user: User | null }
  | { success: false; error: string }

export type SignInWithGoogleResult = { success: true } | { success: false; error: string }

export type ResendVerificationEmailResult =
  | { success: true; message: string }
  | { success: false; error: string }

export type ResetPasswordResult =
  | { success: true; message: string }
  | { success: false; error: string }

export type SignOutResult = { success: true } | { success: false; error: string }

// --- Name validation ---

export interface SanitizedNameResult {
  isValid: boolean
  value?: string
  error?: string
}

// --- Dependency seams ---

/**
 * Structural supertype satisfied by the real `toast` from `sonner`. Only the
 * two channels the auth flows use are required.
 */
export interface ToastSeam {
  success: (message: string) => void
  error: (message: string) => void
}

/**
 * Structural supertype satisfied by the real `posthog` client. Only the
 * identity / capture methods the auth flows use are required.
 */
export interface PosthogSeam {
  identify: (distinctId: string | undefined, properties?: Record<string, any>) => void
  capture: (eventName: string, properties?: Record<string, any>) => void
  get_distinct_id: () => string
  reset: () => void
}

/**
 * A Supabase browser client typed the same way `createClient()` is in
 * `src/lib/supabase.ts`. Tests inject a fake by casting via `as unknown as`.
 */
export type SupabaseAuthClient = SupabaseClient<Database>

/**
 * Dependencies injected into every auth operation. Keeping these as parameters
 * (instead of importing them at module scope) is what makes the operations
 * unit-testable without React or a live Supabase instance.
 */
export interface AuthOperationDeps {
  supabase: SupabaseAuthClient
  toast: ToastSeam
  posthog: PosthogSeam
}

/**
 * Dependencies for the session/identity transition unit.
 */
export interface SessionDeps {
  supabase: SupabaseAuthClient
  posthog: PosthogSeam
}

export interface InitialUserResult {
  user: User | null
  error: string | null
}

export interface AuthStateChangeResult {
  user: User | null
}
