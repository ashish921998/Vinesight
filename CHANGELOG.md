# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0.0] - 2026-06-24

### Added

- **Command Center dashboard.** The consultant overview page now opens on org-wide KPIs (open reviews, active farmers, recommendation adherence) plus instrument-grade charts: review pipeline by status, incoming severity mix, weekly review throughput, nutrient status across farms (latest petiole test bucketed against bloom-stage norms), and team workload. Backed by two read-only `SECURITY DEFINER` RPCs (`get_org_latest_petiole`, `get_org_followup_adherence`) scoped to the caller's org access.

### Changed

- **Farmer Directory is now a dense worklist table** instead of a card grid (Farmer · Contact · Region · Farms · Status), matching the "tables over cards" design rule.
- **Consultant sidebar rebuilt on the shadcn Sidebar primitive**: collapses to an icon rail (state persists across reloads, `⌘B` to toggle), becomes a slide-in drawer on mobile, shows a section breadcrumb, and gives selected vs hovered rows distinct treatments (soft-sage active, neutral hover). Nav renamed: Command Center → Overview, Petiole Triage → Petiole Review, Client Farmers → Farmers.
- **Typography migrated to the IBM Plex superfamily** (Plex Sans / Serif / Mono via `next/font`), replacing Montserrat / Merriweather / Source Code Pro and a stray Inter binding.

### Fixed

- The Team Workload panel and the Recommendation-adherence KPI now gate on every query they depend on, so a still-loading or failed clients/adherence fetch shows a loading or "—" state instead of misleading zeros.
- The nutrient-status chart keeps lab-report ordering when aliasing the British "sulphur" key to "sulfur".
- Sidebar active-item detection normalizes trailing slashes, so visiting `/consultant/` (not redirected, since `skipTrailingSlashRedirect` is on) still highlights Overview.

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
