/**
 * Data-access layer for the agent-auth tables. Everything here runs server-side with the
 * Supabase service-role client (RLS-bypassing); the tables are otherwise deny-all.
 *
 * The agent-auth tables are not part of the generated `Database` types, so we use an
 * untyped service client and keep the row shapes typed here instead.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { randomId } from './tokens'

function admin(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient
}

const nowIso = () => new Date().toISOString()
export const inSeconds = (seconds: number) => new Date(Date.now() + seconds * 1000).toISOString()

export type RegistrationType = 'anonymous' | 'service_auth'
export type RegistrationStatus = 'unclaimed' | 'claimed' | 'expired' | 'revoked'
export type ClaimAttemptStatus = 'initiated' | 'confirmed' | 'expired'

export interface AgentRegistration {
  id: string
  registration_type: RegistrationType
  status: RegistrationStatus
  claim_token_hash: string
  claim_email: string | null
  claimed_by_user_id: string | null
  agent_label: string | null
  client_ip: string | null
  assertion_expires_at: string
  expires_at: string
  claimed_at: string | null
  revoked_at: string | null
  created_at: string
  updated_at: string
}

export interface AgentClaimAttempt {
  id: string
  registration_id: string
  claim_attempt_token_hash: string
  user_code_hash: string
  status: ClaimAttemptStatus
  attempts: number
  claimed_by_user_id: string | null
  client_ip: string | null
  expires_at: string
  confirmed_at: string | null
  created_at: string
}

export interface AgentAccessToken {
  id: string
  registration_id: string
  user_id: string | null
  token_hash: string
  scopes: string[]
  client_ip: string | null
  expires_at: string
  revoked_at: string | null
  created_at: string
}

// --- Registrations -----------------------------------------------------------

export async function createRegistration(input: {
  registrationType: RegistrationType
  claimTokenHash: string
  assertionExpiresAt: string
  expiresAt: string
  claimEmail?: string | null
  agentLabel?: string | null
  clientIp?: string | null
}): Promise<AgentRegistration> {
  const row = {
    id: randomId('reg'),
    registration_type: input.registrationType,
    status: 'unclaimed' as RegistrationStatus,
    claim_token_hash: input.claimTokenHash,
    claim_email: input.claimEmail ?? null,
    agent_label: input.agentLabel ?? null,
    client_ip: input.clientIp ?? null,
    assertion_expires_at: input.assertionExpiresAt,
    expires_at: input.expiresAt
  }
  const { data, error } = await admin().from('agent_registrations').insert(row).select().single()
  if (error) throw error
  return data as AgentRegistration
}

export async function getRegistrationById(id: string): Promise<AgentRegistration | null> {
  const { data, error } = await admin()
    .from('agent_registrations')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as AgentRegistration) ?? null
}

export async function getRegistrationByClaimTokenHash(
  hash: string
): Promise<AgentRegistration | null> {
  const { data, error } = await admin()
    .from('agent_registrations')
    .select('*')
    .eq('claim_token_hash', hash)
    .maybeSingle()
  if (error) throw error
  return (data as AgentRegistration) ?? null
}

export async function updateRegistration(
  id: string,
  patch: Partial<AgentRegistration>
): Promise<void> {
  const { error } = await admin()
    .from('agent_registrations')
    .update({ ...patch, updated_at: nowIso() })
    .eq('id', id)
  if (error) throw error
}

/**
 * True once the registration can no longer mint usable credentials.
 *
 * `expires_at` is the deadline to COMPLETE a claim, so it only gates registrations that are
 * still `unclaimed`; once claimed, the registration lives until `assertion_expires_at` (its
 * hard outer bound). Without this split a claimed agent would wrongly stop working at the
 * 7-day claim deadline even though its identity_assertion is valid for 30 days; the
 * assertion_expires_at check is what finally bounds a claimed registration (and stops the
 * claim_token from minting tokens forever).
 */
