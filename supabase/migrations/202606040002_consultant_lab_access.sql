-- Consultant farm, soil-test, and petiole-test read access.
-- Apply after 202606040001_consultant_client_foundation.sql.

create index if not exists idx_farms_user_id on public.farms(user_id);
create index if not exists idx_soil_test_records_farm_id on public.soil_test_records(farm_id);
create index if not exists idx_petiole_test_records_farm_id on public.petiole_test_records(farm_id);

drop policy if exists "Org members can view client farms" on public.farms;
drop policy if exists "Org members can view client soil tests" on public.soil_test_records;
drop policy if exists "Org members can view client petiole tests" on public.petiole_test_records;

create or replace function public.can_access_org_client_from_farm_owner(target_client_user_id uuid)
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
    where oc.client_user_id = target_client_user_id
      and oc.status = 'active'
      and (
        om.role in ('owner', 'admin')
        or om.is_owner = true
        or (om.role = 'agronomist' and oc.assigned_to = (select auth.uid()))
      )
  );
$$;

revoke all on function public.can_access_org_client_from_farm_owner(uuid) from public;
grant execute on function public.can_access_org_client_from_farm_owner(uuid) to authenticated;

create policy "Org members can view client farms"
  on public.farms
  for select
  to authenticated
  using (public.can_access_org_client_from_farm_owner(user_id));

create policy "Org members can view client soil tests"
  on public.soil_test_records
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.farms f
      where f.id = soil_test_records.farm_id
        and public.can_access_org_client_from_farm_owner(f.user_id)
    )
  );

create policy "Org members can view client petiole tests"
  on public.petiole_test_records
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.farms f
      where f.id = petiole_test_records.farm_id
        and public.can_access_org_client_from_farm_owner(f.user_id)
    )
  );
