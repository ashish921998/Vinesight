import { describe, it, expect, vi } from 'vitest'
import { resolveInitialUser, reduceAuthStateChange } from '../auth/session'
import type {
  SessionDeps,
  PosthogSeam,
  SupabaseAuthClient,
  AuthStateChangeResult
} from '../auth/types'
import type { Session, User } from '@supabase/supabase-js'

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    ...overrides
  } as unknown as User
}

function mockSupabase(getUser: () => any): SupabaseAuthClient {
  return { auth: { getUser } } as unknown as SupabaseAuthClient
}

function mockPosthog(overrides: Partial<PosthogSeam> = {}): PosthogSeam & {
  calls: { identify: any[]; reset: any[]; capture: any[]; setPersonProperties: any[] }
} {
  const identify = vi.fn()
  const reset = vi.fn()
  const capture = vi.fn()
  const setPersonProperties = vi.fn()
  return {
    identify,
    reset,
    capture,
    setPersonProperties,
    get_distinct_id: vi.fn().mockReturnValue('anon'),
    ...overrides,
    calls: { identify, reset, capture, setPersonProperties }
  } as any
}

describe('resolveInitialUser', () => {
  it('returns the user when getUser() resolves with a session', async () => {
    const user = makeUser({ id: 'user-1' })
    const supabase = mockSupabase(async () => ({ data: { user }, error: null }))
    const deps: SessionDeps = { supabase, posthog: mockPosthog() }

    const result = await resolveInitialUser(deps)

    expect(result).toEqual({ user, error: null })
  })

  it('treats "Auth session missing!" as a logged-out state, not an error', async () => {
    const supabase = mockSupabase(async () => ({
      data: { user: null },
      error: { message: 'Auth session missing!', name: 'AuthSessionMissingError' }
    }))
    const deps: SessionDeps = { supabase, posthog: mockPosthog() }

    const result = await resolveInitialUser(deps)

    expect(result).toEqual({ user: null, error: null })
  })

  it('treats an AuthSessionMissingError name (without the message) as logged-out', async () => {
    const supabase = mockSupabase(async () => ({
      data: { user: null },
      error: { message: 'some other text', name: 'AuthSessionMissingError' }
    }))
    const deps: SessionDeps = { supabase, posthog: mockPosthog() }

    const result = await resolveInitialUser(deps)

    expect(result).toEqual({ user: null, error: null })
  })

  it('returns the error message for a generic auth error', async () => {
    const supabase = mockSupabase(async () => ({
      data: { user: null },
      error: { message: 'JWT expired', name: 'AuthRetryableError' }
    }))
    const deps: SessionDeps = { supabase, posthog: mockPosthog() }

    const result = await resolveInitialUser(deps)

    expect(result).toEqual({ user: null, error: 'JWT expired' })
  })

  it('returns a message when getUser() throws', async () => {
    const supabase = mockSupabase(async () => {
      throw new Error('network down')
    })
    const deps: SessionDeps = { supabase, posthog: mockPosthog() }

    const result = await resolveInitialUser(deps)

    expect(result).toEqual({ user: null, error: 'network down' })
  })

  it('falls back to a generic message when getUser() throws a non-Error', async () => {
    const supabase = mockSupabase(async () => {
      throw 'string error'
    })
    const deps: SessionDeps = { supabase, posthog: mockPosthog() }

    const result = await resolveInitialUser(deps)

    expect(result).toEqual({ user: null, error: 'An unexpected error occurred' })
  })
})

