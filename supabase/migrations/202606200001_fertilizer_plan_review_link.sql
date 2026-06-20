-- Close the Petiole Review -> Fertilizer Plan loop.
--
-- Three things, all required for the consultant workspace to be reliable:
--   1. LINK    — fertilizer_plans.petiole_triage_id ties a plan to the exact
--      Petiole Review it was produced for, so the workspace can resolve "the
--      plan for the current review" vs "the previous plan" without guessing,
--      and one review can own at most one plan.
--   2. ATOMIC  — send_fertilizer_plan()/update_fertilizer_plan() do all their
--      writes in a single transaction. The send call also flips the linked
--      review to 'reviewed'. A plan can never reach the farmer while its review
--      stays pending, and a failed edit can never leave items half-written.
--   3. READ    — get_farmer_recommendations() now also returns the structured
--      plan (title, notes, ordered items with method/date/frequency/notes) so
--      the farmer app reads the real Fertilizer Plan, not just the plan title.
--
-- Apply AFTER 202606160001_farmer_recommendations.sql (defines the base RPC,
-- the auto-triage trigger, and the unique (petiole_test_id, organization_id)
-- index it depends on).

-- ============================================================================
-- 1. LINK: fertilizer_plans -> petiole_triage
-- ============================================================================

alter table public.fertilizer_plans
  add column if not exists petiole_triage_id uuid
    references public.petiole_triage(id) on delete set null;

-- At most one plan per review. Partial because legacy/ad-hoc plans carry no
-- review link (petiole_triage_id is null) and several of those may coexist.
create unique index if not exists idx_fertilizer_plans_unique_triage
  on public.fertilizer_plans (petiole_triage_id)
  where petiole_triage_id is not null;

create index if not exists idx_fertilizer_plans_petiole_triage_id
  on public.fertilizer_plans (petiole_triage_id);

-- Supports the workspace's per-farm, newest-first plan lookup.
create index if not exists idx_fertilizer_plans_farm_created
  on public.fertilizer_plans (farm_id, created_at desc);

-- ============================================================================
-- 2. ATOMIC writes
-- ============================================================================

-- Shared item validator. Raises on a malformed item array so both the send and
-- update paths reject bad input at the integrity boundary (the UI also filters,
-- but never trust the caller). Requires a non-empty array, a fertilizer name,
-- a strictly positive quantity, and a positive integer frequency per item.
create or replace function public.validate_fertilizer_plan_items(p_items jsonb)
returns void
language plpgsql
immutable
as $$
declare
  v_item jsonb;
  v_qty numeric;
  v_freq numeric;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'A plan must have at least one fertilizer item';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if coalesce(btrim(v_item->>'fertilizer_name'), '') = '' then
      raise exception 'Every fertilizer item needs a name';
    end if;

    begin
      v_qty := (v_item->>'quantity')::numeric;
    exception when others then
      raise exception 'Invalid quantity for "%"', v_item->>'fertilizer_name';
    end;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Quantity for "%" must be greater than zero', v_item->>'fertilizer_name';
    end if;

    if (v_item ? 'application_frequency')
       and coalesce(btrim(v_item->>'application_frequency'), '') <> '' then
      begin
        v_freq := (v_item->>'application_frequency')::numeric;
      exception when others then
        raise exception 'Invalid frequency for "%"', v_item->>'fertilizer_name';
      end;
      if v_freq is null or v_freq < 1 or v_freq <> floor(v_freq) then
        raise exception 'Frequency for "%" must be a whole number >= 1', v_item->>'fertilizer_name';
      end if;
    end if;
  end loop;
end;
$$;

revoke all on function public.validate_fertilizer_plan_items(jsonb) from public;

-- Insert the rows of a validated item array into a plan, in array order.
create or replace function public.insert_fertilizer_plan_items(p_plan_id uuid, p_items jsonb)
returns void
language plpgsql
as $$
declare
  v_item jsonb;
  v_idx int := 0;
begin
  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    insert into public.fertilizer_plan_items (
      plan_id, application_date, fertilizer_name, quantity, unit,
      application_method, application_frequency, notes, sort_order
    )
    values (
      p_plan_id,
      nullif(btrim(v_item->>'application_date'), '')::date,
      btrim(v_item->>'fertilizer_name'),
      (v_item->>'quantity')::numeric,
      coalesce(nullif(btrim(v_item->>'unit'), ''), 'kg/acre'),
      nullif(btrim(v_item->>'application_method'), ''),
      coalesce(nullif(btrim(v_item->>'application_frequency'), '')::int, 1),
      nullif(btrim(v_item->>'notes'), ''),
      v_idx
    );
    v_idx := v_idx + 1;
  end loop;
end;
$$;

revoke all on function public.insert_fertilizer_plan_items(uuid, jsonb) from public;

