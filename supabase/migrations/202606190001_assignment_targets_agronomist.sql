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
  -- Re-validate whenever the assignee OR the owning organization changes — either can
  -- break "assignee is an agronomist in THIS org" (e.g. moving the client to another org
  -- while keeping the old org's agronomist). Skip only when BOTH are unchanged, so a
  -- status/updated_at-only write, an unassign (assigned_to -> NULL), or the FK
  -- ON DELETE SET NULL cascade still costs no role lookup.
  if tg_op = 'UPDATE'
     and new.assigned_to is not distinct from old.assigned_to
     and new.organization_id is not distinct from old.organization_id then
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

-- One-time reconciliation, run before the trigger starts enforcing. Any assignment
-- that predates this invariant is reset to Unassigned so the table is already
-- compliant on deploy and the "Unassigned" signal the app relies on is trustworthy
-- from the first day. The known offender is the old out-of-band
-- join_organization_by_slug, which assigned every farmer Self-join to the org OWNER
-- (see ADR-0002 / 202606190002); that left a production client assigned to a
-- non-agronomist, which the trigger below would otherwise reject on the next write.
-- Only assigned_to is nulled: assigned_by records WHO enrolled the farmer (provenance),
-- not who advises them, and the trigger constrains only assigned_to.
update public.organization_clients oc
set assigned_to = null
where oc.assigned_to is not null
  and not exists (
    select 1
    from public.organization_members m
    where m.organization_id = oc.organization_id
      and m.user_id = oc.assigned_to
      and m.role = 'agronomist'
  );

drop trigger if exists trg_assignment_targets_agronomist on public.organization_clients;

create trigger trg_assignment_targets_agronomist
  before insert or update of assigned_to, organization_id on public.organization_clients
  for each row
  execute function public.assert_organization_client_assignee_is_agronomist();
