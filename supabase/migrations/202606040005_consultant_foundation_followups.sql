-- Forward migration for two deltas that were briefly staged as in-place edits to the
-- already-deployed 202606040001 and 202606040003. Applied migrations never re-run, so those
-- edits were reverted and re-issued here as a new step. This keeps a live database (which has
-- 0001-0003 applied) and a fresh install converging to the same end state. Both statements are
-- idempotent, so a fresh DB (where 0001/0003 already produce the pre-edit shapes) applies them
-- harmlessly.

-- 1. (from 0001) Drop the redundant composite index on organization_clients. The
--    UNIQUE(organization_id, client_user_id) table constraint already provides a unique btree
--    index on exactly these columns -- and that constraint is what backs the invite-accept
--    upsert's ON CONFLICT -- so this non-unique duplicate is dead weight.
drop index if exists public.idx_organization_clients_org_client;

-- 2. (from 0003) Add petiole_test_id to the petiole_triage scope-immutability guard so the test
--    a triage row points at cannot be swapped after creation. Replacing the function body is
--    sufficient: the existing prevent_petiole_triage_scope_mutation_trigger calls it by name.
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
