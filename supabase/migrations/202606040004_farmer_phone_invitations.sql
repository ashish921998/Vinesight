-- Phone-based farmer invitations.
-- Extends farmer_invitations (canonical definition lives in supabase-schema.sql) with the
-- fields the consultant "invite by phone" flow needs:
--   phone       - the invited number in E.164 form, used to deliver the link + backfill profile
--   farmer_name - optional display name for personalisation and signup prefill
--   invited_by  - the org member who created the invite; the farmer is auto-assigned to them on accept
-- All columns are nullable so the existing email-based invite flow keeps working unchanged.

alter table public.farmer_invitations
  add column if not exists phone varchar(20),
  add column if not exists farmer_name varchar(255),
  add column if not exists invited_by uuid references auth.users(id) on delete set null;

create index if not exists idx_farmer_invitations_phone
  on public.farmer_invitations(phone);
create index if not exists idx_farmer_invitations_invited_by
  on public.farmer_invitations(invited_by);
