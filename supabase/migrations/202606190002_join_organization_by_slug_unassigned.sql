-- Bring join_organization_by_slug under version control and make it consistent
-- with the "an Assignment must target an Agronomist" invariant
-- (202606190001_assignment_targets_agronomist + docs/adr/0001).
--
-- This RPC is the farmer-facing Self-join: a logged-in farmer enters an
-- Organization's Join code (slug) in the app and is linked as an active Client.
-- It previously lived ONLY in the live database (never in a migration) and set
-- assigned_to = the org owner. Under the new trigger that owner assignment is
-- rejected (an owner is not an agronomist), which would break every Self-join.
--
-- Fix: a Self-join lands the Client UNASSIGNED (assigned_to / assigned_by = null),
-- exactly like an owner/admin invite-accept. An Owner/Admin then makes the
-- Assignment from Team -> Assignments. Every other guard (staff-exclusion,
-- one-active-org, removed-farmer, idempotency, TOCTOU race handling) is preserved
-- verbatim from the live definition.

create or replace function public.join_organization_by_slug(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_org_id uuid;
  v_org_name text;
  v_existing_status text;
  v_row_count int;
begin
  -- Must be called by a logged-in user. auth.uid() reads the caller's JWT; null under anon.
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'status', 'unauthenticated');
  end if;

  -- Resolve the org by slug. Trim + lowercase for typing tolerance (slugs are stored
  -- lowercased already, but farmers mistype). Org must be active.
  select id, name into v_org_id, v_org_name
  from public.organizations
  where lower(slug) = lower(btrim(p_slug))
    and is_active = true
  limit 1;

  if v_org_id is null then
    return jsonb_build_object('ok', false, 'status', 'not_found');
  end if;

  -- Staff/client roles are mutually exclusive GLOBALLY, not per-org. A consultant who is a
  -- team member of ANY organization must not be inserted as another org's client: doing so
  -- would (a) mix their staff and client roles and (b) have the profile-mirror update below
  -- rewrite profiles.consultant_organization_id and sever their existing staff affiliation.
  if exists (
    select 1 from public.organization_members
    where user_id = auth.uid()
  ) then
    return jsonb_build_object('ok', false, 'status', 'is_staff');
  end if;

  -- Is there already a client row for this farmer in THIS org (any status)?
  select status into v_existing_status
  from public.organization_clients
  where organization_id = v_org_id and client_user_id = auth.uid()
  limit 1;

  -- Already an active client -> idempotent success (re-typing the code is a no-op).
  -- Keep the profile mirror in sync in case it drifted.
  if v_existing_status = 'active' then
    update public.profiles set consultant_organization_id = v_org_id where id = auth.uid();
    return jsonb_build_object(
      'ok', true, 'status', 'already_joined',
      'organization_name', v_org_name, 'organization_id', v_org_id
    );
  end if;

  -- A deliberately-removed client must not reactivate themselves with the shared code.
  -- Re-admitting a removed farmer is the consultant's decision, not the farmer's.
  if v_existing_status = 'inactive' then
    return jsonb_build_object('ok', false, 'status', 'removed');
  end if;

  -- A farmer can be an active client of only ONE org at a time. The partial unique index
  -- idx_organization_clients_one_active_per_client enforces this at insert time; this check
  -- gives a clean, specific message instead of a raw constraint violation.
  if exists (
    select 1 from public.organization_clients
    where client_user_id = auth.uid()
      and status = 'active'
      and organization_id <> v_org_id
  ) then
    return jsonb_build_object('ok', false, 'status', 'already_in_other_org');
  end if;

  -- Insert a fresh active client, or reactivate a pre-existing 'pending' row for this org.
  -- A Self-join lands UNASSIGNED: assigned_to / assigned_by are null so the farmer shows as
  -- "Unassigned" in the directory and an Owner/Admin assigns an agronomist deliberately. This
  -- keeps the row valid under trg_assignment_targets_agronomist (null is always allowed).
  --
  -- Race hardening (review M2/M3):
  --  * The ON CONFLICT arm is guarded by `WHERE status <> 'inactive'` so an admin removal
  --    that lands between our pre-check and this write cannot be clobbered back to 'active'
  --    (TOCTOU on the removed-farmer path). If the guard rejects the update, no row is
  --    modified and we return 'removed'.
  --  * On reactivation we PRESERVE any existing assignment (coalesce keeps a non-null
  --    assigned_to/assigned_by that an admin set earlier — already agronomist-valid).
  --  * The whole write is wrapped in a unique_violation sub-block: a concurrent join / admin
  --    add that creates an active client row in ANOTHER org between our pre-check and this
  --    insert would otherwise throw raw SQLSTATE 23505 to the client; we translate it to a
  --    clean 'already_in_other_org' status instead of a 500.
  begin
    insert into public.organization_clients
      (organization_id, client_user_id, assigned_to, assigned_by, status)
    values
      (v_org_id, auth.uid(), null, null, 'active')
    on conflict (organization_id, client_user_id) do update
      set status = 'active',
          assigned_to = coalesce(public.organization_clients.assigned_to, excluded.assigned_to),
          assigned_by = coalesce(public.organization_clients.assigned_by, excluded.assigned_by),
          updated_at = now()
      where public.organization_clients.status <> 'inactive';

    -- 0 rows affected means the ON CONFLICT guard rejected a reactivation of an 'inactive'
    -- row that a concurrent admin removal created between our read and write.
    get diagnostics v_row_count = row_count;
    if v_row_count = 0 then
      return jsonb_build_object('ok', false, 'status', 'removed');
    end if;
  exception
    when unique_violation then
      -- idx_organization_clients_one_active_per_client fired: a concurrent transaction
      -- made this farmer an active client of another org between our pre-check and here.
      return jsonb_build_object('ok', false, 'status', 'already_in_other_org');
  end;

  -- Sync the legacy profiles.consultant_organization_id mirror that older screens read.
  update public.profiles
  set consultant_organization_id = v_org_id
  where id = auth.uid();

  return jsonb_build_object(
    'ok', true, 'status', 'joined',
    'organization_name', v_org_name, 'organization_id', v_org_id
  );
end;
$function$;

-- Farmer-callable RPC: authenticated only (the function gates further on auth.uid()).
revoke all on function public.join_organization_by_slug(text) from public, anon;
grant execute on function public.join_organization_by_slug(text) to authenticated;
