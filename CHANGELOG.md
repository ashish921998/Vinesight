# Changelog

All notable changes to this project will be documented in this file.

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
