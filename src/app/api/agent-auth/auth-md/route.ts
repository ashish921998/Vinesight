/**
 * The human- and agent-readable `auth.md`, served at /auth.md via a next.config rewrite.
 * It is the prose companion to the Protected Resource Metadata, which stays authoritative.
 */

import { NextRequest } from 'next/server'
import { POST_CLAIM_SCOPES, asMetadataUrl, getBaseUrl, prmUrl } from '@/lib/agent-auth/config'

export const dynamic = 'force-dynamic'

function buildAuthMd(base: string): string {
  return `# auth.md — VineSight

VineSight is a digital companion for grape farmers. This file describes how an AI agent can
register with VineSight **on behalf of a user** and obtain a scoped, revocable access token,
following the [auth.md](https://workos.com/auth-md/docs) profile.

- Resource server (API base): \`${base}/\`
- Authorization server: \`${base}\`
- Protected Resource Metadata (authoritative): ${prmUrl(base)}
- Authorization Server Metadata: ${asMetadataUrl(base)}

VineSight supports the **user-claimed** flow only — there is no agent-verified / ID-JAG path.
A user authorizes the agent by signing in to VineSight and confirming a short code the agent
shows them. Two entrypoints are available: \`anonymous\` and \`service_auth\`.

## 1. Discover

Read the Protected Resource Metadata, then the Authorization Server Metadata. On any conflict
with this file, **the metadata is authoritative**.

\`\`\`http
GET ${prmUrl(base)}
GET ${asMetadataUrl(base)}
\`\`\`

The \`agent_auth\` block in the AS metadata gives you \`identity_endpoint\`, \`claim_endpoint\`,
\`token_endpoint\`, \`revocation_endpoint\`, and \`identity_types_supported\`.

## 2. Scopes

| scope | grants |
| --- | --- |
| \`farms.read\` | read the user's farms (\`GET /api/farms\`) |
| \`tasks.read\` | read the user's task reminders (\`GET /api/tasks\`) |

An anonymous registration has **no scopes** until a user claims it. After a claim it receives:
\`${POST_CLAIM_SCOPES.join(' ')}\`.

## 3. Register

Pick an entrypoint:

- You only have the user's email → **service_auth** (a claim is required before any access).
- You have neither → **anonymous** (you get a pre-claim identity immediately; claim later).

### anonymous

\`\`\`http
POST ${base}/api/agent/identity
Content-Type: application/json

{ "type": "anonymous" }
\`\`\`

Returns a pre-claim \`identity_assertion\` plus a \`claim_token\` you use to run the claim
ceremony (step 4) and to poll the token endpoint (step 6).

### service_auth

\`\`\`http
POST ${base}/api/agent/identity
Content-Type: application/json

{ "type": "service_auth", "login_hint": "user@example.com" }
\`\`\`

Returns a \`claim\` block (\`user_code\` + \`verification_uri\`) and a \`claim_token\`, but **no
assertion** until the ceremony completes.

## 4. Claim ceremony

1. For **anonymous**, first obtain ceremony material (service_auth already has it):

   \`\`\`http
   POST ${base}/api/agent/identity/claim
   Content-Type: application/json

   { "claim_token": "clm_…", "email": "user@example.com" }
   \`\`\`

2. Show the user the \`user_code\` and the \`verification_uri\` in a single message.
3. The user opens the link, signs in to VineSight, and types the code on a VineSight page.
4. Meanwhile, poll the token endpoint with the claim grant (step 6).

VineSight never emails the code — it travels agent → user and is confirmed on a VineSight page.

## 5. Exchange the assertion (jwt-bearer)

Trade an \`identity_assertion\` for an access token. Re-exchange the same assertion to refresh;
there is no refresh token.

\`\`\`http
POST ${base}/api/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=<identity_assertion>&resource=${base}/
\`\`\`

## 6. Poll during a claim (claim grant)

\`\`\`http
POST ${base}/api/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:workos:agent-auth:grant-type:claim&claim_token=<clm_…>
\`\`\`

Returns \`{ "error": "authorization_pending" }\` until the user confirms, then an
\`access_token\` plus a freshly minted \`identity_assertion\`.

## 7. Use the access token

\`\`\`http
GET ${base}/api/farms
Authorization: Bearer <access_token>
\`\`\`

## 8. Revoke

\`\`\`http
POST ${base}/api/oauth2/revoke
Content-Type: application/x-www-form-urlencoded

token=<access_token>&token_type_hint=access_token
\`\`\`

Revoking a token does not invalidate the assertion; mint a fresh access token by re-exchanging.

## Errors

Errors use the OAuth \`{ "error", "error_description" }\` shape. Notable codes:
\`invalid_request\`, \`invalid_grant\`, \`unsupported_grant_type\`, \`authorization_pending\`,
\`expired_token\`, \`invalid_claim_token\`, \`claimed_or_in_flight\`, \`claim_expired\`,
\`invalid_token\`, \`insufficient_scope\`.

## Contact

Questions about this integration: hello@vinesight.app
`
}

export async function GET(request: NextRequest) {
  const base = getBaseUrl(request)
  return new Response(buildAuthMd(base), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    }
  })
}
