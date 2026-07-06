-- Manual SQL assertions for Unit 1 grape label-claim schema.
-- Intended for a local database after applying:
--   the phi_catalog migration (applied in prod)
--   supabase/migrations/202607060002_grape_label_claims.sql

begin;

insert into public.chemical_products (
  name,
  active_ingredient,
  input_type,
  verification_tier,
  formulation,
  source_reference
)
values (
  'Unit Test Amisulbrom 17.7 SC',
  'Amisulbrom',
  'spray',
  'verified',
  '17.7 SC',
  'unit-test'
)
returning id
\gset product_

insert into public.chemical_label_sources (
  source_type,
  issuing_body,
  source_document,
  source_title,
  crop,
  revision_date,
  effective_from,
  edition_defaults,
  review_status
)
values (
  'annexure',
  'ICAR-NRCG',
  'Annexure 5 Grapes-2025-26 17.09.2025.pdf',
  'Annexure 5 Grapes 2025-26',
  'grape',
  date '2025-09-17',
  date '2025-09-17',
  '{"max_applications_per_season":2,"min_application_interval_days":7,"max_application_interval_days":15}'::jsonb,
  'verified'
)
returning id
\gset source_

insert into public.chemical_label_claims (
  source_id,
  product_id,
  crop,
  source_page,
  source_serial,
  formulation_name,
  active_ingredient,
  target_problem,
  dose_value,
  dose_unit,
  dose_basis,
  phi_min_days,
  phi_max_days,
  systemic_class,
  max_applications_per_season,
  min_application_interval_days,
  max_application_interval_days,
  review_status,
  effective_from
)
values (
  :source_id,
  :product_id,
  'grape',
  5,
  'UT-1',
  'Amisulbrom 17.7 SC',
  'Amisulbrom',
  'downy mildew',
  0.5,
  'ml/L',
  'per_liter_water',
  30,
  30,
  'QiI fungicide',
  2,
  7,
  15,
  'verified',
  date '2025-09-17'
)
returning id
\gset claim_

insert into public.chemical_label_claim_mrls (
  claim_id,
  market,
  residue_name,
  mrl_value,
  mrl_unit,
  source_note
)
values
  (:claim_id, 'EU', 'amisulbrom', 0.50, 'mg/kg', 'unit-test'),
  (:claim_id, 'India', 'amisulbrom', 0.50, 'mg/kg', 'unit-test');

insert into public.chemical_mixes (
  name,
  target_problem,
  application_mode,
  source_page,
  source_document,
  crop
)
values (
  'Unit Test Amisulbrom',
  'downy mildew',
  'preventive',
  5,
  'unit-test',
  'grape'
)
returning id
\gset mix_

insert into public.chemical_mix_components (
  mix_id,
  product_id,
  sequence_no,
  dose_value,
  dose_unit,
  dose_basis,
  label_claim_id
)
values (
  :mix_id,
  :product_id,
  1,
  0.5,
  'ml',
  'per_liter',
  :claim_id
);

insert into public.chemical_mixes (
  name,
  target_problem,
  application_mode,
  source_page,
  source_document,
  crop
)
values (
  'Unit Test Legacy Component',
  'anthracnose',
  'preventive',
  8,
  'unit-test',
  'grape'
)
returning id
\gset legacy_mix_

insert into public.chemical_mix_components (
  mix_id,
  product_id,
  sequence_no,
  dose_value,
  dose_unit,
  dose_basis
)
values (
  :legacy_mix_id,
  :product_id,
  1,
  0.5,
  'ml',
  'per_liter'
);

do $$
begin
  if (
    select count(*)
    from public.chemical_label_claims claims
    join public.chemical_label_sources sources on sources.id = claims.source_id
    join public.chemical_label_claim_mrls mrls on mrls.claim_id = claims.id
    join public.chemical_mix_components components on components.label_claim_id = claims.id
    where claims.source_serial = 'UT-1'
      and sources.revision_date = date '2025-09-17'
  ) <> 2 then
    raise exception 'expected complete provenance chain with two MRL rows';
  end if;
end $$;

insert into public.chemical_mixes (
  name,
  target_problem,
  application_mode,
  source_page,
  source_document,
  crop
)
values
  ('Unit Test Same Formulation', 'downy mildew', 'preventive', 6, 'unit-test', 'grape'),
  ('Unit Test Same Formulation', 'powdery mildew', 'preventive', 7, 'unit-test', 'grape');

-- psql variables do not interpolate inside dollar-quoted do-blocks; hand the
-- ids to plpgsql through session settings instead.
select set_config('test.legacy_mix_id', :'legacy_mix_id', false);
select set_config('test.claim_id', :'claim_id', false);
select set_config('test.product_id', :'product_id', false);
select set_config('test.source_id', :'source_id', false);

-- Scoped to the specific legacy row inserted above — an unscoped "any row
-- with a null claim link" would pass trivially on any real database.
do $$
begin
  if not exists (
    select 1
    from public.chemical_mix_components
    where mix_id = current_setting('test.legacy_mix_id')::bigint
      and label_claim_id is null
  ) then
    raise exception 'expected legacy component without claim link to remain valid';
  end if;
end $$;

-- Superseding a claim must not touch mix components that reference it.
update public.chemical_label_claims
set review_status = 'superseded',
    is_active = false,
    effective_to = date '2025-11-02'
where id = :claim_id;

do $$
begin
  if not exists (
    select 1
    from public.chemical_mix_components
    where label_claim_id = current_setting('test.claim_id')::bigint
  ) then
    raise exception 'expected superseded claim to keep its mix-component link';
  end if;
end $$;

