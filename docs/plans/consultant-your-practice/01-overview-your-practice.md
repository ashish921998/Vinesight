# PLAN 1 — Consultant Overview → "Your Practice" (ship FIRST)

Design locked via /design-shotgun 2026-06-24. Mockup: `variant-F-practice.html`. Design system: DESIGN.md "Agronomic Reads Bench". Companion: `PLAN-2-analytics-page.md` (follow-up).

## Concept

Overview = the consultant's **proactive daily panel** — complements (does not duplicate) Petiole Review's reactive queue. Surfaces what the queue is structurally blind to: farmers gone quiet, loose ends. Validated by a real agronomist (nudging farmers to sample is part of the job; consultant enters petiole reports on the farmer's behalf, so the loop self-closes when a new sample is recorded).

## Layout (top → bottom)

1. **Page head** — "Overview", role badge. No Invite button (moves to Farmers page — separate small task).
2. **Impression band "What needs attention"** — 3–4 generated findings: severity dot + plain sentence + bold mono number + action link. Urgent first; one positive.
3. **Two-column:**
   - Left (hero): **"Farmers to contact"** — derived-state call list.
   - Right rail: **Review queue** pointer card · **Your practice** snapshot · **Portfolio nutrients** compact bar.

## "Farmers to contact" — derived state, no contact logging

| Reason                   | Source (today's data)                                                                  | CTA                           | Behavior                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------- |
| Quiet 30d+               | `get_org_latest_petiole.sample_date` < today−30d                                       | **View farmer →**             | navigate to farmer page (call is off-platform; row auto-clears when a new sample is recorded) |
| Reviewed · no plan       | `petiole_triage` status `reviewed`/`resolved`, no `fertilizer_plans.petiole_triage_id` | **Issue plan →**              | navigate to plan builder for that triage                                                      |
| Plan not followed _(v2)_ | per-farmer adherence (needs RPC)                                                       | **Log a visit →**             | existing `consultant_visits` flow                                                             |
| Worsening _(v2)_         | nutrient trajectory (needs RPC)                                                        | **Re-assess / Log a visit →** | as above                                                                                      |

Sort by urgency (quiet-days desc → no-plan → v2 reasons). Cap ~10 rows + "See all N flagged farmers →".

## Impression band findings (v1, all from today's data)

- `N reports awaiting review — oldest waited X days.` → Petiole Review (`openReviewCount` + max age via `createdAt`)
- `N farmers haven't sampled in 30+ days.` → scrolls/filters the call list (gone-quiet count)
- `N reviewed reports have no plan attached.` → filters call list (reviewed-no-plan count)
- `Adherence is X%.` → Analytics/follow-ups (`get_org_followup_adherence`; the up/down delta is v2 — needs a time-windowed RPC, else show flat %)

## Right rail

- **Review queue card** — open count (`openReviewCount`) + oldest age + link to `/consultant/triage`.
- **Your practice snapshot** — active farmers, # with active deficiency (from `nutrientStatusAcrossFarms`), # quiet, adherence %.
- **Portfolio nutrients bar** — reuse `nutrientStatusAcrossFarms` data, compact bar form.

## Finding-generation rules (make-or-break — specify deliberately)

- Quiet threshold = 30 days, named constant `QUIET_SAMPLE_DAYS` (tunable).
- Reviewed-no-plan: only status `reviewed`/`resolved` with `recommendation` set and no plan row.
- Suppress any finding whose count is 0.
- Empty state: nothing flagged + queue empty → calm "All caught up", not a blank page.

## Backend — CLIENT-SIDE, NO NEW RPC (eng-review decision 2026-06-24, reversed from an RPC plan)

- **Reuse:** `get_org_latest_petiole`, `get_org_followup_adherence`, `useTriageItems`, `nutrientStatusAcrossFarms`, `openReviewCount`, `adherenceSummary`, `useFarmerClients` (FarmerWithFarms → name/village/assignment).
- **Un-drop `sample_date` (the only data-layer change):** `getOrgLatestPetiole` (`consultant-dashboard-service.ts:52-55`) maps the RPC row to `{farmId, parameters}` and **discards `sample_date`** even though the RPC returns it (migration:51). Add `sampleDate` to `FarmPetioleSnapshot` + the mapper. ~2 lines.
- **Gone-quiet:** client derivation — `today − sampleDate > QUIET_SAMPLE_DAYS` (30, named constant in metrics.ts). Join `farm_id → farmer name/village` from `useFarmerClients` in memory. ⚠ Two gaps to comment in code: (1) farms NEVER sampled aren't returned by the RPC — v1 = "sampled before, now silent" only; (2) `sample_date` is farmer/lab-entered and can be **backdated** → false "quiet" on a freshly-entered old report. If it bites, key the threshold off `created_at` (system-entry time) instead.
- **Reviewed-but-no-plan:** client filter on `useTriageItems` — status **`reviewed` OR `escalated`** (NOT `resolved`, which is deliberately closed) with no linked `fertilizer_plans.petiole_triage_id`. Plans aren't fetched org-wide today; fetch once org-scoped and diff in memory. No new RPC.
- **Instrument Plan 1 (eng-review add):** PostHog events on the call-list CTAs (`view_farmer`, `issue_plan`) + impression-band finding clicks. Instrument the daily driver, not only Plan 2.
- **Grain:** call-list rows are **per-farm** (a multi-farm farmer appears once per flagged farm), labelled "Farmer — village" — so `has_plan`/`last_sample` aren't lossily projected to farmer level.

## Files

- `src/components/consultant/dashboard/CommandCenterDashboard.tsx` — rewrite to new layout; **remove** `TeamWorkloadPanel`, `ReviewThroughputChart`, `ReviewPipelineChart` from render (components themselves move in Plan 2).
- New: `ImpressionBand.tsx`, `FarmersToContact.tsx`, `QueuePointerCard.tsx`, `PracticeSnapshot.tsx`.
- `src/lib/consultant-dashboard-metrics.ts` — add `goneQuietFarmers()`, `reviewedNoPlan()`, finding-builder helpers; keep `nutrientStatusAcrossFarms`, `adherenceSummary`, `openReviewCount`.
- `src/hooks/consultant/useConsultantQueries.ts` — query for reviewed-no-plan if RPC-backed.
- Tests: extend `src/lib/__tests__/consultant-dashboard-metrics.test.ts` — gone-quiet thresholding, reviewed-no-plan, finding generation (ordering, suppression, empty states).

## Open items to confirm

- Invite-farmer button relocation to Farmers page (verify Farmers page gains it).
- Never-sampled farms: DEFERRED (v1 = "sampled before, now silent"; flag in code).
- Validate call-list reasons + 30d threshold with the agronomist who was consulted.

## NOT in scope

- New SECURITY DEFINER RPC for the call list — reversed; client-side join is the minimal correct path.
- "Never sampled" farmers in the quiet list — deferred (RPC doesn't return them).
- Per-farmer adherence + nutrient-trajectory ("not followed" / "worsening" reasons) — v2 RPCs.
- Contact-logging / snooze / reminders — derived state self-clears; no write path.
- Team workload signal — explicitly cut (owner confirmed twice), not moved anywhere.

## What already exists (reused, not rebuilt)

- `KpiStrip`, `openReviewCount`, `adherenceSummary`, `nutrientStatusAcrossFarms`, `get_org_latest_petiole`, `get_org_followup_adherence`, all `useConsultant*` hooks. Only NEW data-layer change is un-dropping `sample_date` (~2 lines).

## Failure modes (per new codepath)

- **Backdated sample → false "quiet"** (silent wrong data, not a crash). No test catches it today; mitigation = documented `created_at` fallback. Watch item, not a blocker.
- **Empty/cold-start org** → every list empty. Must render "All caught up", not a blank page. Test required (in test plan).
- **farm_id with no matching client row** (farmer left org mid-session) → join yields no name. Render gracefully (skip row), don't crash.

## GSTACK REVIEW REPORT

| Review        | Trigger            | Why                             | Runs | Status               | Findings                                                                                                                      |
| ------------- | ------------------ | ------------------------------- | ---- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Eng Review    | `/plan-eng-review` | Architecture & tests (required) | 1    | issues_open→resolved | 1 arch (data sourcing→client-side), 0 code-quality, 8 test gaps added to plan, 0 perf; status-mapping + team-workload decided |
| Outside Voice | Claude subagent    | Independent 2nd opinion         | 1    | issues_found         | Codex usage-limited; Claude subagent found the RPC overbuild + status-mapping gap + backdated-date skew                       |

- **CODEX:** unavailable (usage limit, resets Jun 26) — fell back to Claude subagent.
- **CROSS-MODEL:** 1 tension (new RPC vs client-side). Resolved in favor of the outside voice — switched to client-side, no migration.
- **VERDICT:** ENG CLEARED — ready to implement Plan 1. Scope: both plans kept (Analytics deferral declined by user). Decisions: client-side sourcing · reason = reviewed+escalated-without-plan · team workload cut · instrument Plan 1 CTAs.

NO UNRESOLVED DECISIONS
