-- auth.md agent registration (user-claimed flow).
-- Implements the WorkOS auth.md "user claimed" flow so AI agents can register on behalf
-- of a VineSight user and obtain scoped, revocable bearer access tokens.
--
-- Trust model: every row here either stores a SHA-256 hash of a bearer secret
-- (claim tokens, user codes, access tokens) or agent registration state. None of it is
-- ever read by the browser. RLS is enabled with NO policies so the anon/authenticated
-- client roles are denied by default; all access goes through server-side code using the
-- service-role key (which bypasses RLS). See src/lib/agent-auth/store.ts.

-- ---------------------------------------------------------------------------
-- agent_registrations: one row per agent that has registered with the service.
-- ---------------------------------------------------------------------------
create table if not exists public.agent_registrations (
  id text primary key,                          -- e.g. reg_<base62>
  registration_type text not null
    check (registration_type in ('anonymous', 'service_auth')),
  status text not null default 'unclaimed'
    check (status in ('unclaimed', 'claimed', 'expired', 'revoked')),
  claim_token_hash text not null,               -- sha256 of the long-lived claim_token
  claim_email text,                             -- email that must match the claiming user
  claimed_by_user_id uuid references auth.users(id) on delete cascade,
  agent_label text,                             -- best-effort User-Agent capture
  client_ip text,
  assertion_expires_at timestamptz not null,    -- outer bound for re-exchangeable assertions
  expires_at timestamptz not null,              -- unclaimed registrations expire at this time
  claimed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_agent_registrations_claim_token
  on public.agent_registrations (claim_token_hash);
create index if not exists idx_agent_registrations_status
  on public.agent_registrations (status);
create index if not exists idx_agent_registrations_claimed_by
  on public.agent_registrations (claimed_by_user_id);

-- ---------------------------------------------------------------------------
-- agent_claim_attempts: the RFC 8628-shaped claim ceremony material. A fresh
-- attempt is minted each time the user code is (re)issued; older attempts for the
-- same registration are marked 'expired' so only the latest verification_uri works.
-- ---------------------------------------------------------------------------
create table if not exists public.agent_claim_attempts (
  id text primary key,                          -- e.g. cla_<base62>
  registration_id text not null
    references public.agent_registrations(id) on delete cascade,
  claim_attempt_token_hash text not null,       -- sha256 of the token embedded in verification_uri
  user_code_hash text not null,                 -- sha256 of the 6-digit user_code
  status text not null default 'initiated'
    check (status in ('initiated', 'confirmed', 'expired')),
  attempts integer not null default 0,          -- user_code guesses, for lockout
  claimed_by_user_id uuid references auth.users(id) on delete set null,
  client_ip text,
  expires_at timestamptz not null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_agent_claim_attempts_token
  on public.agent_claim_attempts (claim_attempt_token_hash);
create index if not exists idx_agent_claim_attempts_registration
  on public.agent_claim_attempts (registration_id);

-- ---------------------------------------------------------------------------
-- agent_access_tokens: opaque bearer tokens minted at /oauth2/token. The resource
-- server (src/lib/agent-auth/resource.ts) authenticates a request by hashing the
-- presented bearer and looking it up here. Revocation just stamps revoked_at.
-- ---------------------------------------------------------------------------
create table if not exists public.agent_access_tokens (
  id text primary key,                          -- e.g. tok_<base62>
  registration_id text not null
    references public.agent_registrations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,  -- null while pre-claim
  token_hash text not null,                     -- sha256 of the opaque access_token
  scopes text[] not null default '{}',
  client_ip text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_agent_access_tokens_hash
  on public.agent_access_tokens (token_hash);
create index if not exists idx_agent_access_tokens_registration
  on public.agent_access_tokens (registration_id);
create index if not exists idx_agent_access_tokens_user
  on public.agent_access_tokens (user_id);

-- ---------------------------------------------------------------------------
-- agent_auth_events: lightweight audit trail for every state change, as the
-- auth.md "For apps" guide recommends.
-- ---------------------------------------------------------------------------
create table if not exists public.agent_auth_events (
  id bigint generated always as identity primary key,
  registration_id text,
  user_id uuid,
  event text not null,                          -- registration.created, claim.confirmed, token.issued, ...
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_auth_events_registration
  on public.agent_auth_events (registration_id);
create index if not exists idx_agent_auth_events_event
  on public.agent_auth_events (event);

-- ---------------------------------------------------------------------------
-- Row Level Security: deny-all by default. Only the service-role key may touch
-- these tables (it bypasses RLS). We intentionally create no policies.
-- ---------------------------------------------------------------------------
alter table public.agent_registrations enable row level security;
alter table public.agent_claim_attempts enable row level security;
alter table public.agent_access_tokens enable row level security;
alter table public.agent_auth_events enable row level security;
