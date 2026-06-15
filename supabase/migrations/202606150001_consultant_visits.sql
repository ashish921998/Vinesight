-- Consultant farm visits + per-recommendation follow-up verification.
-- Apply after 202606040003_consultant_petiole_triage.sql.
--
-- On every visit an agronomist (or admin/owner) records whether each prior
-- recommendation for the farmer has been followed. A visit is scoped to a
-- single farmer (client_user_id) within the organization and is visible to
-- whoever may act on that client via can_access_org_client().

create table if not exists public.consultant_visits (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_user_id uuid not null references auth.users(id) on delete cascade,
  farm_id bigint references public.farms(id) on delete set null,
  visited_by uuid not null references auth.users(id) on delete set null,
  visit_date date not null default current_date,
  summary text,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp
);

create index if not exists idx_consultant_visits_organization_id
  on public.consultant_visits(organization_id);
create index if not exists idx_consultant_visits_client_user_id
  on public.consultant_visits(client_user_id);
create index if not exists idx_consultant_visits_visited_by
  on public.consultant_visits(visited_by);
create index if not exists idx_consultant_visits_farm_id
  on public.consultant_visits(farm_id);
create index if not exists idx_consultant_visits_org_client_date
  on public.consultant_visits(organization_id, client_user_id, visit_date desc);

-- Per-recommendation follow-up captured during a visit. Each row records whether
-- one triage recommendation was followed, optionally with a note.
create table if not exists public.visit_recommendation_followups (
  id uuid primary key default uuid_generate_v4(),
  visit_id uuid not null references public.consultant_visits(id) on delete cascade,
  triage_id uuid not null references public.petiole_triage(id) on delete cascade,
  followed_status text not null
    check (followed_status in ('followed', 'partially_followed', 'not_followed')),
  note text,
  created_at timestamptz default current_timestamp,
  constraint visit_recommendation_followups_visit_triage_unique unique (visit_id, triage_id)
);

create index if not exists idx_visit_followups_visit_id
  on public.visit_recommendation_followups(visit_id);
create index if not exists idx_visit_followups_triage_id
  on public.visit_recommendation_followups(triage_id);

-- ----------------------------------------------------------------------------
-- consultant_visits RLS: anyone who can act on the client can read/write visits.
-- INSERT additionally pins visited_by to the acting user so a visit always
-- records who actually performed it.
-- ----------------------------------------------------------------------------
alter table public.consultant_visits enable row level security;

drop policy if exists "Org members can view client visits" on public.consultant_visits;
drop policy if exists "Org members can insert client visits" on public.consultant_visits;
drop policy if exists "Org members can update client visits" on public.consultant_visits;
drop policy if exists "Org members can delete client visits" on public.consultant_visits;

create policy "Org members can view client visits"
  on public.consultant_visits
  for select
  to authenticated
  using (public.can_access_org_client(organization_id, client_user_id));

create policy "Org members can insert client visits"
  on public.consultant_visits
  for insert
  to authenticated
  with check (
    public.can_access_org_client(organization_id, client_user_id)
    and visited_by = (select auth.uid())
  );

create policy "Org members can update client visits"
  on public.consultant_visits
  for update
  to authenticated
  using (public.can_access_org_client(organization_id, client_user_id))
  with check (public.can_access_org_client(organization_id, client_user_id));

create policy "Org members can delete client visits"
  on public.consultant_visits
  for delete
  to authenticated
  using (public.can_access_org_client(organization_id, client_user_id));

-- ----------------------------------------------------------------------------
-- visit_recommendation_followups RLS: derived from the parent visit's access.
-- ----------------------------------------------------------------------------
alter table public.visit_recommendation_followups enable row level security;

drop policy if exists "Org members can view visit followups" on public.visit_recommendation_followups;
drop policy if exists "Org members can insert visit followups" on public.visit_recommendation_followups;
drop policy if exists "Org members can update visit followups" on public.visit_recommendation_followups;
drop policy if exists "Org members can delete visit followups" on public.visit_recommendation_followups;

create policy "Org members can view visit followups"
  on public.visit_recommendation_followups
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.consultant_visits v
      where v.id = visit_recommendation_followups.visit_id
        and public.can_access_org_client(v.organization_id, v.client_user_id)
    )
  );

create policy "Org members can insert visit followups"
  on public.visit_recommendation_followups
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.consultant_visits v
      where v.id = visit_recommendation_followups.visit_id
        and public.can_access_org_client(v.organization_id, v.client_user_id)
    )
  );

create policy "Org members can update visit followups"
  on public.visit_recommendation_followups
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.consultant_visits v
      where v.id = visit_recommendation_followups.visit_id
        and public.can_access_org_client(v.organization_id, v.client_user_id)
    )
  )
  with check (
    exists (
      select 1
      from public.consultant_visits v
      where v.id = visit_recommendation_followups.visit_id
        and public.can_access_org_client(v.organization_id, v.client_user_id)
    )
  );

create policy "Org members can delete visit followups"
  on public.visit_recommendation_followups
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.consultant_visits v
      where v.id = visit_recommendation_followups.visit_id
        and public.can_access_org_client(v.organization_id, v.client_user_id)
    )
  );

-- ----------------------------------------------------------------------------
-- Integrity: a visit's farm (when set) must belong to the visited farmer, and
-- a follow-up's triage row must belong to the same org + farmer as its visit.
-- ----------------------------------------------------------------------------
create or replace function public.validate_consultant_visit_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  farm_owner uuid;
begin
  if new.farm_id is not null then
    select f.user_id into farm_owner
    from public.farms f
    where f.id = new.farm_id;

    if farm_owner is null or farm_owner <> new.client_user_id then
      raise exception 'farm_id % does not belong to client_user_id %', new.farm_id, new.client_user_id;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.validate_consultant_visit_consistency() from public;

create or replace function public.validate_visit_followup_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_client uuid;
  t_org uuid;
  t_client uuid;
begin
  select organization_id, client_user_id into v_org, v_client
  from public.consultant_visits
  where id = new.visit_id;

  select organization_id, client_user_id into t_org, t_client
  from public.petiole_triage
  where id = new.triage_id;

  if t_org is null then
    raise exception 'triage_id % does not exist', new.triage_id;
  end if;

  if t_org <> v_org or t_client <> v_client then
    raise exception 'triage_id % does not belong to the same organization/farmer as visit %', new.triage_id, new.visit_id;
  end if;

  return new;
end;
$$;

revoke all on function public.validate_visit_followup_consistency() from public;

drop trigger if exists update_consultant_visits_updated_at on public.consultant_visits;
drop trigger if exists validate_consultant_visit_consistency_trigger on public.consultant_visits;
drop trigger if exists validate_visit_followup_consistency_trigger on public.visit_recommendation_followups;

create trigger update_consultant_visits_updated_at
  before update on public.consultant_visits
  for each row
  execute function public.update_updated_at_column();

create trigger validate_consultant_visit_consistency_trigger
  before insert or update on public.consultant_visits
  for each row
  execute function public.validate_consultant_visit_consistency();

create trigger validate_visit_followup_consistency_trigger
  before insert or update on public.visit_recommendation_followups
  for each row
  execute function public.validate_visit_followup_consistency();
