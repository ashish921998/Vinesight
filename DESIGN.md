# Design System — VineSight

> Created by `/design-consultation` on 2026-06-20. Scope: one whole-product design language with **two module skins** that share a foundation.
>
> **Surfaces:**
>
> - **Consultant module** (this repo, `src/app/consultant/**`) — desktop B2B reads workbench. See _Consultant Skin_ below.
> - **Farmer web module** (this repo, `src/app/dashboard`, `farms`, `calculators`, `ai-assistant`, `disease-prediction`, `yield-prediction`, `weather`, `reminders`, `reports`, …) — **responsive web PWA**, mobile-first but also renders on desktop browsers. See _Farmer Skin_ below.
> - **Farmer React Native app** (separate repo, `~/Desktop/vinesight-rn`) — inherits the Farmer Skin tokens/principles where the platform allows.
>
> ## Shared Foundation (both skins)
>
> - **Brand spine:** slate `#2f3a44` + sage `#6f8f5e`, warm neutrals.
> - **Diverging nutrient scale** (deficient amber / optimal green / excess indigo) — a farmer sees their petiole result encoded the same way their consultant judged it. Cross-module consistency.
> - **Type:** IBM Plex family (English-only product, so one type system everywhere). Plex Mono for all numbers, `tabular-nums`.
> - **Base spacing:** 4px scale. shadcn/Radix components.
>
> The skins **diverge on posture**: consultant = dense reads-worklist on a laptop (compact, tables, serif gravity); farmer = task-first responsive PWA used in the field (spacious, cards, big targets, sunlight-safe). What follows is the consultant skin; the **Farmer Skin** section is at the end.

## Product Context

- **What this is:** A digital companion for grape farming in India. The **consultant module** is a desktop B2B workspace where agricultural consultants/agronomists review a farmer's petiole (leaf-tissue) lab report and issue a fertilizer plan, plus manage farmer assignments, a review/triage queue, and team.
- **Who it's for:** Agricultural consultants and agronomists (expert users, working on a 13–15" laptop), serving small-to-large Indian grape farmers.
- **Space/industry:** Agronomy / crop-advisory software. Peers: Climate FieldView, Agworld, Cropin, FarmLogs — all map-first. We are deliberately **not** map-first.
- **Project type:** Dense B2B web app / review workbench.

## Design Thesis

**Agronomic Reads Bench** — a quiet clinical workbench for agricultural judgment. The consultant's primary object is _a lab report awaiting a verdict_, so the workspace reads like a clinical "reads worklist" (think radiology queue), not a farm CRM. Paper-white, instrument-like, document-forward, fast to scan, with the gravity of a lab review desk.

**Memorable thing:** "This is serious agronomy software that respects my time." Credibility first, speed and calm in support. Every decision serves that.

---

# Consultant Skin

## Aesthetic Direction

- **Direction:** Industrial/Utilitarian × clinical diagnostics.
- **Decoration level:** Minimal — typography and disciplined status color do the work. No decorative blobs, no green pastoral imagery, no hero sections, no field maps unless geography is the actual task.
- **Mood:** Calm, precise, accountable. The agronomist should feel like a specialist sitting down at an instrument.

## Typography

One superfamily — **IBM Plex** — for total coherence across display, body, and data.

- **Display/Names:** **IBM Plex Serif** (500/600) — farmer & report names, page-level headings. Used _sparingly_; it gives lab-document gravity without tipping into "brochure." (Replaces Merriweather.)
- **Body/UI:** **IBM Plex Sans** (400/500/600) — body copy, controls, table text. Legible at 12–15px in dense tables. (Replaces Montserrat, which reads marketing-geometric at small sizes.)
- **Data/Tables:** **IBM Plex Mono** — nutrient values, sample/lab IDs, accession numbers, timestamps. Always `font-variant-numeric: tabular-nums lining-nums` so values align down the column.
- **Code:** IBM Plex Mono.
- **Base rule:** `font-variant-numeric: tabular-nums lining-nums; letter-spacing: 0;` on data surfaces. Numbers right-aligned, units muted and separate.
- **Loading:** Bunny Fonts or self-hosted via `next/font`. Families: `ibm-plex-serif`, `ibm-plex-sans`, `ibm-plex-mono`.
- **Scale (px):** caption 11 · small 12 · body 14 · base-ui 15 · h3 17 · h2 19 · h1 24 · display 30.

## Color

- **Approach:** Restrained. The slate + sage brand spine carries identity; status color owns attention. Do **not** over-green the UI — sage signals orientation and completion, not every surface.
- **Brand:**
  - **Primary (slate):** `#2f3a44` — primary actions, headings, sidebar mark.
  - **Accent (sage):** `#6f8f5e` — focus, completion, the "Issue plan" action. `--accent-soft #e7eee2` for active nav.