-- SEND: create the plan + items for a Petiole Review and complete the review,
-- all in one transaction. Scope (organization, farm, farmer) is derived from the
-- review itself — caller-supplied org/farm ids are never trusted. SECURITY
-- DEFINER lets the two writes commit together under the consultant-only
-- policies; can_access_org_client re-checks the caller may act on this client,
-- so the definer privilege never widens authorization. Returns the new plan id.
create or replace function public.send_fertilizer_plan(
  p_review_id uuid,
  p_title text,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_farm_id bigint;
  v_client uuid;
  v_status text;
  v_title text := btrim(p_title);
  v_plan_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if v_title = '' then
    raise exception 'A plan needs a title';
  end if;

  select organization_id, farm_id, client_user_id, status
    into v_org, v_farm_id, v_client, v_status
  from public.petiole_triage
  where id = p_review_id;

  if not found then
    raise exception 'Petiole review % not found', p_review_id;
  end if;

  if not public.can_access_org_client(v_org, v_client) then
    raise exception 'Forbidden';
  end if;

  if v_status not in ('pending', 'in_review') then
    raise exception 'Petiole review % is already completed', p_review_id;
  end if;

  if exists (select 1 from public.fertilizer_plans where petiole_triage_id = p_review_id) then
    raise exception 'Petiole review % already has a plan', p_review_id;
  end if;

  perform public.validate_fertilizer_plan_items(p_items);

  insert into public.fertilizer_plans (
    farm_id, created_by, organization_id, title, notes, petiole_triage_id
  )
  values (
    v_farm_id, auth.uid(), v_org, v_title, nullif(btrim(p_notes), ''), p_review_id
  )
  returning id into v_plan_id;

  perform public.insert_fertilizer_plan_items(v_plan_id, p_items);

  update public.petiole_triage
  set status = 'reviewed',
      recommendation = v_title,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_review_id;

  return v_plan_id;
end;
$$;

revoke all on function public.send_fertilizer_plan(uuid, text, text, jsonb) from public;
revoke all on function public.send_fertilizer_plan(uuid, text, text, jsonb) from anon;
grant execute on function public.send_fertilizer_plan(uuid, text, text, jsonb) to authenticated;

-- UPDATE: edit an existing plan's title/notes and fully replace its items in one
-- transaction (delete-all + reinsert), so a failed edit can never leave some
-- items changed and others stale. Authorization is derived from the plan's own
-- organization + farm owner, re-checked via can_access_org_client.
create or replace function public.update_fertilizer_plan(
  p_plan_id uuid,
  p_title text,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_farm_id bigint;
  v_owner uuid;
  v_title text := btrim(p_title);
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if v_title = '' then
    raise exception 'A plan needs a title';
  end if;

  select organization_id, farm_id into v_org, v_farm_id
  from public.fertilizer_plans
  where id = p_plan_id;

  if not found then
    raise exception 'Fertilizer plan % not found', p_plan_id;
  end if;

  select user_id into v_owner from public.farms where id = v_farm_id;

  if v_owner is null or not public.can_access_org_client(v_org, v_owner) then
    raise exception 'Forbidden';
  end if;

  perform public.validate_fertilizer_plan_items(p_items);

  update public.fertilizer_plans
  set title = v_title,
      notes = nullif(btrim(p_notes), ''),
      updated_at = now()
  where id = p_plan_id;

  delete from public.fertilizer_plan_items where plan_id = p_plan_id;
  perform public.insert_fertilizer_plan_items(p_plan_id, p_items);

  return p_plan_id;
end;
$$;

revoke all on function public.update_fertilizer_plan(uuid, text, text, jsonb) from public;
revoke all on function public.update_fertilizer_plan(uuid, text, text, jsonb) from anon;
grant execute on function public.update_fertilizer_plan(uuid, text, text, jsonb) to authenticated;

-- ============================================================================
-- 3. READ: farmer reads the structured Fertilizer Plan, not just the title
-- ============================================================================

-- Adding a column to the RETURNS TABLE changes the result type, which
-- CREATE OR REPLACE cannot do — drop then recreate, then reapply grants. Same
-- security posture as the base version (auth.uid()-scoped, review_notes never
-- selected, status gated to reviewed/resolved); only the new fertilizer_plan
-- column is added.
drop function if exists public.get_farmer_recommendations(bigint);

create function public.get_farmer_recommendations(p_farm_id bigint default null)
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
  updated_at timestamptz,
  fertilizer_plan jsonb
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
    t.updated_at,
    (
      select jsonb_build_object(
        'id', fp.id,
        'title', fp.title,
        'notes', fp.notes,
        'created_at', fp.created_at,
        'items', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'fertilizer_name', i.fertilizer_name,
              'quantity', i.quantity,
              'unit', i.unit,
              'application_method', i.application_method,
              'application_date', i.application_date,
              'application_frequency', i.application_frequency,
              'notes', i.notes
            )
            order by i.sort_order
          )
          from public.fertilizer_plan_items i
          where i.plan_id = fp.id
        ), '[]'::jsonb)
      )
      from public.fertilizer_plans fp
      where fp.petiole_triage_id = t.id
      order by fp.created_at desc
      limit 1
    )                                     as fertilizer_plan
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
