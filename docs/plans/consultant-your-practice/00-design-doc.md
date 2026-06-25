# Design Doc — Consultant Overview as "Your Practice" + Analytics page

Date: 2026-06-24 · Branch: posthog-code/consultant-command-center-ui · Author: design-shotgun session
Produced in lieu of a full /office-hours run (the substance was explored live this session, including primary-source validation). Feeds /plan-eng-review.

## Problem statement

The consultant "Overview" (Command Center) was built as a chart dashboard (5 recharts panels). The user's instinct was "it needs more graphs." Interrogating that against the real workflow showed the opposite: the charts are low-signal, and the page has no clear job distinct from the Petiole Review queue.

## Demand reality (the forcing question)

Primary-source check: a real agronomist said nudging farmers to take petiole samples — by phone and during visits — is part of the job. That validates a _proactive_ surface. Earlier assumption ("farmers self-sample, no nudging needed") was the user's guess; the agronomist contradicted it. This is the strongest signal in the session and the reason the direction is the practice panel, not a chart wall.

## Status quo (what people do today)

- Consultants work reactively from the Petiole Review queue (inbound petiole tests → review → issue fertilizer plan).
- Nudging happens off-platform (calls/visits). The consultant enters the petiole report on the farmer's behalf when a sample is taken.
- There is no surface that shows _who to chase_ — the queue only shows who already submitted.

## The wedge (narrowest valuable change)

Overview becomes "Your Practice": a proactive daily panel that surfaces what the queue is structurally blind to — farmers gone quiet (no sample in 30d+) and loose ends (reviewed but no plan). It complements, not duplicates, the queue.

## Alternatives explored (this session, A–G)

- A Instrument Cluster (dense small-multiples) — rejected: noise.
- B Analyst Cockpit (nutrient heatmap + queue aging) — rejected: heatmap ungrounded (which farm? which farms? stale data) and over-built for the workflow.
- C Worklist + rail — folded in.
- D/E Insights-led impression band — kept as a component.
- F **Your Practice** (proactive call list + impression band + queue pointer) — CHOSEN, agronomist-validated.
- G Analytics page — chosen as the home for the pulled charts (user decision, against a mild recommendation to cut them; gated on usage instrumentation).

## Chosen direction

1. **Overview = Your Practice** (ship first): impression band ("what needs attention") → "Farmers to contact" derived-state list (quiet / reviewed-no-plan; v2: not-followed / worsening) → queue pointer + practice snapshot + compact nutrient bar. CTAs map to the resolving action (View farmer / Issue plan / Log a visit). No contact-logging or snooze — the list is derived state that self-clears when a sample arrives.
2. **Analytics page** (follow-up): new nav destination housing nutrient-status (full), severity mix, throughput, pipeline, adherence. Explicitly a "study the book" surface, not daily work.

## Non-goals / deferred

- Farmer read-receipts, farmer↔consultant messaging (no data model; out of scope).
- Per-farmer adherence + nutrient-trajectory RPCs (v2 enrichments).
- "Never-sampled" farms (separate query; v1 covers "sampled before, now quiet").
- A consultant-side petiole-entry form (Quiet CTA just navigates for v1).

## Key risks

- Analytics page is a dumping-ground risk — must be instrumented (PostHog page views) and cut if unused.
- "Gone quiet" threshold (30d) is a guess; confirm with the agronomist.
- `get_org_latest_petiole` excludes never-sampled farms — known gap.

## Supersedes

The original "Command Center" chart dashboard on this branch (PR #185). This is a direction change for the Overview's purpose, not a tweak.