- **Neutrals (warm):** paper `#fafaf8` · surface `#ffffff` · surface-subtle `#f3f4f0` · border `#dfe2dc` · border-strong `#c8cdc4` · text `#232a2f` · text-muted `#6f7672` · text-faint `#9a9f99`.
- **Semantic — diverging nutrient scale (the signature):** deficiency and excess are _opposite_ failures, so they get opposite temperatures. **Never** a single red/green axis; **never** color alone — always pair with a text label (`Deficient` / `Optimal` / `Excess`).
  - **Deficient (warm amber):** `#b54708` · bg `#fff4e5` · border `#f2c27a`
  - **Optimal (green):** `#3f7d4c` · bg `#edf7ef` · border `#a8d5b0`
  - **Excess (cool indigo):** `#5b6c9e` · bg `#eef1f8` · border `#b9c4e2`
- **Other status:** pending `#6f7672` / bg `#f1f2ef` · critical `#7f1d1d` / bg `#fee2e2`.
- **Dark mode:** redesign surfaces (bg `#0f1317`, surface `#161d23`); in dark, primary becomes sage `#6f8f5e`; lift the diverging hues for contrast (deficient `#f0915a`, optimal `#7cc08a`, excess `#9fb0dd`).

## Spacing

- **Base unit:** 4px.
- **Density:** Compact-comfortable. Worklist rows 48–56px (default 52px).
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64).

## Layout

- **Approach:** Grid-disciplined. Tables over cards for any list of work.
- **Reads worklist (Command Center):** left sidebar nav (Queue · Farmers · Assignments · Team) + a **dense worklist table**, not a card grid. Columns: Farmer · Village · Crop Stage · Sample Date · Lab Flags (compact mono chips: `N low`, `K excess`) · Status · right-aligned Review action. Compact filter strip above (Needs review / Deficient / Unassigned / Due today / My queue). Header counter: "N reports awaiting judgment."
- **Single-report review:** two-pane workbench — left 58–64% = lab evidence (report header, **nutrient matrix**, trend comparison, collapsible source PDF); right 36–42% = judgment + fertilizer-plan builder (diagnosis summary, recommendation rows, farmer-safe explanation, internal note). Persistent one-line farmer context strip (`Rahul Jadhav · Thompson Seedless · Niphad · Flowering · 3.2 ac · Last plan: 18 days ago`). Sticky action bar: Save draft · Request clarification · **Sign & issue plan**.
- **Nutrient matrix:** `Nutrient | Value | Unit | Range | Status | Delta`. Fixed-width range bar with a tick at the sampled value inside the crop-stage range; thin track, precise marker — a lab instrument scale, not a progress bar. Sortable by severity.
- **Max content width:** ~1180px for system pages; the review workbench may go full-width.
- **Border radius:** sm 8px (buttons, inputs) · card 12px · chip/pill 999px.
- **Progressive disclosure:** answer "is this report okay?" first; detail is at most two clicks away.

## Motion

- **Approach:** Minimal-functional — transitions that confirm state, not entertain.
- **Easing:** enter `ease-out` · exit `ease-in` · move `ease-in-out`.
- **Duration:** micro 50–100ms · short 150–250ms · medium 250–400ms.
- **Signature moment:** issuing a plan stamps the report `ISSUED · DD MON YYYY` (letterpress feel) — satisfying closure that mirrors the workflow.

## Deliberate Departures (where the product gets its own face)

1. **No map-first dashboard.** The category leads with the field polygon; we lead with the report awaiting judgment. Home = a reads queue.
2. **Diverging temperature nutrient scale** (amber ↔ green ↔ indigo) instead of red/yellow/green status dots — over- and under-supply are visually distinct, clinically honest.
3. **IBM Plex superfamily incl. a serif for names** — editorial lab-document gravity in a category addicted to friendly geometric sans.

## Anti-Slop Rules

No purple/violet gradients · no decorative blobs · no generic 3-icon-card grids · no oversized dashboard hero · no farm-productivity stock imagery · no map unless solving geography · no nutrient data inside cute cards · no color-only status · no buried primary action (always: review, clarify, issue) · no `system-ui`/Inter/Montserrat as the type voice.

---

# Farmer Skin (web PWA + RN)

Applies to the farmer web module in this repo (`src/app/dashboard`, `farms`, `calculators`, etc.) and the RN app. Responsive: mobile-first, with a desktop browser layout. Shares the Shared Foundation above; diverges on posture.

## Thesis

**Field Companion** — a calm, high-contrast companion that answers "what's happening on my farm, and what do I do next?" in one thumb-reachable glance. Readable in direct sun, usable one-handed. Memorable target: _I know what's happening and what to do next_ (today's tasks are the daily hook; farm-health is the reassurance layer).

## Aesthetic Direction

- **Direction:** Utilitarian-warm, task-first. Decoration minimal. Cards (not tables — the inverse of the consultant skin).
- **Mood:** Reassuring, directive, low-overwhelm. One thing at a time.

## The grayscale-first rule (signature constraint)

