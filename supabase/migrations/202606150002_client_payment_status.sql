-- Per-client payment status on organization_clients, plus a SECURITY DEFINER RPC
-- to toggle it. A single boolean (paid / unpaid) is all the consultant UI needs.
--
-- The existing UPDATE policy on organization_clients is admin/owner only and is
-- intentionally left untouched (it guards assignment + status). Toggling payment
-- goes through set_client_payment_status(), which checks can_access_org_client()
-- so an assigned agronomist can mark their own farmers paid/unpaid while only
-- ever mutating the three payment columns.

alter table public.organization_clients
  add column if not exists is_paid boolean not null default false,
  add column if not exists paid_at timestamptz,
  add column if not exists paid_by uuid references auth.users(id) on delete set null;

create index if not exists idx_organization_clients_org_is_paid
  on public.organization_clients(organization_id, is_paid)
  where status = 'active';

create or replace function public.set_client_payment_status(
  p_client_id uuid,
  p_is_paid boolean
)
returns public.organization_clients
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.organization_clients;
  v_org uuid;
  v_client uuid;
begin
  select organization_id, client_user_id into v_org, v_client
  from public.organization_clients
  where id = p_client_id
    and status = 'active';

  if v_org is null then
    raise exception 'organization client % not found or inactive', p_client_id;
  end if;

  if not public.can_access_org_client(v_org, v_client) then
    raise exception 'not authorized to update payment status for this client';
  end if;

  update public.organization_clients
  set is_paid = p_is_paid,
      paid_at = case when p_is_paid then current_timestamp else null end,
      paid_by = case when p_is_paid then (select auth.uid()) else null end
  where id = p_client_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.set_client_payment_status(uuid, boolean) from public;
grant execute on function public.set_client_payment_status(uuid, boolean) to authenticated;