-- A mix component may only link a claim that belongs to its own product:
-- a claim for a DIFFERENT product must be a foreign-key violation.
do $$
declare
  other_product_id bigint;
  other_claim_id bigint;
begin
  insert into public.chemical_products (
    name, active_ingredient, input_type, verification_tier, formulation, source_reference
  )
  values (
    'Unit Test Other Product 10 SC', 'Other AI', 'spray', 'verified', '10 SC', 'unit-test'
  )
  returning id into other_product_id;

  insert into public.chemical_label_claims (
    source_id, product_id, source_serial, formulation_name, target_problem,
    dose_value, dose_unit, dose_basis, phi_note, review_status
  )
  values (
    current_setting('test.source_id')::bigint, other_product_id, 'UT-OTHER',
    'Other Product 10 SC', 'downy mildew', 1, 'ml/L', 'per_liter_water',
    'unit-test', 'verified'
  )
  returning id into other_claim_id;

  begin
    insert into public.chemical_mix_components (
      mix_id, product_id, sequence_no, dose_value, dose_unit, dose_basis, label_claim_id
    )
    values (
      current_setting('test.legacy_mix_id')::bigint,
      current_setting('test.product_id')::bigint,
      2, 0.5, 'ml', 'per_liter',
      other_claim_id
    );
    raise exception 'cross-product claim link unexpectedly succeeded';
  exception
    when foreign_key_violation then
      null;
  end;
end $$;

do $$
declare
  test_source_id bigint := (
    select id
    from public.chemical_label_sources
    where source_document = 'Annexure 5 Grapes-2025-26 17.09.2025.pdf'
      and revision_date = date '2025-09-17'
    limit 1
  );
  test_product_id bigint := (
    select id
    from public.chemical_products
    where name = 'Unit Test Amisulbrom 17.7 SC'
    limit 1
  );
  test_claim_id bigint := (
    select id
    from public.chemical_label_claims
    where source_serial = 'UT-1'
    limit 1
  );
begin
  begin
    insert into public.chemical_label_claim_mrls (
      claim_id,
      market,
      residue_name,
      mrl_value
    )
    values (test_claim_id, 'EU-negative', 'amisulbrom', -0.01);
    raise exception 'negative MRL insert unexpectedly succeeded';
  exception
    when check_violation then
      null;
  end;

  -- One violated constraint per negative insert: a row violating several
  -- checks at once only proves whichever check fires first, leaving the
  -- others untested.
  begin
    insert into public.chemical_label_claims (
      source_id, product_id, source_serial, formulation_name, target_problem,
      dose_value, dose_unit, dose_basis, phi_note,
      min_application_interval_days, max_application_interval_days,
      review_status, effective_from
    )
    values (
      test_source_id, test_product_id, 'UT-BAD-INTERVAL', 'Bad Claim', 'downy mildew',
      1, 'ml/L', 'per_liter_water', 'unit-test',
      15, 7,
      'verified', date '2025-09-17'
    );
    raise exception 'reversed application-interval insert unexpectedly succeeded';
  exception
    when check_violation then
      null;
  end;

  begin
    insert into public.chemical_label_claims (
      source_id, product_id, source_serial, formulation_name, target_problem,
      dose_value, dose_unit, dose_basis, phi_note,
      review_status, effective_from, effective_to
    )
    values (
      test_source_id, test_product_id, 'UT-BAD-DATES', 'Bad Claim', 'downy mildew',
      1, 'ml/L', 'per_liter_water', 'unit-test',
      'verified', date '2025-11-02', date '2025-09-17'
    );
    raise exception 'reversed effective-date insert unexpectedly succeeded';
  exception
    when check_violation then
      null;
  end;

  begin
    insert into public.chemical_label_claims (
      source_id, product_id, source_serial, formulation_name, target_problem,
      dose_value, dose_unit, dose_basis, phi_note,
      phi_min_days, phi_max_days,
      review_status, effective_from
    )
    values (
      test_source_id, test_product_id, 'UT-BAD-PHI', 'Bad Claim', 'downy mildew',
      1, 'ml/L', 'per_liter_water', 'unit-test',
      10, 5,
      'verified', date '2025-09-17'
    );
    raise exception 'reversed PHI range insert unexpectedly succeeded';
  exception
    when check_violation then
      null;
  end;

  -- MRL exemption XOR value: both set is invalid, neither set is invalid.
  begin
    insert into public.chemical_label_claim_mrls (
      claim_id, market, residue_name, mrl_value, no_mrl_required
    )
    values (test_claim_id, 'EU-both', 'amisulbrom', 0.5, true);
    raise exception 'MRL with both value and exemption unexpectedly succeeded';
  exception
    when check_violation then
      null;
  end;

  begin
    insert into public.chemical_label_claim_mrls (
      claim_id, market, residue_name, mrl_value, no_mrl_required
    )
    values (test_claim_id, 'EU-neither', 'amisulbrom', null, false);
    raise exception 'MRL with neither value nor exemption unexpectedly succeeded';
  exception
    when check_violation then
      null;
  end;

  begin
    insert into public.chemical_label_claims (
      source_id,
      product_id,
      source_serial,
      formulation_name,
      target_problem,
      dose_value,
      dose_unit,
      dose_basis,
      review_status
    )
    values (
      test_source_id,
      -1,
      'UT-MISSING-PRODUCT',
      'Missing Product',
      'downy mildew',
      1,
      'ml/L',
      'per_liter_water',
      'pending_review'
    );
    raise exception 'missing product claim link unexpectedly succeeded';
  exception
    when foreign_key_violation then
      null;
  end;
end $$;

rollback;
