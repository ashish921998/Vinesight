-- Organization branding: a logo + name the consultant controls, shown in the
-- workspace sidebar (the box that today renders a generic building glyph and
-- the hardcoded title "Organization Workspace").
--
-- Two pieces:
--   1. organizations.logo_url — public URL of the current logo, or null when
--      none is set (sidebar then falls back to the building glyph).
--   2. a PUBLIC "org-logos" storage bucket to hold the image. Writes happen
--      only through the service-role API route (/api/consultant/organization),
--      which gates on owner/admin, so the bucket needs no INSERT/UPDATE/DELETE
--      policy for end users. Public read mirrors how "farm-photos" works: the
--      bucket's public flag is what lets <img src> resolve without a signed URL.

alter table organizations
  add column if not exists logo_url text;

-- Idempotent: re-running keeps the bucket public without erroring.
insert into storage.buckets (id, name, public)
values ('org-logos', 'org-logos', true)
on conflict (id) do update set public = excluded.public;
