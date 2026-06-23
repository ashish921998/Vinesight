-- Command Center dashboard aggregates.
--
-- Two read-only SECURITY DEFINER RPCs that roll up org-wide data for the
-- consultant Command Center charts. Both are hard-scoped with
-- can_access_org_client() so they return exactly what the caller may see:
-- owner/admin → the whole org, agronomist → only their assigned clients
-- (the same visibility the base-table RLS enforces). SECURITY DEFINER is needed
-- to aggregate across many clients' rows in one round-trip without tripping the
-- per-row RLS; the explicit can_access_org_client() filter re-imposes the scope.
--
-- Apply after 202606150001_consultant_visits.sql (visits + follow-ups) and
-- 202606040001_consultant_client_foundation.sql (can_access_org_client).

-- ============================================================================
-- 1. Recommendation adherence: counts of follow-up outcomes in the caller's scope
-- ============================================================================
create or replace function public.get_org_followup_adherence()
returns table (
  followed_status text,
  total bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select f.followed_status, count(*)::bigint as total
  from public.visit_recommendation_followups f
  join public.consultant_visits v
    on v.id = f.visit_id
  where auth.uid() is not null
    and public.can_access_org_client(v.organization_id, v.client_user_id)
  group by f.followed_status;
$$;

revoke all on function public.get_org_followup_adherence() from public;
revoke all on function public.get_org_followup_adherence() from anon;
grant execute on function public.get_org_followup_adherence() to authenticated;

-- ============================================================================
-- 2. Latest petiole test per accessible farm (for the nutrient-status chart)
-- ============================================================================
-- Returns one row per farm the caller can access: the most recent petiole
-- test's canonical `parameters` blob. The client buckets each value against the
-- bloom-stage ranges (PETIOLE_RANGES) — kept in TS so thresholds stay
-- single-sourced. DISTINCT ON picks the latest sample (tie-broken by created_at)
-- per farm. A farm owned by a client of multiple orgs yields identical rows that
-- DISTINCT collapses; the WHERE keeps only farms in an org the caller can access.
create or replace function public.get_org_latest_petiole()
returns table (
  farm_id bigint,
  sample_date date,
  parameters jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (p.farm_id)
    p.farm_id,
    p.date as sample_date,
    p.parameters as parameters
  from public.petiole_test_records p
  join public.farms f
    on f.id = p.farm_id
  join public.organization_clients oc
    on oc.client_user_id = f.user_id
   and oc.status = 'active'
  where auth.uid() is not null
    and p.farm_id is not null
    and public.can_access_org_client(oc.organization_id, oc.client_user_id)
  order by p.farm_id, p.date desc, p.created_at desc nulls last;
$$;

revoke all on function public.get_org_latest_petiole() from public;
revoke all on function public.get_org_latest_petiole() from anon;
grant execute on function public.get_org_latest_petiole() to authenticated;
