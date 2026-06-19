-- Invariant: an Assignment must target an Agronomist.
--
-- organization_clients.assigned_to names the single member responsible for a
-- client (an enrolled farmer). Three write paths set it — the bulk assign API,
-- invite-accept, and add-client — and only the bulk assign API checked the
-- assignee's role. invite-accept in particular set assigned_to to whoever sent
-- the invite, so an owner/admin invite produced a client "assigned" to a
-- non-agronomist, making the Unassigned signal on the assignment screen
-- untrustworthy.
--
-- This trigger is the unbypassable source of truth: assigned_to may only ever be
-- NULL or a member holding the 'agronomist' role in the SAME organization. App
-- routes keep their own checks for friendly error messages; this backstops every
-- current and future path. See docs/adr/0001-assignment-targets-agronomist.md.

create or replace function public.assert_organization_client_assignee_is_agronomist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only validate when assigned_to is actually being set to a non-null value.
  -- An UPDATE that doesn't change assigned_to (or sets it to NULL, e.g. the
  -- unassign action or the FK ON DELETE SET NULL cascade) is always allowed.
  if tg_op = 'UPDATE' and new.assigned_to is not distinct from old.assigned_to then
    return new;
  end if;

  if new.assigned_to is not null and not exists (
    select 1
    from public.organization_members m
    where m.organization_id = new.organization_id
      and m.user_id = new.assigned_to
      and m.role = 'agronomist'
  ) then
    raise exception
      'assigned_to (%) must reference an agronomist member of organization %',
      new.assigned_to, new.organization_id
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke all on function public.assert_organization_client_assignee_is_agronomist() from public;

drop trigger if exists trg_assignment_targets_agronomist on public.organization_clients;

create trigger trg_assignment_targets_agronomist
  before insert or update of assigned_to on public.organization_clients
  for each row
  execute function public.assert_organization_client_assignee_is_agronomist();