export function isRegistrationExpired(reg: AgentRegistration): boolean {
  if (reg.status === 'revoked' || reg.status === 'expired') return true
  const now = Date.now()
  if (reg.status === 'unclaimed' && new Date(reg.expires_at).getTime() <= now) return true
  if (new Date(reg.assertion_expires_at).getTime() <= now) return true
  return false
}

// --- Claim attempts ----------------------------------------------------------

export async function expireActiveAttempts(registrationId: string): Promise<void> {
  await admin()
    .from('agent_claim_attempts')
    .update({ status: 'expired' })
    .eq('registration_id', registrationId)
    .eq('status', 'initiated')
}

export async function createClaimAttempt(input: {
  registrationId: string
  claimAttemptTokenHash: string
  userCodeHash: string
  expiresAt: string
  clientIp?: string | null
}): Promise<AgentClaimAttempt> {
  const row = {
    id: randomId('cla'),
    registration_id: input.registrationId,
    claim_attempt_token_hash: input.claimAttemptTokenHash,
    user_code_hash: input.userCodeHash,
    status: 'initiated' as ClaimAttemptStatus,
    attempts: 0,
    client_ip: input.clientIp ?? null,
    expires_at: input.expiresAt
  }
  const { data, error } = await admin().from('agent_claim_attempts').insert(row).select().single()
  if (error) throw error
  return data as AgentClaimAttempt
}

export async function getClaimAttemptByTokenHash(hash: string): Promise<AgentClaimAttempt | null> {
  const { data, error } = await admin()
    .from('agent_claim_attempts')
    .select('*')
    .eq('claim_attempt_token_hash', hash)
    .maybeSingle()
  if (error) throw error
  return (data as AgentClaimAttempt) ?? null
}

export async function updateClaimAttempt(
  id: string,
  patch: Partial<AgentClaimAttempt>
): Promise<void> {
  const { error } = await admin().from('agent_claim_attempts').update(patch).eq('id', id)
  if (error) throw error
}

// --- Access tokens -----------------------------------------------------------

export async function createAccessToken(input: {
  registrationId: string
  userId: string | null
  tokenHash: string
  scopes: string[]
  expiresAt: string
  clientIp?: string | null
}): Promise<AgentAccessToken> {
  const row = {
    id: randomId('tok'),
    registration_id: input.registrationId,
    user_id: input.userId,
    token_hash: input.tokenHash,
    scopes: input.scopes,
    client_ip: input.clientIp ?? null,
    expires_at: input.expiresAt
  }
  const { data, error } = await admin().from('agent_access_tokens').insert(row).select().single()
  if (error) throw error
  return data as AgentAccessToken
}

export async function getAccessTokenByHash(hash: string): Promise<AgentAccessToken | null> {
  const { data, error } = await admin()
    .from('agent_access_tokens')
    .select('*')
    .eq('token_hash', hash)
    .maybeSingle()
  if (error) throw error
  return (data as AgentAccessToken) ?? null
}

export async function revokeAccessTokenByHash(hash: string): Promise<void> {
  await admin()
    .from('agent_access_tokens')
    .update({ revoked_at: nowIso() })
    .eq('token_hash', hash)
    .is('revoked_at', null)
}

/** Revoke any still-live tokens minted before a claim (the pre-claim, user-less tokens). */
export async function revokePreClaimTokens(registrationId: string): Promise<void> {
  await admin()
    .from('agent_access_tokens')
    .update({ revoked_at: nowIso() })
    .eq('registration_id', registrationId)
    .is('user_id', null)
    .is('revoked_at', null)
}

// --- Audit -------------------------------------------------------------------

export async function recordEvent(
  event: string,
  opts: {
    registrationId?: string | null
    userId?: string | null
    metadata?: Record<string, unknown>
  } = {}
): Promise<void> {
  try {
    await admin()
      .from('agent_auth_events')
      .insert({
        event,
        registration_id: opts.registrationId ?? null,
        user_id: opts.userId ?? null,
        metadata: opts.metadata ?? null
      })
  } catch (error) {
    // Audit logging must never break the request flow.
    if (process.env.NODE_ENV === 'development') {
      console.error('[agent-auth] failed to record event', event, error)
    }
  }
}
