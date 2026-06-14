-- Authoritative "is this phone already taken?" check for the consultant invite-create flow.
--
-- Context: create() (src/app/api/invite/create/route.ts) wants to refuse inviting a number that
-- already belongs to an account. The phone for any phone-login account lives in auth.users.phone,
-- but app code — even with the service role — can't read the auth schema over PostgREST. This
-- SECURITY DEFINER function does the lookup on its behalf.
--
-- Returns true when the number is in use, checking both:
--   * auth.users.phone — every phone-login account. Stored as digits without a leading '+',
--     so we strip non-digits from the supplied E.164 before comparing.
--   * public.profiles.phone — E.164 with '+', matched as-is (covers legacy/backfilled rows whose
--     auth user has no phone identity).
--
-- Limitation: an email-only account records no phone anywhere, so its owner's number is not
-- detectable here. The invite-accept route's organization_members guard is the backstop.

create or replace function public.phone_in_use(p_e164 text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from auth.users
    where phone = regexp_replace(coalesce(p_e164, ''), '\D', '', 'g')
  ) or exists (
    select 1 from public.profiles
    where phone = p_e164
  );
$$;

-- A boolean phone-existence check is a privacy-sensitive oracle — keep it off client roles and
-- expose it only to the service role used by the invite-create endpoint.
revoke all on function public.phone_in_use(text) from public, anon, authenticated;
grant execute on function public.phone_in_use(text) to service_role;
