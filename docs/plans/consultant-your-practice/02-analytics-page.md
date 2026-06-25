# PLAN 2 — Consultant Analytics page (ship AFTER Plan 1)

Design locked via /design-shotgun 2026-06-24. Mockup: `variant-G-analytics.html`. Design system: DESIGN.md "Agronomic Reads Bench". Companion: `PLAN-1-overview-your-practice.md` (ship first).

## Concept

A new nav destination for **org-wide trends** — a place the lead agronomist goes to _study_ the book of farms, explicitly NOT daily work (that's Overview + Petiole Review). It rehomes the charts pulled off the old Overview so they aren't deleted.

⚠ **Earns-its-keep check:** an analytics page only pays off if consultants actually open it. **Instrument with PostHog page views**; if it goes unused after launch, cut it. This is the "dumping ground" risk — keep it honest.

## Route & nav

- New route: `src/app/consultant/analytics/page.tsx`.
- Nav item in `src/app/consultant/layout.tsx` — `Analytics` (chart icon), placed between **Petiole Review** and **Team**. Add to the `navItems` array so the sidebar highlight + top-bar section label work (note the trailing-slash `activeNavItem` already handles matching).

## Contents (charts to MOVE here from the old Overview)

1. **Nutrient status across farms** (full bar) — `NutrientStatusChart` + `nutrientStatusAcrossFarms`. (Overview keeps only the compact rail version.)
2. **Incoming severity mix** — `IncomingSeverityChart`.
3. **Weekly review throughput** — `ReviewThroughputChart`.
4. **Review pipeline by status** — `ReviewPipelineChart`.
5. **Recommendation adherence** breakdown — followed / partial / not-followed (`get_org_followup_adherence` + `adherenceSummary`).

Layout (per mockup): nutrient-status full-width hero, then a 2×2 grid of the other four.

## Files

- New: `src/app/consultant/analytics/page.tsx` (compose the existing chart components; reuse `useConsultantQueries` hooks for triage items + the two RPCs).
- `src/app/consultant/layout.tsx` — add the `Analytics` nav item.
- Chart components already exist under `src/components/consultant/dashboard/` — **reuse as-is** (`NutrientStatusChart`, `IncomingSeverityChart`, `ReviewThroughputChart`, `ReviewPipelineChart`, `chart-theme.ts`). They were removed from the Overview's render in Plan 1; here they get their permanent home. Consider moving them to `src/components/consultant/analytics/` for clarity (optional).
- Access gating: reuse `useConsultantAccess` / `getConsultantAccessState` like other consultant pages.

## Backend

- Mostly **reuse** existing chart data sources (triage items, `get_org_latest_petiole`, `get_org_followup_adherence`).
- Optional v2 enrichments (also feed Plan 1's "not followed"/"worsening" reasons):
  - **Per-farmer adherence** — `get_org_followup_adherence` grouped by `client_user_id`, or a new RPC.
  - **Nutrient trajectory** — new RPC returning the two most-recent petiole tests per farm (improving/worsening).

## Decisions to confirm

- **Severity mix** — Analytics only, or ALSO a slim header stat on Petiole Review (it characterizes the queue)? Mockup puts it on Analytics; the Petiole Review stat is a nice-to-have.
- Whether to physically relocate the chart component files (`dashboard/` → `analytics/`) or leave them in place and just import.
- Add a date-range / season filter? (Defer to v2 unless asked — keep the first version a static snapshot.)
