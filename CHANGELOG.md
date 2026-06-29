# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0.0] - 2026-06-29

### Added

- **Agronomists can join an organization directly from a shared invite link — no email required.** A new `POST /api/organizations/claim-invite` endpoint lets a logged-out invitee open the link, set a password, and join as an agronomist, sidestepping Supabase's throttled transactional mailer for onboarding. The `/signup/member/[token]` page now renders a "set password & join" form for agronomist invites (admin invites still require the emailed, email-verified flow).

### Changed

- **Team page pending-invites list now shows the invitee's name and a count.** Each pending invite displays the person's full name (falling back to email) plus their email and role, and the section header shows how many invites are outstanding.

### Security

- **Claim-invite only sets a password on an unclaimed, never-signed-in invitee** (`last_sign_in_at` gate) and defers the password write until after the join succeeds, so a shared link can never overwrite the credential of an existing, in-use account or leave a mutated password behind on a rejected join.
- **Invite-email lookup escapes LIKE wildcards** so addresses containing `_` or `%` match the exact account instead of resolving a different profile.

## [0.2.0.1] - 2026-06-26

### Fixed

- **Farm logs no longer show the previous farm's rows while switching farms.** `useLogs` kept previous-page data across farm changes via `keepPreviousData`, so the prior farm's rows could render under the newly selected farm's edit/delete actions. The placeholder is now scoped to the same farmId, so it still avoids skeleton flashes during pagination/filtering but never shows cross-farm data.
- **No second redundant `searchLogs` refetch after adding a record.** Record-add mutations already invalidate the logs cache via their hooks; the logs page fired a second invalidation on every save. It now only invalidates explicitly for a pure daily-note save (no record mutation fired).
- **Editing a soil/petiole test from the logs page now refreshes lab-test surfaces.** `invalidateFarmLogs` also invalidates `farmKeys.labTests`, so the lab workspace and consultant farm-detail no longer go stale after an `EditRecordModal` update.
- **Log-fetch error toasts no longer spam on flaky connections.** The error effect is guarded so it toasts once per failure cycle and re-arms after a successful fetch, instead of re-firing for every fresh `Error` from background refetches.
- **Farm-list load failures are now surfaced.** A failed farms fetch previously only logged to the console, leaving the farm selector silently empty; it now toasts.
- Activity-type filters are sorted and deduped before entering the query key, so semantically identical selections map to one cache entry instead of spawning redundant fetches.

## [0.2.0.0] - 2026-06-24

### Added

- **Consultant Overview is now "Your Practice" — a proactive daily panel.** Instead of a chart wall, the overview opens on an impression band ("what needs attention"), a derived-state **Farmers to contact** call list (farmers gone quiet 30+ days, and reviews completed with no fertilizer plan attached), and a right rail (review-queue pointer, practice snapshot, portfolio nutrient bar). It surfaces who to reach out to — what the reactive review queue is structurally blind to — and the list self-clears as you act. All derived client-side from existing scoped data; no new RPC.
- **Org-wide Analytics page** at `/consultant/analytics` (new sidebar destination between Petiole Review and Team). A "study the book of farms" surface housing the portfolio charts: nutrient status across farms (latest petiole test bucketed against bloom-stage norms), incoming severity mix, weekly review throughput, review pipeline by status, and recommendation adherence. Instrumented with a page-view event so it can be cut if it goes unused.
- **Org-wide dashboard data** via two read-only `SECURITY DEFINER` RPCs (`get_org_latest_petiole`, `get_org_followup_adherence`) scoped to the caller's org access.

### Changed

- **Farmer Directory is now a dense worklist table** instead of a card grid (Farmer · Contact · Region · Farms · Status), matching the "tables over cards" design rule.
- **Consultant sidebar rebuilt on the shadcn Sidebar primitive**: collapses to an icon rail (state persists across reloads, `⌘B` to toggle), becomes a slide-in drawer on mobile, shows a section breadcrumb, and gives selected vs hovered rows distinct treatments (soft-sage active, neutral hover). Nav: Overview · Farmers · Petiole Review · Analytics · Team (renamed from Command Center / Petiole Triage / Client Farmers).
- **Typography migrated to the IBM Plex superfamily** (Plex Sans / Serif / Mono via `next/font`), replacing Montserrat / Merriweather / Source Code Pro and a stray Inter binding.
- Removed the sidebar "Access Mode" footer label — it was redundant with the role already shown in the sidebar header, and the directory's own farmer count communicates scope.
- Text selection is now suppressed only on interactive chrome (buttons, nav, touch targets) instead of the whole body, so report names, emails, and nutrient values stay selectable.

### Fixed

