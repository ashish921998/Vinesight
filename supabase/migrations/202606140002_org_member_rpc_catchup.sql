-- Catch-up migration for environments that applied an earlier version of
-- 202606140001_accept_invite_rpc.sql before it gained the single-org guard, the
-- remove_organization_member RPC, and the redundant-index drop.
--
-- Migration runners never re-run an already-applied file, so editing 202606140001
-- in place left those databases stale. Every statement below is idempotent
-- (drop ... if exists / create or replace), so applying this is safe whether the
-- objects already exist in their final form or not. Fresh environments that run
-- 202606140001 first will simply re-create the identical definitions here.

-- 1. Redundant token index: the UNIQUE constraint on
--    organization_member_invitations.token already provides an equivalent index.
drop index if exists public.idx_org_member_invitations_token;

-- 2. accept_organization_invite — final form, including the single-org-per-user
--    guard (0b) that refuses to overwrite a differing consultant_organization_id.
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

  -- 0b. Single-org-per-user invariant. The invite-member route already blocks
  --     inviting a user who belongs to another org, but a stale invite created
  --     before the user joined elsewhere could still reach here. Refuse rather
  --     than silently overwriting consultant_organization_id and severing the
  --     user's existing affiliation. Accepting your own current org is fine.
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

-- 3. remove_organization_member — atomic unassign + delete + profile reset.
create or replace function public.remove_organization_member(
  p_organization_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 1. Unassign any farmers currently assigned to this member.
  update organization_clients
  set assigned_to = null,
      assigned_by = null,
      assigned_at = null
  where organization_id = p_organization_id
    and assigned_to = p_user_id;

  -- 2. Delete the membership row.
  delete from organization_members
  where organization_id = p_organization_id
    and user_id = p_user_id;

  -- 3. Reset the removed user's profile (single-org model).
  update profiles
  set user_type = null,
      consultant_organization_id = null
  where id = p_user_id;
end;
$$;

revoke all on function public.remove_organization_member(uuid, uuid) from public;
revoke all on function public.remove_organization_member(uuid, uuid) from authenticated;
