-- Catch-up migration: propagate the "profile row must exist" guard to databases
-- that already applied 202606140002 (and so will never re-run it).
--
-- Earlier versions of accept_organization_invite updated profiles with no check
-- on the affected row count: a missing profile row (e.g. the auth.users ->
-- profiles trigger never fired) left the UPDATE a silent no-op while membership
-- and invite were still committed, producing a membership row with no profile
-- org linkage. This re-applies the function with an `if not found` guard so that
-- case rolls the whole transaction back. Idempotent (create or replace); fresh
-- environments that ran 202606140001/2 first simply re-create the same body.

create or replace function public.accept_organization_invite(
  p_user_id uuid,
  p_invite_id uuid,
  p_organization_id uuid,
  p_role text,
  p_first_name text,
  p_last_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_name text;
  v_existing_org uuid;
  v_full_name text;
begin
  -- 0. Defense in depth: never let a malformed invite grant an unexpected role.
  if p_role not in ('admin', 'agronomist') then
    raise exception 'invalid role: %', p_role;
  end if;

  -- 0b. Single-org-per-user invariant. Refuse rather than silently overwriting
  --     consultant_organization_id and severing the user's existing affiliation.
  --     Accepting your own current org is fine.
  select consultant_organization_id into v_existing_org
  from profiles
  where id = p_user_id;

  if v_existing_org is not null and v_existing_org <> p_organization_id then
    raise exception 'user already belongs to another organization';
  end if;

  -- 1. Insert membership only if not already a member.
  insert into organization_members (organization_id, user_id, role, is_owner)
  values (p_organization_id, p_user_id, p_role, false)
  on conflict (organization_id, user_id) do nothing;

  -- 2. Update the user's profile: set user_type and org linkage.
  --    Set full_name only if the current value is null or empty.
  select full_name into v_existing_name
  from profiles
  where id = p_user_id;

  v_full_name := trim(both from (coalesce(p_first_name, '') || ' ' || coalesce(p_last_name, '')));

  if v_existing_name is null or v_existing_name = '' then
    update profiles
    set user_type = 'org_member',
        consultant_organization_id = p_organization_id,
        full_name = nullif(v_full_name, '')
    where id = p_user_id;
  else
    update profiles
    set user_type = 'org_member',
        consultant_organization_id = p_organization_id
    where id = p_user_id;
  end if;

  -- 2b. Fail loudly if no profile row matched, so the transaction rolls back
  --     instead of leaving membership/invite updated with the profile linkage
  --     silently skipped.
  if not found then
    raise exception 'profile row not found for user %, cannot complete org membership', p_user_id;
  end if;

  -- 3. Mark invitation accepted, guarding on status = 'pending' so two
  --    concurrent acceptances can't both transition the row.
  update organization_member_invitations
  set status = 'accepted',
      accepted_at = now(),
      accepted_user_id = p_user_id
  where id = p_invite_id
    and status = 'pending';
end;
$$;

revoke all on function public.accept_organization_invite(uuid, uuid, uuid, text, text, text) from public;
revoke all on function public.accept_organization_invite(uuid, uuid, uuid, text, text, text) from authenticated;
