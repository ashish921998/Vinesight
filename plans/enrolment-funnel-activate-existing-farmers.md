# Plan — Enrolment funnel: activate existing farmers (Self-join by Join code)

**Goal:** Let the consultant drive the existing-farmer Self-join funnel that the RN app already
implements, and surface self-joined farmers so they get assigned.

**Decided in grilling:**

- Target: **activate existing farmers** (133 owners, 132 unenrolled, email-based, on RN) — not new-farmer acquisition.
- Model: **Self-join by Join code** (org slug); farmer UI already built in `vinesight-rn`.
- Self-join lands **Unassigned** (ADR-0001); the backend RPC is version-controlled (ADR-0002).
- Consultant surface: a **Join-code card** on Command Center + Client Farmers.

**Domain language:** `CONTEXT.md` — Join code, Self-join, Enrolment, Assignment.

---

## Status of each piece

| Piece                                         | State                                                                         |
| --------------------------------------------- | ----------------------------------------------------------------------------- |
| RN Self-join UI (enter Join code in Settings) | **Built** (other repo)                                                        |
| `join_organization_by_slug` RPC               | **Fixed + version-controlled in PR #169** (`202606190002`) — lands Unassigned |
| Org Join codes (slug)                         | Exist, required at creation, unique                                           |
| Consultant can see/share the Join code        | **Missing** ← P1                                                              |
| Self-joined farmers visible to consultant     | Partially (they appear Unassigned in the directory) ← P2 makes it obvious     |

> **P0 is already done in PR #169** (the RPC migration). P1/P2 below are a _separate_ PR.

---

## P1 — Join-code card (consultant onboarding surface)

**Data:** the consultant UI needs the org's `name` + `slug`. `getConsultantAccess()` returns
`organizationId` but not name/slug.

- **Recommended:** extend `getConsultantAccess()` (`src/lib/consultant-access.ts`) to also return
  `organizationName` and `joinCode` (slug) via a join: `.select('organization_id, role, is_owner, organizations(name, slug)')`.
  Additive; the consultant layout already calls it once.
- Alternative: a dedicated `getOrganizationJoinInfo(orgId)` fetch in the card.

**Component:** `src/components/consultant/JoinCodeCard.tsx`

- Shows the **Join code** prominently with a **Copy code** button.
- **Copy invite message** button → a pre-written string from a pure, testable builder
  `buildJoinMessage(orgName, joinCode)`:
  > `Join "<orgName>" on VineSight. Open the app → Settings → Connect to consultant → enter code: <joinCode>`
  > ⚠️ Confirm the exact farmer-side step labels against the RN Settings screen before finalizing copy.
- Optional generic WhatsApp share anchor (`https://wa.me/?text=<encoded>`) mirroring `InviteFarmerDialog`'s pattern, but with no phone (consultant picks the recipient).
- Telemetry: `consultant_join_code_copied`, `consultant_join_message_copied`.

**Placement:**

- `src/app/consultant/page.tsx` (Command Center) — a prominent "Onboard your farmers" card.
- `src/app/consultant/farmers/page.tsx` (Client Farmers) — alongside the existing `InviteFarmerDialog` (which stays for the new-farmer phone path).
- Visible to **all** consultant members — owner, admin, **and agronomist** (emphasis on Command
  Center). **Decision (confirmed, deliberate):** an agronomist sharing the code creates Clients that
  land Unassigned, i.e. work an owner/admin must pick up. That is acceptable and intended here —
  maximising onboarding reach matters more, and the Unassigned surfaces (P2 + the Command-Center
  nudge + Team → Assignments) exist precisely to catch and route that work. Revisit only if
  agronomist-driven self-joins become a noise problem; gating the card to `canViewAllFarmers` is the
  one-line lever.

## P2 — Unassigned visibility (close the loop)

When a farmer self-joins, they land Unassigned. Make that obvious so an Owner/Admin assigns them
via the Team → Assignments screen (shipped in #169).

- **Client Farmers** (`farmers/page.tsx`): add an **Unassigned** filter chip + a count badge
  (`farmers.filter(f => !f.assigned_to).length`). Owner/admin only (`canViewAllFarmers`).
- **Command Center** (`consultant/page.tsx`): a small stat "N farmers need an agronomist" linking to
  the farmers list (or Team → Assignments).
- No new backend; `getFarmerClients` already returns `assigned_to`.

## Tests

- `buildJoinMessage` unit test (pure function).
- Light component sanity for `JoinCodeCard` (renders code, copy handler called).
- Existing suites stay green.

## Verify

- `bun run typecheck` + `vitest` + lint.
- Manual: Join code shows on Command Center + Farmers; copy works. In staging, a Self-join (RN, or
  call `join_organization_by_slug` as a farmer) lands the farmer **Unassigned** and they appear in
  the new filter; assigning them via Team → Assignments works end-to-end.

---

## Parking lot

- New-farmer phone-invite conversion (0/7) — separate motion.
- QR code / deep link for the Join code — needs an RN deep-link target (other repo).
- Bulk onboarding (CSV / multi-share).
- Reconcile the two Self-join paths: web Settings (`add-client`, by org name/id) vs RN (`join_organization_by_slug`, by slug). The web path already lands Unassigned, so it's ADR-0001-safe; dedupe later.