- The nutrient-status chart keeps lab-report ordering when aliasing the British "sulphur" key to "sulfur".
- Sidebar active-item detection normalizes trailing slashes, so visiting `/consultant/` (not redirected, since `skipTrailingSlashRedirect` is on) still highlights Overview.
- **Farmer Directory columns now line up with their headers.** The header row and each data row were separate grids sharing an `auto`-width Status column that resolved to different widths (the "Unpaid" button is wider than the "STATUS" label), which knocked Region / Farms / Status out of alignment. Switched the trailing columns to fixed widths so every grid computes identical columns, and gave the row chevron its own column.

## [0.1.4.0] - 2026-06-19

### Added

- Consultants can onboard existing farmers with a join code. A new card on both the Command Center and Client Farmers pages shows the organization's join code with one-tap "Copy code" and "Copy invite message" actions.
- Owners and admins can spot farmers who self-joined the organization but have no agronomist yet: an "Unassigned (N)" filter on the farmer directory and a nudge card on the workspace overview, both linking straight to assignments.
- A dedicated Assignment screen for consultants to assign farmers to agronomists.

### Changed

- Farmer assignments now target agronomists only, enforced in both the database and the assignment UI.
- Signup phone entry uses a separate country-code and number field, and signup email addresses are now validated.

### Fixed

- The copied farmer invite message now points to the correct "Join your consultant" step in the mobile app's Settings (it previously said "Connect to consultant", which doesn't exist there).
- The join-code card reuses the consultant access its parent page already loaded instead of refetching — removing a duplicate request and a second loading flash — and now shows an explicit error on a failed load instead of a misleading "no join code is set up" message.

## [0.1.3.1] - 2026-06-19

### Fixed

- Landing page no longer calls `router.replace` on an unmounted component. The post-login redirect effect now re-checks a mount flag after the `resolveModuleHome` await, matching the guard already in the OAuth callback — so navigating away during the membership query can't fire a redirect on a stale component.

## [0.1.3.0] - 2026-06-19

### Changed

- Post-login redirects resolve the signed-in user's module home from `organization_members` (the same source as middleware) instead of hardcoding `/dashboard`, so organization members land on `/consultant` directly from login, signup, the OAuth callback, verify-OTP, and the landing page. The logic lives in a shared `resolveModuleHome` helper.
- Module-home routes (`FARMER_HOME` / `ORG_HOME`) are now defined once in `@/lib/auth/homes` and imported by both the edge middleware and the client resolver, so the two runtimes can't drift.

### Fixed

- Login no longer double-resolves the module home or double-pushes its route. A once-guard collapses the three redirect paths (auth-state effect, email submit, phone onSuccess) into a single lookup and a single navigation.
- The OAuth callback no longer leaks a redirect timer if the component unmounts while the membership query is in flight; the `resolveModuleHome` awaits now re-check the mount flag before scheduling, matching the sibling awaits.

## [0.1.2.0] - 2026-06-18

### Changed

- Error tracking now flows through a single tracker. Sentry captures every client and server error; PostHog handles analytics only, so each failure surfaces once instead of twice.
- Server-side request errors are captured through Sentry's `onRequestError` hook, replacing the separate PostHog server capture path.

### Fixed

- Duplicate Sentry events from the error boundaries are gone. The manual `console.error` calls that `captureConsoleIntegration` was re-capturing have been removed, so the page and global error fallbacks now capture exactly once.
- The global error fallback no longer drops the error digest when it is missing (`digest ?? 'unknown'`).

### Removed

- `posthog-node` server dependency and its singleton (`src/lib/posthog-server.ts`).
- The `AsyncErrorBoundary` wrapper and the old class `ErrorBoundary`. The async variant registered an inert no-op `unhandledrejection` listener that did nothing — and React error boundaries cannot catch promise rejections regardless.

### Added

- Sentry's Vercel AI integration on the server traces AI/LLM calls.

## [0.1.1.0] - 2026-06-18

### Fixed

- OTP invite acceptance no longer races into a second `/dashboard` redirect. `inviteToken` is now derived synchronously from the URL and the invite branch guards `redirectHandledRef` before any async work.
- Phone sign-in on unknown numbers now surfaces a clear "No account found" message instead of the raw Supabase error, while the invite flow still sees the original error so consultants can diagnose signup issues.
- Auth, login, and signup routes are treated as public pages so the layout shell does not unmount/remount form state while auth loading toggles.
- Already-verified users on `/auth/verify-otp` now see a continue button instead of an automatic `useEffect` redirect, avoiding the page-flash warning flagged by React Doctor.

### Changed

- `verify-otp` redirect now resolves the user's home by checking `organization_members` directly, replacing the `org` query-param heuristic.
- `vitest.setup.ts` no longer depends on `vi.stubGlobal` so the test environment stays stable without jsdom.

### Added

- Regression tests covering the unknown-number error translation and the invite-flow case where translation must stay off.
- `TODOS.md` and `VERSION` to track shipped work and release versions.
