-- Atomic RPC for accepting organization member invitations.
-- Wraps membership insert, profile update, and invitation status change
-- in a single transaction to prevent inconsistent state.

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
  v_full_name text;
begin
  -- 0. Defense in depth: never let a malformed invite grant an unexpected role.
  --    The invite table CHECK already constrains this, but the RPC is the last
  --    gate before a membership row is written.
  if p_role not in ('admin', 'agronomist') then
    raise exception 'invalid role: %', p_role;
  end if;

  -- 1. Insert membership only if not already a member.
  --    ON CONFLICT DO NOTHING prevents overwriting an existing role/is_owner,
  --    which would let a stale invite demote an owner or admin.
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

  -- 3. Mark invitation as accepted. Guard on status = 'pending' so two
  --    concurrent acceptances (a double-fired effect or two open tabs) can't
  --    both transition the row; only the first wins.
  update organization_member_invitations
  set status = 'accepted',
      accepted_at = now(),
      accepted_user_id = p_user_id
  where id = p_invite_id
    and status = 'pending';
end;
$$;

-- Only the service role (via API routes) should call this function.
revoke all on function public.accept_organization_invite(uuid, uuid, uuid, text, text, text) from public;
revoke all on function public.accept_organization_invite(uuid, uuid, uuid, text, text, text) from authenticated;
