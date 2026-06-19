import { describe, it, expect, vi } from 'vitest'
import { assertAssigneeIsAgronomist, resolveInviteAssignee } from '../assignment-access'

// The helper takes an admin Supabase client and runs:
//   from('organization_members').select('role').eq().eq().maybeSingle()
// so a minimal chainable stub is enough. Typed via Parameters<> to avoid
// pulling in the generated Database types / path aliases.
type AdminClient = Parameters<typeof assertAssigneeIsAgronomist>[0]

function adminReturning(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result)
  const chain = {
    select: () => chain,
    eq: () => chain,
    maybeSingle
  }
  return {
    client: { from: () => chain } as unknown as AdminClient,
    maybeSingle
  }
}

describe('assertAssigneeIsAgronomist', () => {
  it('allows a null assignee (Unassigned) without hitting the database', async () => {
    const { client, maybeSingle } = adminReturning({ data: null, error: null })

    expect(await assertAssigneeIsAgronomist(client, 'org-1', null)).toEqual({ ok: true })
    expect(maybeSingle).not.toHaveBeenCalled()
  })

  it('allows an agronomist member of the organization', async () => {
    const { client } = adminReturning({ data: { role: 'agronomist' }, error: null })

    expect(await assertAssigneeIsAgronomist(client, 'org-1', 'agro-1')).toEqual({ ok: true })
  })

  it('rejects an owner/admin assignee — only agronomists may be assigned', async () => {
    const { client } = adminReturning({ data: { role: 'admin' }, error: null })

    expect(await assertAssigneeIsAgronomist(client, 'org-1', 'admin-1')).toEqual({
      ok: false,
      error: 'Assigned user must have the agronomist role',
      status: 400
    })
  })

  it('rejects an assignee who is not a member of the organization', async () => {
    const { client } = adminReturning({ data: null, error: null })

    expect(await assertAssigneeIsAgronomist(client, 'org-1', 'stranger')).toEqual({
      ok: false,
      error: 'Assigned agronomist must belong to the organization',
      status: 400
    })
  })

  it('surfaces a 500 when the membership lookup errors', async () => {
    const { client } = adminReturning({ data: null, error: { message: 'db down' } })

    expect(await assertAssigneeIsAgronomist(client, 'org-1', 'agro-1')).toEqual({
      ok: false,
      error: 'Failed to verify assigned agronomist',
      status: 500
    })
  })
})

describe('resolveInviteAssignee', () => {
  it('returns null for a missing inviter without hitting the database', async () => {
    const { client, maybeSingle } = adminReturning({ data: null, error: null })

    expect(await resolveInviteAssignee(client, 'org-1', null)).toBeNull()
    expect(maybeSingle).not.toHaveBeenCalled()
  })

  it('inherits the inviter when they hold the agronomist role', async () => {
    const { client } = adminReturning({ data: { role: 'agronomist' }, error: null })

    expect(await resolveInviteAssignee(client, 'org-1', 'agro-1')).toBe('agro-1')
  })

  it('lands Unassigned when the inviter is an owner', async () => {
    const { client } = adminReturning({ data: { role: 'owner' }, error: null })

    expect(await resolveInviteAssignee(client, 'org-1', 'owner-1')).toBeNull()
  })

  it('lands Unassigned when the inviter is an admin', async () => {
    const { client } = adminReturning({ data: { role: 'admin' }, error: null })

    expect(await resolveInviteAssignee(client, 'org-1', 'admin-1')).toBeNull()
  })

  it('lands Unassigned when the inviter is not a member of the organization', async () => {
    const { client } = adminReturning({ data: null, error: null })

    expect(await resolveInviteAssignee(client, 'org-1', 'stranger')).toBeNull()
  })

  it('fails safe to Unassigned when the role lookup errors', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { client } = adminReturning({ data: null, error: { message: 'db down' } })

    expect(await resolveInviteAssignee(client, 'org-1', 'agro-1')).toBeNull()
    expect(errorSpy).toHaveBeenCalled()

    errorSpy.mockRestore()
  })
})
