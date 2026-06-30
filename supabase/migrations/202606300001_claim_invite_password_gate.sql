-- The claim-invite endpoint (logged-out, link-only) sets a password on an invited account.
-- It must only ever touch an UNCLAIMED, passwordless invitee — never overwrite a real
-- credential (that would be account takeover via mere link possession).
--
-- `last_sign_in_at` was the wrong signal for "has a usable credential": opening the Supabase
-- invite *email* magic link signs the user in (sets last_sign_in_at) WITHOUT setting a
-- password, so the old gate stranded legitimately-passwordless invitees who had clicked the
-- email — they could neither claim (blocked) nor sign in (no password). The correct signal is
-- whether the account actually has an encrypted_password.
--
-- auth.users is not exposed via PostgREST, so expose a minimal SECURITY DEFINER reader that
-- returns only a boolean and is callable only by the service role (used by the server-side
-- claim-invite route).
create or replace function public.claim_invite_account_has_password(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select coalesce(u.encrypted_password, '') <> ''
  from auth.users u
  where u.id = p_user_id;
$$;

revoke all on function public.claim_invite_account_has_password(uuid) from public;
revoke all on function public.claim_invite_account_has_password(uuid) from anon;
revoke all on function public.claim_invite_account_has_password(uuid) from authenticated;
grant execute on function public.claim_invite_account_has_password(uuid) to service_role;