In bright field light (10,000+ lux) the eye loses hue before value. **Status must read with zero color** — encode health/alerts/done through **icon + value + label + size first; color only reinforces.** Design and review every status surface in grayscale; if the hierarchy collapses without color, it fails. (This is the consultant's "never color alone" rule, hardened.)

## Layout

- **Responsive:** mobile-first. **Mobile (`< lg`):** bottom nav (Dashboard · Farms · Workers · Calculator · Profile — already built in `BottomNavigation.tsx`), primary actions in the lower thumb-zone, a **FAB** for the most common action (log activity / mark done). **Desktop (`lg+`):** the same content reflows to a wider single/two-column layout; bottom nav gives way to a top or side nav.
- **Home:** directive stack — farm-health banner (healthy/attention/critical) → **Today** task list (the daily hook) → weather + spray window → quick-action grid. Health and "what to do" both visible above the fold.
- **Task cards:** swipeable, but always with **visible buttons** (never gesture-only). ≥48px targets, glove-friendly.
- **Calculators:** one input group per screen on mobile; big number pads; result as a single bold answer.
- **Nutrient/report views:** same diverging scale as consultant, but **value-first** — show the number + a `LOW / OK / HIGH` tag rather than fine range bars (legible on a phone in sun).

## Typography (Farmer)

- **Body:** IBM Plex Sans, **sized up** — 16px minimum, line-height 1.6 (field readability + visual impairment). Headings 600 bold.
- **Numbers:** IBM Plex Mono. **No serif** on the farmer side — clarity over gravity.

## Color (Farmer)

- **Desaturated, sunlight-safe.** Kill all gradients (retire the existing `green-50 → blue-50` look — neon-ish colors bloom/wash out in heat). Push critical contrast toward 7:1.
- Backgrounds warm paper/white. Status: healthy `#3f7d4c` · attention `#a8600a` · critical `#9a2820`, each muted-but-distinct and **always** paired with icon + label.

## Spacing & Motion (Farmer)

- **Spacious** density (inverse of consultant compact). Generous tap padding.
- Motion minimal; a satisfying check + haptic on task completion.

## Farmer Anti-Slop

No green/blue gradients · no color-only status · no gesture-only actions · no dense multi-tab dashboards on mobile · no tiny text · no upper-corner primary actions (keep them in the thumb-zone).

## Decisions Log

| Date       | Decision                                                                                                                                                                                                                                          | Rationale                                                                                                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-20 | Initial design system created                                                                                                                                                                                                                     | `/design-consultation` with landscape research + Codex & Claude outside voices (strong 3-way convergence)                                                                                                                               |
| 2026-06-20 | Replace Montserrat/Merriweather with IBM Plex superfamily                                                                                                                                                                                         | Montserrat reads marketing-geometric in dense tables; Plex gives one coherent technical family with serif gravity for names                                                                                                             |
| 2026-06-20 | Diverging nutrient scale (amber/green/indigo)                                                                                                                                                                                                     | Deficiency and excess are opposite failures; traffic-light red/green flattens them                                                                                                                                                      |
| 2026-06-20 | Worklist table replaces card grid on Command Center (consultant)                                                                                                                                                                                  | Primary object is a report awaiting judgment; matches the real economic workflow                                                                                                                                                        |
| 2026-06-20 | Two-skin model: Consultant (dense/laptop) + Farmer (responsive web PWA, task-first) sharing one foundation                                                                                                                                        | Different users, devices, postures; shared spine keeps cross-module consistency                                                                                                                                                         |
| 2026-06-20 | Farmer skin is grayscale-first; retire green/blue gradient                                                                                                                                                                                        | Sunlight (10,000+ lux) destroys hue before value; gradients bloom and wash out                                                                                                                                                          |
| 2026-06-23 | Command Center chart palette: promote diverging scale + add severity/status ramps as `--nutrient-*`/`--severity-*`/`--status-*` tokens                                                                                                            | Dashboard charts need on-brand, distinguishable hues; the 5 `--chart-*` tokens (2 sages/2 darks/grey) can't separate categories. Charts stay instrument-grade (no gradients/3D); color always paired with a text label                  |
| 2026-06-23 | IBM Plex superfamily migration shipped: replaced Montserrat/Merriweather/Source Code Pro (and the stray Inter `--font-sans` on `<html>`) with `IBM_Plex_Sans/Serif/Mono` via `next/font`; repointed `@theme inline` + `:root`/`.dark` font tokens | Closes the 2026-06-20 decision (was a "should replace" note). `font-serif` now actually resolves to Plex Serif for names/headings, `font-mono` to Plex Mono for numbers — the type system in this doc is now real, not aspirational     |
| 2026-06-23 | Farmer Directory (`/consultant/farmers`) rebuilt from card grid → worklist table; consultant sidebar (`consultant/layout.tsx`) moved to the shadcn `Sidebar` primitive (mobile Sheet drawer + icon-collapse)                                      | Card grid violated "tables over cards for any list of work" and the no-card-grid anti-slop rule; the hand-rolled sidebar didn't collapse on mobile. shadcn `Sidebar` gives mobile drawer, icon-collapse, ⌘B, and cookie-persisted state |
