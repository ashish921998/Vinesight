import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import type { AuthStateChangeResult, InitialUserResult, SessionDeps } from './types'

/**
 * Resolves the initial authenticated user via `supabase.auth.getUser()` (secure
 * verification). The three cases mirror the original hook behavior:
 *
 * 1. A user is present → return it.
 * 2. `Auth session missing!` / `AuthSessionMissingError` → treated as a logged
 *    out state (NOT an error), returns `{ user: null, error: null }`.
 * 3. Any other error → returns the error message.
 */
export async function resolveInitialUser(deps: SessionDeps): Promise<InitialUserResult> {
  const { supabase } = deps

  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    if (error) {
      // "Auth session missing!" means no session exists - this is expected when not logged in
      // Don't treat this as an error, just set user to null
      if (error.message === 'Auth session missing!' || error.name === 'AuthSessionMissingError') {
        return { user: null, error: null }
      }

      console.error('Auth error:', error.message, error.name)
      return { user: null, error: error.message }
    }

    return { user: user ?? null, error: null }
  } catch (err) {
    return {
      user: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Maps an `onAuthStateChange` event to the next session user state and keeps
 * PostHog's identity in sync. This is the single chokepoint for auth identity:
 *
 * - On an authenticated session, `identify` is called only when the PostHog
 *   distinct id differs from the session user's id (guard against redundant
 *   identify calls).
 * - On `SIGNED_OUT`, `reset()` clears identity so a shared browser doesn't
 *   leak the previous user.
 *
 * Only the `user` slice of auth state changes here — loading/error are owned by
 * the hook, mirroring the original behavior.
 */
export function reduceAuthStateChange(
  event: AuthChangeEvent,
  session: Session | null,
  deps: Pick<SessionDeps, 'posthog'>
): AuthStateChangeResult {
  const { posthog } = deps
  const sessionUser: User | null = session?.user ?? null

  // Keep PostHog's distinct_id in sync with the authenticated user so every
  // event is attributed to a stable unique identifier across all entry paths —
  // email login, Google OAuth, phone OTP, and session restore. The id guard
  // avoids redundant identify calls. This is the single chokepoint for auth
  // identity: email/phone person properties are attached here rather than in the
  // verify operations (which no longer call identify). The consultant layout
  // separately augments the same person with org/role properties. Reset on
  // sign-out so the next user on a shared browser doesn't inherit this identity.
  if (sessionUser) {
    if (posthog.get_distinct_id() !== sessionUser.id) {
      const personProperties: Record<string, string> = {}
      if (sessionUser.email) personProperties.email = sessionUser.email
      if (sessionUser.phone) personProperties.phone = sessionUser.phone
      posthog.identify(sessionUser.id, personProperties)
    }
  } else if (event === 'SIGNED_OUT') {
    posthog.reset()
  }

  return { user: sessionUser }
}
