# Changelog

All notable changes to this project will be documented in this file.

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
