# TODOS

## Team / Org invites

- **Reconciliation sweep for orphaned auth accounts** — **Priority:** P3
  - `claim-invite` creates a confirmed auth user before the join RPC; if the RPC fails AND the best-effort `deleteUser` cleanup also fails, a confirmed account with no org membership can be stranded (`src/app/api/organizations/claim-invite/route.ts` ~L157-162).
  - Add a periodic sweep (cron/edge function) that deletes confirmed, never-signed-in auth users with no `organization_members` row and no pending invite. Low severity: account is the user's own email/password, partially self-heals on retry while the invite is pending.

- **Move invite/claim rate limiting to shared storage** — **Priority:** P2
  - `globalRateLimiter` is in-memory per-lambda and keyed off spoofable `x-forwarded-for` (`src/lib/validation.ts`), so the 50/min/IP cap on `claim-invite`, `invite-member`, and `accept-invite` is not enforced across serverless instances. Flagged by Sentry + CodeRabbit.
  - Replace with a centralized limiter (e.g. Upstash/Redis via `@upstash/ratelimit`) and a trusted client-IP source; consider a secondary token/email-scoped limit on credential-mutating endpoints. The single-use invite token is the real gate today, so this is defense-in-depth.

- **Custom SMTP for Supabase Auth email** — **Priority:** P1
  - Project is on Supabase's shared mailer (`noreply@mail.app.supabase.io`), already being throttled (`429: email rate limit exceeded` in auth logs). Login verification and password reset still ride it even after the no-email agronomist claim flow.
  - Buy a domain, verify it with a provider (Resend/Postmark/SES), and set custom SMTP in Supabase Auth settings. `.vercel.app` cannot be used (no DNS control).

## Completed

- **Fix OTP invite-acceptance redirect race** — completed v0.1.1.0 (2026-06-18)
  - Derive `inviteToken` synchronously from `searchParams` in `/auth/verify-otp`.
  - Guard invite branches with `redirectHandledRef` before async work.
  - Add missing negative-path test for `sendPhoneOtp` unknown-number translation.
