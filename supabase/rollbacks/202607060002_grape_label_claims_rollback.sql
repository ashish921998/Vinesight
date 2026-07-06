-- MANUAL ROLLBACK SCRIPT (do not place in supabase/migrations)
-- Reverts schema changes introduced by:
--   supabase/migrations/202607060002_grape_label_claims.sql
--
-- WARNING:
-- - This is destructive and may delete label-claim data written after the migration.
-- - Apply only if you are rolling back the corresponding app release as well.
-- - Review on staging first.
--
-- The script is re-runnable: every drop is guarded, and drops that target
-- possibly-absent tables are wrapped in existence checks so a partial prior
-- cleanup does not make the rollback itself fail.

begin;

-- ============================================================
-- Preflight: the narrow (crop, name) uniqueness cannot be restored if the
-- widened index was actually used — same crop+name with different
-- target_problem. Fail here, explicitly, with instructions, instead of an
-- opaque unique-violation halfway through.
-- ============================================================
do $$
begin
  if exists (
    select 1
    from public.chemical_mixes
    group by lower(crop), lower(name)
    having count(*) > 1
  ) then
    raise exception using message =
      'chemical_mixes has rows sharing crop+name (differing target_problem). '
      'The pre-migration unique index cannot be restored until these are '
      'merged or renamed. Resolve duplicates, then re-run this rollback.';
  end if;
end $$;

-- ============================================================
-- Drop indexes added to existing tables (safe if columns still exist)
-- ============================================================
drop index if exists public.chemical_mix_components_label_claim_idx;
drop index if exists public.chemical_mixes_crop_name_target_problem_unique;

-- ============================================================
-- Restore previous mix uniqueness
-- ============================================================
create unique index if not exists chemical_mixes_crop_name_unique
  on public.chemical_mixes (lower(crop), lower(name));

-- ============================================================
-- Drop constraints added to existing tables
-- ============================================================
alter table if exists public.chemical_mix_components
  drop constraint if exists chemical_mix_components_label_claim_fk;

-- ============================================================
-- Revert existing table extensions
-- ============================================================
alter table if exists public.chemical_mix_components
  drop column if exists label_claim_id;

-- ============================================================
-- Drop catalog RLS policies and triggers explicitly (clarity/idempotency).
-- DROP POLICY/TRIGGER IF EXISTS still errors when the TABLE is gone, so each
-- drop is guarded on the table's existence.
-- ============================================================
do $$
begin
  if to_regclass('public.chemical_label_claim_mrls') is not null then
    drop policy if exists "Allow authenticated read access" on public.chemical_label_claim_mrls;
  end if;
  if to_regclass('public.chemical_label_claims') is not null then
    drop policy if exists "Allow authenticated read access" on public.chemical_label_claims;
    drop trigger if exists handle_chemical_label_claims_updated_at on public.chemical_label_claims;
  end if;
  if to_regclass('public.chemical_label_sources') is not null then
    drop policy if exists "Allow authenticated read access" on public.chemical_label_sources;
    drop trigger if exists handle_chemical_label_sources_updated_at on public.chemical_label_sources;
  end if;
end $$;

-- ============================================================
-- Drop label-claim tables (dependencies handled by order/cascade)
-- ============================================================
drop table if exists public.chemical_label_claim_mrls cascade;
drop table if exists public.chemical_label_claims cascade;
drop table if exists public.chemical_label_sources cascade;

commit;
