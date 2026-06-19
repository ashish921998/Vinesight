# Plan — Surface + harden the Agronomist Assignment flow

**Goal:** Make the existing (orphaned) Assignment screen reachable, and enforce that an
Assignment (`organization_clients.assigned_to`) always targets an **Agronomist**.

**Scope guardrails (decided in grilling):**

- No widening of the agronomist's data surface (still profile / farms / soil / lab tests / triage).
- No role-change UI, no pagination, no notifications.
- See `docs/adr/0001-assignment-targets-agronomist.md` for the assignee-role invariant.

**Domain language:** `CONTEXT.md` (Organization, Member, Owner/Admin/Agronomist, Client,
Assignment, Enrolment, Farmer, Farm).

---

## Starting state (verified)

- Assignment plumbing works end-to-end: `assign/route.ts`, `consultant-query-service.ts`
  (`getFarmerClients`/`validateFarmerClient`), `farm-access.ts` rule 3, and RLS.
- `/consultant/team/assignments/page.tsx` is **fully built but orphaned** — no link reaches it.
- Live DB: 2 orgs; `test-org` has 1 owner + 1 agronomist + 1 active client (already assigned to
  the agronomist); `test-orgs` is empty. 203 farms, only 1 enrolled Client. **No bad data.**

---

## Step 1 — DB invariant: `assigned_to` must be an Agronomist

**New file:** `supabase/migrations/202606190001_assignment_targets_agronomist.sql`

- `CREATE FUNCTION assert_assigned_to_is_agronomist()` — `SECURITY DEFINER`, `SET search_path = public`.
  On `INSERT`/`UPDATE` of `organization_clients`, when `NEW.assigned_to IS NOT NULL`, require:
  ```sql
  EXISTS (
    SELECT 1 FROM organization_members m
    WHERE m.organization_id = NEW.organization_id
      AND m.user_id = NEW.assigned_to
      AND m.role = 'agronomist'
  )
  ```
  else `RAISE EXCEPTION 'assigned_to must reference an agronomist member of the organization'`.
- `CREATE TRIGGER trg_assignment_targets_agronomist BEFORE INSERT OR UPDATE OF assigned_to ON organization_clients FOR EACH ROW EXECUTE FUNCTION ...`.
- Note: an Owner with `role='owner'` (even if also flagged `is_owner`) is intentionally **not**
  a valid assignee. Owners/Admins reach all clients via admin access, not via assignment.

**Verify:** after `apply_migration`, an `UPDATE ... SET assigned_to = <owner_id>` must fail; the
existing agronomist assignment must still validate.

## Step 2 — Shared app-level guard (friendly errors)

**New file:** `src/lib/assignment-access.ts`

- `export async function assertAssigneeIsAgronomist(admin, organizationId, assignedTo): Promise<{ ok: true } | { ok: false; error: string }>`
  — returns ok for `assignedTo === null`; otherwise checks the `organization_members` row has
  `role === 'agronomist'`. (Lift the inline logic currently in `assign/route.ts:80-106`.)

## Step 3 — Make the three write paths agree

1. **`src/app/api/organizations/assign/route.ts`** — replace the inline assignee check (lines
   ~80-106) with `assertAssigneeIsAgronomist(...)`. Behaviour unchanged.
2. **`src/app/api/invite/accept/route.ts`** (line ~263) — the new Client must only inherit the
   inviter as assignee **when the inviter is an agronomist**:
   - Look up the inviter's role in `invite.organization_id`.
   - `assigned_to = inviterIsAgronomist ? invite.invited_by : null`.
   - `assigned_by` can stay `invite.invited_by` (records who enrolled them, not who advises).
3. **`src/app/api/organizations/add-client/route.ts`** (line ~188-200) — call
   `assertAssigneeIsAgronomist(...)` before the upsert; return 400 on failure.

## Step 4 — Surface the screen: Team → Members | Assignments

- **`src/app/consultant/team/page.tsx`** — add a segmented tab header (Members | Assignments).
  Render the **Assignments** tab/link **only** when `access.canViewAllFarmers` (owner/admin).
  Keep the existing route `/consultant/team/assignments` as the Assignments target (a shared
  tab-nav component rendered at the top of both pages is the least-invasive approach — no need to
  merge the two page bodies).
- **`src/app/consultant/team/assignments/page.tsx`** — keep its existing agronomist read-only
  notice as defense-in-depth for anyone hitting the URL directly.
- **`src/app/consultant/layout.tsx`** — the "Team" nav item's subtitle already reads
  "Members & assignments"; no nav change required.

## Step 5 — Telemetry (recommended freebie)

- In `assignments/page.tsx` `submitAssignment`, emit `posthog.capture('consultant_farmer_assigned', { org_id, count, agronomist_id })` and a `consultant_farmer_unassigned` on the unassign path
  (mirrors `consultant_farmer_list_viewed` / `consultant_team_viewed`).

## Step 6 — Tests

- **`src/lib/__tests__/assignment-access.test.ts`** (new) — agronomist → ok; owner/admin →
  rejected; null → ok; non-member → rejected.
- Extend invite-accept coverage: owner-inviter ⇒ `assigned_to = null`; agronomist-inviter ⇒
  `assigned_to = inviter`.
- Existing `farm-access.test.ts` / `consultant-query-service.test.ts` should stay green.

## Step 7 — Verify

- `bun run` typecheck + `vitest`.
- Manual QA in `test-org`: open Team → Assignments (as owner) → assign/unassign the farmer;
  invite a farmer as owner ⇒ lands **Unassigned**; (if feasible) invite as the agronomist ⇒
  auto-assigned. Confirm the agronomist account does **not** see the Assignments tab.
- DB spot-check: trigger rejects an owner/admin `assigned_to`.

---

## Out of scope (parking lot)

- Broaden agronomist data access (journal / irrigation / spray / expenses / calculators).
- Enrolment funnel to convert the other 202 farm-owners into Clients.
- Per-farmer quick-assign from the directory/detail; member role-change UI; assignment workload
  balancing & counts.
