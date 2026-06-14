-- Aligns the farmer_invitations INSERT RLS policy with the confirmed product decision that any
-- active org member (owner/admin/agronomist) may create farmer invitations.
--
-- The invite-create route (src/app/api/invite/create/route.ts) enforces this with an explicit
-- membership existence check and writes via the service-role admin client, so RLS isn't the live
-- gate on that path. But the previous "Admins can insert invitations" policy was misleading: it
-- claimed owner/admin-only while the app allowed any member, giving a false sense of
-- defense-in-depth. This drops it and recreates the INSERT policy as member-wide so the policy
-- tells the truth and a future user-scoped caller isn't silently blocked.
--
-- UPDATE/DELETE stay owner/admin-only — canceling or removing invitations remains an admin action,
-- and the legitimate app flows (token claim, prior-invite revocation) write through the admin
-- client regardless.

DROP POLICY IF EXISTS "Admins can insert invitations" ON public.farmer_invitations;

CREATE POLICY "Members can insert invitations" ON public.farmer_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = farmer_invitations.organization_id
        AND om.user_id = auth.uid()
    )
  );
