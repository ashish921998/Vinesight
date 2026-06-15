# agent-auth — auth.md agent registration

Implements the [WorkOS `auth.md`](https://workos.com/auth-md/docs) **user-claimed** flow so AI
agents can register on behalf of a VineSight user and receive scoped, revocable bearer tokens.
The authorization server and resource server are co-located on the VineSight origin.

## What an agent sees

| Public URL                                | Purpose                                        |
| ----------------------------------------- | ---------------------------------------------- |
| `/auth.md`                                | Human + agent readable integration guide       |
| `/.well-known/oauth-protected-resource`   | Protected Resource Metadata (authoritative)    |
| `/.well-known/oauth-authorization-server` | AS metadata incl. the `agent_auth` block       |
| `POST /api/agent/identity`                | Register (`anonymous` or `service_auth`)       |
| `POST /api/agent/identity/claim`          | Mint claim material (anonymous only)           |
| `POST /api/oauth2/token`                  | jwt-bearer exchange + claim-grant poll         |
| `POST /api/oauth2/revoke`                 | RFC 7009 token revocation                      |
| `/agent/claim`                            | The page where a signed-in user types the code |

Issued access tokens are accepted (alongside cookie sessions) on `GET /api/farms`
(`farms.read`) and `GET /api/tasks` (`tasks.read`).

## Setup

1. **Run the migration** `supabase/migrations/202606140001_agent_auth.sql` against your
   Supabase project (it creates the `agent_*` tables with RLS enabled / deny-all — they are
   only ever touched by the service role).

2. **Environment variables:**

   | Var                         | Required | Notes                                                                                                                                                                                                                                                       |
   | --------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `AGENT_AUTH_JWT_SECRET`     | yes      | Random string ≥ 16 chars; signs the identity_assertion (HS256).                                                                                                                                                                                             |
   | `SUPABASE_SERVICE_ROLE_KEY` | yes      | Already used elsewhere; the agent-auth tables require it.                                                                                                                                                                                                   |
   | `AGENT_AUTH_BASE_URL`       | prod     | Canonical public origin (e.g. `https://vinesight.app`). Falls back to `NEXT_PUBLIC_SITE_URL`, then proxy headers. **Set this in production** — otherwise the issuer/audience and discovery URLs derive from the request `Host`, which is client-controlled. |
   | `AGENT_AUTH_ALLOWED_HOSTS`  | no       | Comma-separated Host allow-list used only when no base URL is set; an unrecognized `Host` falls back to the first entry (host-poisoning guard).                                                                                                             |

## Design notes

- **Tokens at rest:** `claim_token`, `claim_attempt_token`, `user_code`, and `access_token`
  are bearer secrets — only their SHA-256 hashes are stored; the plaintext is returned once.
- **identity_assertion:** a service-signed HS256 JWT (`sub` = registration id), re-exchangeable
  until it expires. There is no refresh token; agents re-exchange the assertion to refresh.
- **Pre-claim:** an anonymous registration gets an assertion immediately but **no scopes** until
  a user claims it; its pre-claim tokens are revoked at claim time.
- **No agent-verified flow:** the ID-JAG / JWKS / provider-trust-list path is intentionally not
  implemented. `identity_types_supported` advertises only `anonymous` and `service_auth`.
- **Rate limiting** reuses the in-process `globalRateLimiter`. For multi-instance production,
  move these counters to a shared store (e.g. Redis).
