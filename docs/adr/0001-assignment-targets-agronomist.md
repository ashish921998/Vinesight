---
status: accepted
---

# An Assignment must target an Agronomist

## Context

`organization_clients.assigned_to` is the **Assignment** — the link naming the single
Member responsible for a Client (an enrolled Farmer). Three code paths write it and they
disagreed on the rules:

- `POST /api/organizations/assign` (the bulk screen) rejects any `assigned_to` that isn't an
  Agronomist in the org.
- `POST /api/invite/accept` set `assigned_to = invite.invited_by` — **whoever sent the
  invite**, regardless of role.
- `POST /api/organizations/add-client` set `assigned_to` from the request without checking the
  role.

Because invite-accept keyed off the inviter, an Owner- or Admin-sent invite produced a Client
"assigned" to a non-Agronomist. On the assignment screen that Client then shows a populated
"Assigned to …" badge even though no Agronomist is responsible, so the **Unassigned** signal —
the one an admin scans to find Farmers that still need an Agronomist — could not be trusted.

## Decision

`assigned_to` may only ever reference a Member holding the **agronomist** role in the same
Organization, or be `NULL`. Invite-accept auto-assigns the inviter only when the inviter is an
Agronomist; an Owner/Admin invite lands the Client **Unassigned**, to be assigned deliberately
from Team → Assignments.

The invariant is enforced in two layers: a Postgres trigger on `organization_clients` (the
unbypassable source of truth, so future write paths can't drift) plus app-level guards in the
three routes for friendly error messages.

## Considered options

- **Any Member can be the assignee** — rejected: blurs the domain model and destroys the
  meaning of the Unassigned state.
- **Never auto-assign on invite** — rejected: loses the natural "an Agronomist enrols their own
  Farmer and owns them immediately" flow.
- **App guards only, no trigger** — rejected: the failure mode we are fixing _is_ paths
  drifting out of sync; only a DB-level invariant prevents the next path from reintroducing it.

## Consequences

- The trigger does a cross-table role lookup on every `assigned_to` write; it runs
  `SECURITY DEFINER` with a pinned `search_path` so RLS on `organization_members` can't hide the
  row it checks.
- Owner/Admin-invited Farmers now require an explicit assignment step. That step is exactly what
  the newly-surfaced Team → Assignments tab provides, so the loop stays closed.
- No backfill: the only existing assignment in the production database already targets the
  Agronomist, so it satisfies the new invariant.
- The farmer Self-join RPC `join_organization_by_slug` previously assigned new Clients to the
  org owner — which this trigger rejects. It is brought under version control and changed to land
  Self-joined Clients **Unassigned** (`assigned_to = null`), shipping in the same migration set so
  the trigger never exists without a compatible RPC. See ADR-0002 and
  `202606190002_join_organization_by_slug_unassigned.sql`.
