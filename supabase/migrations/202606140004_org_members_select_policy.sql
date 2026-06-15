-- Fix: org owners/admins (and members) could not see other members of their
-- organization. The organization_members SELECT policy restricted visible rows
-- to the caller's own membership (effectively user_id = auth.uid()), so the team
-- page member list only ever showed the current user, the member count was wrong
-- ("1 member" when there were more), and a newly accepted member never appeared
-- -- which also meant the admin's "Remove" control never rendered for anyone.
--
-- The correct scope is "any row in an organization the caller belongs to". That
-- cannot be expressed by sub-querying organization_members inside its own policy:
-- the inner read re-triggers the same policy and Postgres raises
-- "infinite recursion detected in policy for relation organization_members".
-- The is_org_member() helper added in 202606040001 sidesteps this -- it is
-- SECURITY DEFINER, so its internal membership lookup runs as the definer
-- (bypassing RLS) and breaks the recursion cycle.
--
-- Idempotent: drop-if-exists then create, so this is safe to re-run and to apply
-- to databases whose existing policy used any prior definition under this name.

drop policy if exists "Members can view organization members" on public.organization_members;

create policy "Members can view organization members"
on public.organization_members
for select
to authenticated
using ( public.is_org_member(organization_id) );
