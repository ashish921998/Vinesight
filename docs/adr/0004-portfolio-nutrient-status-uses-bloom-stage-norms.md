---
status: accepted
---

# Portfolio nutrient status is judged against bloom-stage norms

## Context

The Command Center's **Nutrient status across farms** chart rolls up each Farm's latest petiole
test into per-nutrient counts of **Deficient / Optimal / Excess** (the diverging scale). To
classify a value it needs target ranges.

The only petiole reference ranges in the codebase are `PETIOLE_RANGES` in
`farm-config.ts`, and their own comment states they "match the bloom-stage standards on the lab
petiole analysis report." Petiole nutrient norms genuinely shift with phenological stage, and
Farms are sampled at different stages. The single-Farm `PetioleComparison` table already uses
these bloom-stage ranges — acceptable there because the Agronomist is reading one report and
knows its stage. Aggregating many Farms (sampled at different stages) into one headline bar
amplifies that imprecision and hides it behind a confident-looking chart.

## Decision

For v1, reuse the existing bloom-stage `PETIOLE_RANGES` (single-sourced from `farm-config.ts`),
include each Farm's **most recent** petiole test, and **label the chart honestly**: the title
says "latest petiole test per farm" and a footnote states the values are judged against
bloom-stage norms and that Farms sampled at other stages are an approximation. Per DESIGN.md the
buckets are always shown with text labels, never color alone.

## Considered options

- **Make it stage-aware now** — rejected: no stage-specific norm data exists in the schema; it is
  a meaningful agronomy-modelling effort, out of scope for a first dashboard.
- **Restrict the aggregate to Farms sampled in a bloom window** (computed from
  `date_of_pruning` → sample date) — rejected: excludes off-window Farms, shrinking N on a
  brand-new product where data is already sparse and an empty/thin chart is the worse failure.
- **Drop the chart from v1** — rejected: it is the most distinctly-VineSight visual and is still
  directionally useful for spotting portfolio-wide deficiencies.

## Consequences

- The chart is **directional, not clinical**. The footnote and the Deficient/Optimal/Excess text
  labels keep that honest; it should not be read as a per-Farm verdict.
- When stage-aware norms arrive, the change is localized: swap `CANONICAL_PETIOLE_RANGES` in
  `consultant-dashboard-metrics.ts` for a stage-indexed lookup keyed on days-after-pruning, and
  `nutrientStatusAcrossFarms` + the chart pick it up unchanged.
- DB `petiole_test_records.parameters` is stored with **canonical** keys, but `PETIOLE_RANGES`
  uses the British `sulphur` while canonicalization emits `sulfur`. The metric layer applies a
  one-key `sulphur → sulfur` alias so sulfur resolves to a range; revisit if the source ranges
  are ever canonicalized.
