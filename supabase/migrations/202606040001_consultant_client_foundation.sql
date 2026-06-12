-- Consultant client foundation.
-- Apply after the existing organizations and organization_members tables exist.

create extension if not exists "uuid-ossp";

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = current_timestamp;
  return new;
end;
$$;

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.organization_members'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format(
      'alter table public.organization_members drop constraint if exists %I',
      constraint_record.conname
    );
  end loop;
end $$;

update public.organization_members
set role = 'agronomist'
where role is null
   or role not in ('owner', 'admin', 'agronomist');

alter table public.organization_members
  add constraint organization_members_role_check
  check (role in ('owner', 'admin', 'agronomist'));

alter table public.organization_members
  alter column role set default 'agronomist',
  alter column role set not null;

create table if not exists public.organization_clients (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_user_id uuid not null references auth.users(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null,
  assigned_by uuid references auth.users(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  notes text,
  assigned_at timestamptz default current_timestamp,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp,
  constraint organization_clients_org_client_unique unique (organization_id, client_user_id)
);

alter table public.organization_clients
  add column if not exists assigned_to uuid references auth.users(id) on delete set null,
  add column if not exists assigned_by uuid references auth.users(id) on delete set null,
  add column if not exists status text not null default 'active',
  add column if not exists notes text,
  add column if not exists assigned_at timestamptz default current_timestamp,
  add column if not exists created_at timestamptz default current_timestamp,
  add column if not exists updated_at timestamptz default current_timestamp;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'organization_clients_status_check'
      and conrelid = 'public.organization_clients'::regclass
  ) then
    alter table public.organization_clients
      add constraint organization_clients_status_check
      check (status in ('active', 'inactive', 'pending'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'organization_clients_org_client_unique'
      and conrelid = 'public.organization_clients'::regclass
  ) then
    alter table public.organization_clients
      add constraint organization_clients_org_client_unique
      unique (organization_id, client_user_id);
  end if;
end $$;

create index if not exists idx_organization_members_organization_id
  on public.organization_members(organization_id);
create index if not exists idx_organization_members_user_id
  on public.organization_members(user_id);
create index if not exists idx_organization_members_org_user
  on public.organization_members(organization_id, user_id);
create index if not exists idx_organization_clients_organization_id
  on public.organization_clients(organization_id);
create index if not exists idx_organization_clients_client_user_id
  on public.organization_clients(client_user_id);
create index if not exists idx_organization_clients_assigned_to
  on public.organization_clients(assigned_to);
create index if not exists idx_organization_clients_assigned_by
  on public.organization_clients(assigned_by);
create index if not exists idx_organization_clients_org_client
  on public.organization_clients(organization_id, client_user_id);
create index if not exists idx_organization_clients_org_active_assigned
  on public.organization_clients(organization_id, assigned_to, client_user_id)
  where status = 'active';
create unique index if not exists idx_organization_clients_one_active_per_client
  on public.organization_clients(client_user_id)
  where status = 'active';

create or replace function public.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_org_member(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;

create or replace function public.is_org_admin(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = (select auth.uid())
      and (om.role in ('owner', 'admin') or om.is_owner = true)
  );
$$;

revoke all on function public.is_org_admin(uuid) from public;
grant execute on function public.is_org_admin(uuid) to authenticated;

create or replace function public.can_access_org_client(
  target_organization_id uuid,
  target_client_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_clients oc
    join public.organization_members om
      on om.organization_id = oc.organization_id
     and om.user_id = (select auth.uid())
    where oc.organization_id = target_organization_id
      and oc.client_user_id = target_client_user_id
      and oc.status = 'active'
      and (
        om.role in ('owner', 'admin')
        or om.is_owner = true
        or (om.role = 'agronomist' and oc.assigned_to = (select auth.uid()))
      )
  );
$$;

revoke all on function public.can_access_org_client(uuid, uuid) from public;
grant execute on function public.can_access_org_client(uuid, uuid) to authenticated;

alter table public.organization_clients enable row level security;

drop policy if exists "Members can view organization clients" on public.organization_clients;
drop policy if exists "Admins can insert organization clients" on public.organization_clients;
drop policy if exists "Admins can update organization clients" on public.organization_clients;
drop policy if exists "Admins can delete organization clients" on public.organization_clients;

create policy "Members can view organization clients"
  on public.organization_clients
  for select
  to authenticated
  using (
    client_user_id = (select auth.uid())
    or public.can_access_org_client(organization_id, client_user_id)
  );

create policy "Admins can insert organization clients"
  on public.organization_clients
  for insert
  to authenticated
  with check (public.is_org_admin(organization_id));

create policy "Admins can update organization clients"
  on public.organization_clients
  for update
  to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy "Admins can delete organization clients"
  on public.organization_clients
  for delete
  to authenticated
  using (public.is_org_admin(organization_id));

drop policy if exists "Users can view org member profiles" on public.profiles;

create policy "Users can view org member profiles"
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members om1
      join public.organization_members om2
        on om1.organization_id = om2.organization_id
      where om1.user_id = (select auth.uid())
        and om2.user_id = profiles.id
    )
    or exists (
      select 1
      from public.organization_clients oc
      where oc.client_user_id = profiles.id
        and public.can_access_org_client(oc.organization_id, oc.client_user_id)
    )
  );

drop trigger if exists update_organization_clients_updated_at on public.organization_clients;

create trigger update_organization_clients_updated_at
  before update on public.organization_clients
  for each row
  execute function public.update_updated_at_column();
