---
status: accepted
---

# Server state uses TanStack Query

## Context

The consultant workspace reads Supabase-backed data from several client pages: access, farmer
clients, farmer profiles, farms, farm detail, and visits. Those pages had been hand-rolling
`useState` plus `useEffect` fetches, so navigation through the consultant section repeated the
same access and farmer queries and left each page responsible for its own loading, error, and
refresh behavior.

That pattern also created stale UI state. For example, toggling a farmer's paid status updated the
button's local state, but the directory row still held the previous `isPaid` value in its local
farmers array, so any re-render could restore stale data.

## Decision

Use `@tanstack/react-query` for Supabase-backed server state, starting with the consultant
section. Query keys live in one factory under `src/lib/consultant-query-keys.ts`, and consultant
hooks wrap the existing service functions rather than replacing the service layer.

`AuthProvider` remains the owner of authentication/client context. We are not adding Redux,
Zustand, Jotai, or another global client-state store. Revisit a client-state store only when the
app needs an offline write queue or another genuinely global mutable client workflow.

## Consequences

- Consultant access is cached and shared by layout and pages, while preserving the deliberate
  denied-vs-error distinction: a resolved non-consultant result is not treated as a transient
  outage.
- Farmer lists, profile data, farm data, and visits can be reused across consultant navigation and
  precisely invalidated by key.
- Recording a visit invalidates the farmer visits query instead of also prepending local state,
  avoiding duplicate temporary rows.
- Paid-status changes patch the cached farmer list after confirmation so directory rows do not
  revert on re-render.
- Farmer-facing pages, `/dashboard`, `/farms/*`, and broad `SupabaseService` call sites remain
  out of scope for this rollout even though the provider is mounted globally.
