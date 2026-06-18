# TODOS

## Auth

**Priority:** P0

- Fix OTP invite-acceptance redirect race so `/consultant` is not overwritten by `/dashboard` after a successful invite.

## Completed

- **Fix OTP invite-acceptance redirect race** — completed v0.1.1.0 (2026-06-18)
  - Derive `inviteToken` synchronously from `searchParams` in `/auth/verify-otp`.
  - Guard invite branches with `redirectHandledRef` before async work.
  - Add missing negative-path test for `sendPhoneOtp` unknown-number translation.
