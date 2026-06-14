-- Organization member invitations.
-- Link-only, email-addressed invites for org TEAM MEMBERS (admin / agronomist).
-- Distinct from farmer_invitations (which onboards farmer clients).
-- Apply after organizations / organization_members and the is_org_admin() helper exist
-- (see 202606040001_consultant_client_foundation.sql).

create extension if not exists "uuid-ossp";

create table if not exists public.organization_member_invitations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  first_name text not null,
  last_name text not null,
  -- Owner is reserved for the org creator and can never be invited.
  role text not null check (role in ('admin', 'agronomist')),
  token text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp
);

create index if not exists idx_org_member_invitations_organization_id
  on public.organization_member_invitations(organization_id);
-- No separate index on token: the UNIQUE constraint on the column already creates one.
create index if not exists idx_org_member_invitations_status
  on public.organization_member_invitations(organization_id, status);

-- At most one live (pending) invite per email per organization.
create unique index if not exists idx_org_member_invitations_one_pending_per_email
  on public.organization_member_invitations(organization_id, lower(email))
  where status = 'pending';

alter table public.organization_member_invitations enable row level security;

drop policy if exists "Admins can view member invitations" on public.organization_member_invitations;
drop policy if exists "Admins can insert member invitations" on public.organization_member_invitations;
drop policy if exists "Admins can update member invitations" on public.organization_member_invitations;
drop policy if exists "Admins can delete member invitations" on public.organization_member_invitations;

-- Only admins/owners manage invites. Acceptance is performed server-side with the
-- service-role client (the invitee is not yet authenticated), so no public SELECT is needed.
create policy "Admins can view member invitations"
  on public.organization_member_invitations
  for select
  to authenticated
  using (public.is_org_admin(organization_id));

create policy "Admins can insert member invitations"
  on public.organization_member_invitations
  for insert
  to authenticated
  with check (public.is_org_admin(organization_id));

create policy "Admins can update member invitations"
  on public.organization_member_invitations
  for update
  to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy "Admins can delete member invitations"
  on public.organization_member_invitations
  for delete
  to authenticated
  using (public.is_org_admin(organization_id));

drop trigger if exists update_org_member_invitations_updated_at
  on public.organization_member_invitations;

create trigger update_org_member_invitations_updated_at
  before update on public.organization_member_invitations
  for each row
  execute function public.update_updated_at_column();