describe('reduceAuthStateChange', () => {
  function sessionWith(user: User | null): Session | null {
    if (!user) return null
    return {
      user,
      access_token: 'x',
      refresh_token: 'y',
      expires_in: 3600,
      token_type: 'bearer'
    } as unknown as Session
  }

  it('returns the session user and identifies a new identity', () => {
    const posthog = mockPosthog({ get_distinct_id: vi.fn().mockReturnValue('anon') as any })
    const user = makeUser({ id: 'user-1', email: 'a@b.com' })

    const result = reduceAuthStateChange('SIGNED_IN', sessionWith(user), { posthog })

    expect(result).toEqual({ user })
    expect(posthog.identify).toHaveBeenCalledTimes(1)
    expect(posthog.identify).toHaveBeenCalledWith('user-1', { email: 'a@b.com' })
    expect(posthog.reset).not.toHaveBeenCalled()
  })

  it('attaches phone PII (not email) when identifying a phone-only user', () => {
    const posthog = mockPosthog({ get_distinct_id: vi.fn().mockReturnValue('anon') as any })
    const user = makeUser({ id: 'user-phone', phone: '+919876543210' })

    const result = reduceAuthStateChange('SIGNED_IN', sessionWith(user), { posthog })

    expect(result).toEqual({ user })
    expect(posthog.identify).toHaveBeenCalledTimes(1)
    expect(posthog.identify).toHaveBeenCalledWith('user-phone', { phone: '+919876543210' })
    expect(posthog.reset).not.toHaveBeenCalled()
  })

  it('attaches both email and phone when the user has both', () => {
    const posthog = mockPosthog({ get_distinct_id: vi.fn().mockReturnValue('anon') as any })
    const user = makeUser({ id: 'user-both', email: 'a@b.com', phone: '+919876543210' })

    const result = reduceAuthStateChange('SIGNED_IN', sessionWith(user), { posthog })

    expect(result).toEqual({ user })
    expect(posthog.identify).toHaveBeenCalledTimes(1)
    expect(posthog.identify).toHaveBeenCalledWith('user-both', {
      email: 'a@b.com',
      phone: '+919876543210'
    })
    expect(posthog.reset).not.toHaveBeenCalled()
  })

  it('identifies with no person properties when the user has neither email nor phone', () => {
    const posthog = mockPosthog({ get_distinct_id: vi.fn().mockReturnValue('anon') as any })
    const user = makeUser({ id: 'user-bare' })

    const result = reduceAuthStateChange('SIGNED_IN', sessionWith(user), { posthog })

    expect(result).toEqual({ user })
    expect(posthog.identify).toHaveBeenCalledTimes(1)
    expect(posthog.identify).toHaveBeenCalledWith('user-bare', {})
    expect(posthog.reset).not.toHaveBeenCalled()
  })

  it('skips redundant identify but syncs person properties when distinct_id already matches', () => {
    const posthog = mockPosthog({ get_distinct_id: vi.fn().mockReturnValue('user-1') as any })
    const user = makeUser({ id: 'user-1', email: 'a@b.com', phone: '+919876543210' })

    const result = reduceAuthStateChange('SIGNED_IN', sessionWith(user), { posthog })

    expect(result).toEqual({ user })
    expect(posthog.identify).not.toHaveBeenCalled()
    // email/phone are kept in sync via setPersonProperties so a mid-session
    // change (e.g. user adds a phone) is not dropped by the distinct_id guard.
    expect(posthog.setPersonProperties).toHaveBeenCalledTimes(1)
    expect(posthog.setPersonProperties).toHaveBeenCalledWith({
      email: 'a@b.com',
      phone: '+919876543210'
    })
    expect(posthog.reset).not.toHaveBeenCalled()
  })

  it('does nothing when distinct_id matches and the user has no email or phone', () => {
    const posthog = mockPosthog({ get_distinct_id: vi.fn().mockReturnValue('user-bare') as any })
    const user = makeUser({ id: 'user-bare' })

    const result = reduceAuthStateChange('SIGNED_IN', sessionWith(user), { posthog })

    expect(result).toEqual({ user })
    expect(posthog.identify).not.toHaveBeenCalled()
    expect(posthog.setPersonProperties).not.toHaveBeenCalled()
    expect(posthog.reset).not.toHaveBeenCalled()
  })

  it('resets identity on SIGNED_OUT', () => {
    const posthog = mockPosthog()

    const result = reduceAuthStateChange('SIGNED_OUT', sessionWith(null), { posthog })

    expect(result).toEqual({ user: null })
    expect(posthog.reset).toHaveBeenCalledTimes(1)
    expect(posthog.identify).not.toHaveBeenCalled()
  })

  it('fires identify only once for a repeated SIGNED_IN of the same identity', () => {
    const getDistinctId = vi.fn().mockReturnValueOnce('anon').mockReturnValueOnce('user-1')
    const posthog = mockPosthog({ get_distinct_id: getDistinctId as any })
    const user = makeUser({ id: 'user-1' })

    const first = reduceAuthStateChange('SIGNED_IN', sessionWith(user), { posthog })
    const second = reduceAuthStateChange('SIGNED_IN', sessionWith(user), { posthog })

    const expected: AuthStateChangeResult = { user }
    expect(first).toEqual(expected)
    expect(second).toEqual(expected)
    expect(posthog.identify).toHaveBeenCalledTimes(1)
  })

  it('does not identify or reset for a null session that is not SIGNED_OUT', () => {
    const posthog = mockPosthog()

    const result = reduceAuthStateChange('INITIAL_SESSION', sessionWith(null), { posthog })

    expect(result).toEqual({ user: null })
    expect(posthog.identify).not.toHaveBeenCalled()
    expect(posthog.reset).not.toHaveBeenCalled()
  })
})
