-- Farmer-facing recommendations: close the loop so a farmer can READ the
-- consultant's petiole-triage advice in the mobile app.
--
-- Two halves, both missing before this migration:
--   1. CREATION  — when a farmer submits a petiole test, auto-create a
--      `petiole_triage` row (status 'pending') for every org they are an
--      active client of, so the consultant queue actually fills up.
--   2. READ PATH — a SECURITY DEFINER RPC the farmer calls to read back the
--      recommendations a consultant has written. The base table keeps its
--      consultant-only RLS; the RPC is hard-scoped to auth.uid() and never
--      selects the internal `review_notes` column.
--
-- Apply after 202606040003_consultant_petiole_triage.sql (defines petiole_triage,
-- its consistency trigger, and can_access_org_client).

-- ============================================================================
-- 1. CREATION: petiole test insert -> triage queue row(s)
-- ============================================================================

-- Durable idempotency guard. The trigger below carries a runtime NOT EXISTS
-- check, but that only protects concurrent fan-outs of the *same* test; it does
-- not stop a backfill, manual insert, or trigger retry from creating a duplicate
-- (petiole_test_id, organization_id) pair. This partial unique index makes the
-- one-row-per-test-per-org invariant enforced by the database, and lets the
-- insert below fall back to ON CONFLICT DO NOTHING instead of racing. Partial
-- because petiole_test_id is nullable (manual triage rows carry no test).
create unique index if not exists idx_petiole_triage_unique_test_org
  on public.petiole_triage (petiole_test_id, organization_id)
  where petiole_test_id is not null;

-- SECURITY DEFINER so the farmer's INSERT into petiole_test_records can fan out
-- into petiole_triage despite the table's consultant-only INSERT policy. The row
-- is constructed so the existing validate_petiole_triage_consistency trigger
-- passes: client_user_id = farms.user_id (the owner) and petiole_test_id belongs
-- to farm_id. A farmer who is not an active client of any org inserts zero rows
-- (the join yields nothing) — the function never raises, so it can never break a
-- petiole test submission.
create or replace function public.create_triage_from_petiole_test()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.petiole_triage (
    organization_id,
    farm_id,
    petiole_test_id,
    client_user_id,
    status
  )
  select
    oc.organization_id,
    new.farm_id,
    new.id,
    f.user_id,
    'pending'
  from public.farms f
  join public.organization_clients oc
    on oc.client_user_id = f.user_id
   and oc.status = 'active'
  where f.id = new.farm_id
    and f.user_id is not null
    and not exists (
      select 1
      from public.petiole_triage t
      where t.petiole_test_id = new.id
        and t.organization_id = oc.organization_id
    )
  on conflict (petiole_test_id, organization_id)
    where petiole_test_id is not null
  do nothing;

  return new;
end;
$$;

revoke all on function public.create_triage_from_petiole_test() from public;

drop trigger if exists create_triage_from_petiole_test_trigger on public.petiole_test_records;

create trigger create_triage_from_petiole_test_trigger
  after insert on public.petiole_test_records
  for each row
  execute function public.create_triage_from_petiole_test();

-- ============================================================================
-- 2. READ PATH: farmer reads their own reviewed recommendations
-- ============================================================================

-- Returns only PUBLISHED recommendations, scoped to the calling farmer. A
-- consultant types `recommendation` and sets `status` independently, so a
-- non-null recommendation alone can still be an in-progress draft (status
-- 'pending'/'in_review'); the status gate below ensures the farmer only sees
-- advice the consultant has marked 'reviewed' or 'resolved'. SECURITY DEFINER
-- bypasses the consultant-only RLS on petiole_triage, but the WHERE clause
-- hard-locks results to auth.uid() = client_user_id (and re-checks farm
-- ownership), and the column list deliberately omits review_notes
-- (consultant-internal, "not shown to farmer"). Pass p_farm_id to filter to a
-- single farm, or leave null for all of the farmer's farms.
create or replace function public.get_farmer_recommendations(p_farm_id bigint default null)
returns table (
  id uuid,
  farm_id bigint,
  farm_name text,
  petiole_test_id bigint,
  status text,
  severity text,
  classification text,
  summary text,
  recommendation text,
  reviewed_by_name text,
  test_date text,
  reviewed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id,
    t.farm_id,
    f.name::text                          as farm_name,
    t.petiole_test_id,
    t.status,
    t.severity,
    t.classification,
    t.summary,
    t.recommendation,
    rp.full_name::text                    as reviewed_by_name,
    to_char(p.date, 'YYYY-MM-DD')         as test_date,
    t.reviewed_at,
    t.created_at,
    t.updated_at
  from public.petiole_triage t
  join public.farms f
    on f.id = t.farm_id
  left join public.petiole_test_records p
    on p.id = t.petiole_test_id
  left join public.profiles rp
    on rp.id = t.reviewed_by
  where auth.uid() is not null
    and t.client_user_id = auth.uid()
    and f.user_id = auth.uid()
    and t.recommendation is not null
    and t.status in ('reviewed', 'resolved')
    and (p_farm_id is null or t.farm_id = p_farm_id)
  order by coalesce(t.reviewed_at, t.updated_at, t.created_at) desc;
$$;

revoke all on function public.get_farmer_recommendations(bigint) from public;
revoke all on function public.get_farmer_recommendations(bigint) from anon;
grant execute on function public.get_farmer_recommendations(bigint) to authenticated;

-- Note: a one-time backfill of triage rows from pre-existing petiole tests was
-- intentionally omitted. Triage is created only for petiole tests submitted after
-- this migration, to avoid flooding consultant queues with historical tests.
