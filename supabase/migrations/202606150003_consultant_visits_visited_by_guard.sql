-- Security hardening: prevent user-initiated UPDATE from setting
-- consultant_visits.visited_by to NULL.
--
-- The original trigger (202606150001) blocked rewriting visited_by to another
-- member but still allowed setting it to NULL, because it only raised when
-- new.visited_by IS NOT NULL. Any authenticated user who could update a visit
-- row could erase audit authorship.
--
-- Fix: block ALL changes to visited_by from user-facing UPDATEs (depth = 1).
-- The FK ON DELETE SET NULL cascade from auth.users deletion fires this trigger
-- at depth > 1 (nested inside the DELETE), so we exempt nested calls to let
-- account deletion proceed.

create or replace function public.prevent_consultant_visits_scope_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (old.organization_id, old.client_user_id)
     is distinct from
     (new.organization_id, new.client_user_id) then
    raise exception 'consultant_visits scope columns (organization_id, client_user_id) are immutable after creation';
  end if;

  -- visited_by is fully immutable from user-facing UPDATEs (including setting it
  -- to NULL, which would erase audit authorship). The sole permitted change is
  -- the FK ON DELETE SET NULL cascade from auth.users deletion. That cascade
  -- fires this trigger at depth > 1 (nested inside the DELETE operation), so we
  -- exempt nested calls to let account deletion proceed.
  if old.visited_by is distinct from new.visited_by then
    if new.visited_by is not null or pg_trigger_depth() = 1 then
      raise exception 'consultant_visits.visited_by is immutable after creation';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_consultant_visits_scope_mutation() from public;
