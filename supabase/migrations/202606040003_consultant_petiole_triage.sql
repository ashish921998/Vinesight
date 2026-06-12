-- Consultant petiole triage queue.
-- Apply after 202606040001_consultant_client_foundation.sql and
-- 202606040002_consultant_lab_access.sql.

create table if not exists public.petiole_triage (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  farm_id bigint not null references public.farms(id) on delete cascade,
  petiole_test_id bigint references public.petiole_test_records(id) on delete cascade,
  client_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'in_review', 'reviewed', 'escalated', 'resolved')),
  severity text
    check (severity in ('low', 'medium', 'high', 'critical')),
  classification text,
  summary text,
  recommendation text,
  review_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp
);

create index if not exists idx_petiole_triage_organization_id
  on public.petiole_triage(organization_id);
create index if not exists idx_petiole_triage_client_user_id
  on public.petiole_triage(client_user_id);
create index if not exists idx_petiole_triage_farm_id
  on public.petiole_triage(farm_id);
create index if not exists idx_petiole_triage_petiole_test_id
  on public.petiole_triage(petiole_test_id);
create index if not exists idx_petiole_triage_reviewed_by
  on public.petiole_triage(reviewed_by);
create index if not exists idx_petiole_triage_status
  on public.petiole_triage(status);
create index if not exists idx_petiole_triage_org_status
  on public.petiole_triage(organization_id, status);
create index if not exists idx_petiole_triage_org_status_created
  on public.petiole_triage(organization_id, status, created_at desc);
create index if not exists idx_petiole_triage_org_client_status
  on public.petiole_triage(organization_id, client_user_id, status);

alter table public.petiole_triage enable row level security;

drop policy if exists "Org members can view client triage" on public.petiole_triage;
drop policy if exists "Org members can insert client triage" on public.petiole_triage;
drop policy if exists "Org members can update client triage" on public.petiole_triage;

create policy "Org members can view client triage"
  on public.petiole_triage
  for select
  to authenticated
  using (public.can_access_org_client(organization_id, client_user_id));

create policy "Org members can insert client triage"
  on public.petiole_triage
  for insert
  to authenticated
  with check (public.can_access_org_client(organization_id, client_user_id));

create policy "Org members can update client triage"
  on public.petiole_triage
  for update
  to authenticated
  using (public.can_access_org_client(organization_id, client_user_id))
  with check (public.can_access_org_client(organization_id, client_user_id));

create or replace function public.validate_petiole_triage_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  farm_owner uuid;
  test_farm_id bigint;
begin
  select f.user_id into farm_owner
  from public.farms f
  where f.id = new.farm_id;

  if farm_owner is null or farm_owner <> new.client_user_id then
    raise exception 'farm_id % does not belong to client_user_id %', new.farm_id, new.client_user_id;
  end if;

  if new.petiole_test_id is not null then
    select p.farm_id into test_farm_id
    from public.petiole_test_records p
    where p.id = new.petiole_test_id;

    if test_farm_id is null or test_farm_id <> new.farm_id then
      raise exception 'petiole_test_id % does not belong to farm_id %', new.petiole_test_id, new.farm_id;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.validate_petiole_triage_consistency() from public;

create or replace function public.prevent_petiole_triage_scope_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (old.organization_id, old.client_user_id, old.farm_id, old.petiole_test_id)
     is distinct from
     (new.organization_id, new.client_user_id, new.farm_id, new.petiole_test_id) then
    raise exception 'petiole_triage scope columns (organization_id, client_user_id, farm_id, petiole_test_id) are immutable after creation';
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_petiole_triage_scope_mutation() from public;

drop trigger if exists update_petiole_triage_updated_at on public.petiole_triage;
drop trigger if exists validate_petiole_triage_consistency_trigger on public.petiole_triage;
drop trigger if exists prevent_petiole_triage_scope_mutation_trigger on public.petiole_triage;

create trigger update_petiole_triage_updated_at
  before update on public.petiole_triage
  for each row
  execute function public.update_updated_at_column();

create trigger validate_petiole_triage_consistency_trigger
  before insert or update on public.petiole_triage
  for each row
  execute function public.validate_petiole_triage_consistency();

create trigger prevent_petiole_triage_scope_mutation_trigger
  before update on public.petiole_triage
  for each row
  execute function public.prevent_petiole_triage_scope_mutation();
