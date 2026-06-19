---
status: accepted
---

# Shared database objects are version-controlled in vinesight-web migrations

## Context

VineSight is two repos over one Supabase database: this consultant web app and the
`vinesight-rn` farmer app. The farmer Self-join RPC `join_organization_by_slug` was created
directly against the live database and existed in **no** migration in either repo. It stayed
invisible to anyone reading this codebase — which is exactly why ADR-0001's
agronomist-only trigger was designed without noticing it assigned new Clients to the org owner,
a collision that would have broken every farmer Self-join on deploy.

## Decision

All shared database objects (tables, RPCs, triggers, RLS policies, indexes) are version-controlled
as migrations in **`vinesight-web/supabase/migrations`**, which is the single source of truth for
the shared schema. Neither app may create or alter shared DB objects out-of-band against the live
database. Changes the farmer app needs land as reviewed migrations here.

## Consequences

- Any change to the contract the RN app depends on is visible, reviewable, and reproducible from a
  clean database — cross-cutting invariants (like ADR-0001) can be reasoned about against the whole
  schema, not a partial view.
- Existing out-of-band objects get adopted into migrations as they're discovered
  (`join_organization_by_slug` is the first; see `202606190002`).
- The RN team must route schema changes through this repo, which adds coordination but removes the
  drift class of bug that motivated this ADR.
