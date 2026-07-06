-- Label-source document family: the stable key supersession is scoped to.
--
-- Supersession must survive per-revision filename changes ("… 17.09.2025.pdf"
-- vs "… rev 03.11.2025.pdf") but must NOT cross documents: Annexure-5 (label
-- claims) and Annexure-9 (monitored residues) share source_type, issuing body,
-- and crop, and importing one must never effective-date the other. Neither the
-- filename nor (type, body, crop) can express that — hence an explicit family
-- slug (e.g. 'annexure-5-grapes'), provided by each import.
--
-- Nullable by design: a row without a family is simply never matched by
-- family-scoped supersession (fail-closed — nothing gets superseded by
-- accident). The claims importer always writes it.

alter table public.chemical_label_sources
  add column if not exists document_family text;

comment on column public.chemical_label_sources.document_family is
  'Stable document-family slug (e.g. annexure-5-grapes). Supersession closes prior revisions within one family only; null rows are never auto-superseded.';

create index if not exists chemical_label_sources_family_idx
  on public.chemical_label_sources (lower(document_family), revision_date)
  where document_family is not null;
