-- Phase W (RN issue #199, units plan §6): plan-item identity + first-class basis.
--
-- Until now plan items carried product identity only as the canonical catalog
-- name stored verbatim (P2 "string-level convergence") and quantity basis only
-- inside the unit string. This migration upgrades both to first-class columns:
--
--   product_id     nullable FK -> chemical_products. Plan authoring stamps the
--                  picked catalog product; reports key plan-compliance on
--                  identity instead of name matching. ON DELETE SET NULL: a
--                  prescription outlives catalog edits — the name column
--                  remains as the fallback the P2 contract already relies on.
--
--   quantity_basis 'total' | 'per_acre' | 'per_liter_water'. Null on legacy
--                  and web-authored rows — readers fall back to inferring the
--                  basis from the unit string exactly as they do today (the
--                  quantity kernel gives unit-carried basis priority anyway).
--                  Deliberately NOT derived in SQL: the app-side quantity
--                  kernel is the only sanctioned unit interpreter, and a
--                  second parser in the database would reintroduce the
--                  drifting-parsers problem this plan exists to kill.
--
--   unit CHECK    both apps' pickers emit a closed set (web PLAN_ITEM_UNIT_OPTIONS
--                  and RN MEASURE_TO_UNIT are the identical five: kg/acre,
--                  g/acre, L/acre, ml/acre, ppm). The constraint admits that
--                  set plus bare-mass/volume spellings, gm aliases, the
--                  legacy column default 'kg', and per-liter concentration
--                  spellings — everything kernel-parseable that either app
--                  can write. Case-insensitive so 'L/acre' and 'l/acre' both
--                  pass. All 7 existing rows (kg/acre, L/acre, ppm) satisfy it.
--
-- The send/update RPCs need no signature change — they pass p_items through
-- to the shared validator + inserter, which are extended below. CREATE OR
-- REPLACE preserves the existing revokes/grants on both.

-- ── 1. product_id ───────────────────────────────────────────────────────────

alter table public.fertilizer_plan_items
  add column if not exists product_id bigint references public.chemical_products(id) on delete set null;

comment on column public.fertilizer_plan_items.product_id is
  'Master-catalog product this prescription refers to (chemical_products.id). Null for custom/legacy items — fertilizer_name remains the fallback identity.';

create index if not exists idx_fertilizer_plan_items_product_id
  on public.fertilizer_plan_items(product_id)
  where product_id is not null;

-- ── 2. quantity_basis ───────────────────────────────────────────────────────

alter table public.fertilizer_plan_items
  add column if not exists quantity_basis text;

comment on column public.fertilizer_plan_items.quantity_basis is
  'How the quantity relates to the plot: total | per_acre | per_liter_water. Null = legacy/web row; readers infer the basis from the unit string as before.';

do $do$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'fertilizer_plan_items_quantity_basis_check'
  ) then
    alter table public.fertilizer_plan_items
      add constraint fertilizer_plan_items_quantity_basis_check
      check (quantity_basis is null or quantity_basis in ('total', 'per_acre', 'per_liter_water'));
  end if;
end
$do$;

-- ── 3. unit CHECK constraint ────────────────────────────────────────────────

do $do$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'fertilizer_plan_items_unit_check'
  ) then
    alter table public.fertilizer_plan_items
      add constraint fertilizer_plan_items_unit_check
      check (
        unit is null
        or lower(unit) = any (array[
          -- bare mass / volume (column default 'kg' + kernel display scales)
          'kg', 'g', 'gm', 'l', 'ml',
          -- per-acre rates (both apps' pickers)
          'kg/acre', 'g/acre', 'gm/acre', 'l/acre', 'ml/acre',
          -- per-liter-water concentrations
          'g/l', 'gm/l', 'ml/l', 'ppm'
        ])
      );
  end if;
end
$do$;

-- ── 4. Extend the shared validator ──────────────────────────────────────────
-- Same signature (jsonb), so existing grants/revokes are preserved and the
-- send/update RPCs pick this up without changes.

create or replace function public.validate_fertilizer_plan_items(p_items jsonb)
returns void
language plpgsql
immutable
as $$
declare
  v_item jsonb;
  v_qty numeric;
  v_freq numeric;
  v_basis text;
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

    -- product_id: when present it must be a JSON number (the catalog id).
    -- Existence against chemical_products is checked at insert, not here —
    -- this validator is IMMUTABLE and must not read tables.
    if (v_item ? 'product_id')
       and jsonb_typeof(v_item->'product_id') not in ('number', 'null') then
      raise exception 'Invalid product_id for "%"', v_item->>'fertilizer_name';
    end if;

    -- quantity_basis: when present and non-empty it must be a known basis.
    if (v_item ? 'quantity_basis')
       and coalesce(btrim(v_item->>'quantity_basis'), '') <> '' then
      v_basis := btrim(v_item->>'quantity_basis');
      if v_basis not in ('total', 'per_acre', 'per_liter_water') then
        raise exception 'Invalid quantity_basis "%" for "%"', v_basis, v_item->>'fertilizer_name';
      end if;
    end if;
  end loop;
end;
$$;

-- ── 5. Extend the shared inserter ───────────────────────────────────────────

create or replace function public.insert_fertilizer_plan_items(p_plan_id uuid, p_items jsonb)
returns void
language plpgsql
as $$
declare
  v_item jsonb;
  v_idx int := 0;
  v_product_id bigint;
begin
  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    -- Resolve product_id defensively: accept only a JSON number that names an
    -- existing catalog product. A stale pick (product removed between select
    -- and send) degrades to null — the plan still lands with the name as
    -- fallback identity — instead of failing the consultant's whole send with
    -- an FK error.
    v_product_id := null;
    if jsonb_typeof(v_item->'product_id') = 'number' then
      select id into v_product_id
      from public.chemical_products
      where id = (v_item->>'product_id')::bigint;
    end if;

    insert into public.fertilizer_plan_items (
      plan_id, application_date, fertilizer_name, quantity, unit,
      application_method, application_frequency, notes, sort_order,
      product_id, quantity_basis
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
      v_idx,
      v_product_id,
      nullif(btrim(v_item->>'quantity_basis'), '')
    );
    v_idx := v_idx + 1;
  end loop;
end;
$$;
