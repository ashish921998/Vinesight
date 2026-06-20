# Design Audit — vinesight-web vs DESIGN.md

Generated 2026-06-20 by a full per-screen read-only audit (5 parallel reviewers) against `DESIGN.md`. This is the gap list to bring the app onto the design system. Pair with `DESIGN.md` (the target) — this file is the backlog.

## Cross-cutting themes (fix these once, everywhere)

These recur on almost every screen. Fixing them at the source clears most of the backlog.

1. **No IBM Plex anywhere.** `layout.tsx` loads SIX families (Geist, Geist Mono, Montserrat, Merriweather, Source Code Pro, Inter) and binds `--font-sans` to **Inter** (blacklisted); `globals.css` claims Montserrat. Nothing uses Plex Serif/Sans/Mono. → Consolidate to IBM Plex in `layout.tsx` + `globals.css`. **Re-skins all 52 pages at once.**

2. **Numbers are never `font-mono tabular-nums`.** Every metric/result/KPI across dashboards, calculators, FarmHeader, analytics, worklists renders in proportional sans. → Add a numeric class (Plex Mono) and apply to all value readouts.

3. **Hardcoded farm-tech colors instead of semantic tokens.** ~67 files use `text-/bg-/border-(green|blue|emerald|teal|orange|purple|cyan)-NNN`. Off-system hues (blue, purple, teal, cyan) have NO token basis at all. → Map to `--accent`, `--primary`, and status tokens; add semantic status tokens (`--healthy/attention/critical`, diverging `--deficient/optimal/excess`) to `globals.css`.

4. **Status encoded by color only (grayscale-first violation).** Dots, badges, card-bg-tints, progress bars carry meaning with no icon/label. Worst: analytics "Alerts" uses three shades of _green_ for warning/success/info; portfolio + FarmerDashboard farm-health is a 2px colored dot. → Always pair color with icon + text label.

5. **Gradients (slop).** Confirmed: `dashboard/page.tsx`, `auth/page.tsx` (`from-green-50 to-blue-50`), `help/page.tsx` (`from-emerald-500 to-green-600`), plus decorative gradient blobs + per-tile gradient washes in `FarmerDashboard.tsx`. → Flat warm surfaces.

6. **Emoji as UI.** `reminders` (💧🌿🧪🍇🔬💰📝), `lab-tests` tabs (🌱🍃), `TestRecommendations` (📋), `UnifiedDataLogsModal` (🧪), dashboard error (⚠️), notification titles (✅). → Replace with lucide icons.

7. **The diverging nutrient scale (amber/green/indigo) is absent product-wide.** Every lab/nutrient surface uses traffic-light red/yellow/green — `LabTestComparisonTable`, `TestRecommendations`, `NutrientCalculator`, and even the consultant review screen maps excess to **rose**, not indigo. The product's signature feature exists only in DESIGN.md. → Build one shared NutrientScale/StatusTag component and use it on both skins.

8. **Bespoke spinners + `animate-pulse` instead of conventions.** Hand-rolled SVG/border spinners in login, signup, verify-\*, export; `animate-pulse bg-gray-200` skeletons in warehouse. → Use shadcn `Skeleton` for content, `Loader2` for actions (matches existing loading-UX memory).

---

## Priority tiers

### Tier 0 — Foundation (do first; unblocks ~everything)

- `src/app/layout.tsx` + `src/app/globals.css` — IBM Plex consolidation; add semantic status + diverging tokens; make the two files agree.
- Kill the 3 named gradients (`dashboard`, `auth`, `help`).
- Build shared components: `NutrientScale` (diverging, value-first), `StatusTag` (icon+label+color), and standardize numeric class.

### Tier 1 — Consultant module (structural, net-new layout)

The biggest _structural_ gaps (not just color):

- `consultant/page.tsx` (Command Center) — **[HIGH]** review list is a `<ul>` in a Card, not a worklist table; missing Village/Crop Stage/**Lab Flags chips**/filter strip/"N awaiting judgment" counter. Plus a banned 2-card icon grid below, and `JoinCodeCard` squatting above the queue.
- `consultant/triage/page.tsx` — table exists but **missing the Lab Flags column**, filter is a dropdown not toggle-chips, rows ~44px (want 52px), 3 stat-cards eat row space.
- `consultant/farmers/[farmerId]/farms/[farmId]/page.tsx` (review workbench) — **[HIGH]** nutrient matrix maps excess to **rose not indigo**, no range-bar+tick, no Delta column; 50/50 split (want 58/42); no sticky farmer context strip; no sticky Save-draft / Request-clarification / **Sign & issue** action bar; review/history is tabbed (want one persistent two-pane).
- Farmer/report names everywhere use sans, not Plex Serif. Payment badges + `PaidToggleButton` use raw `green-600`/`amber-700` not tokens. `Grape` icon uses banned `text-purple-600`.

### Tier 2 — Farmer module (highest user impact)

- `FarmerDashboard.tsx` (1,143 lines) — gradient header blob + per-tile gradient washes, color-only health dot, sub-16px text (`text-[10px/11px]`), multi-tab mobile dashboard. Rebuild as Field Companion: health banner (icon+label) + Today + weather + quick actions.
- **Calculators** (`LAICalculator` ~40 green classes, `NutrientCalculator` 14 fields at once, `YieldPrediction`/`DiseasePrediction` 4–5 dense tabs + raw hex `#dc2626` etc.) — heaviest offenders. Need one-input-group-per-screen, big number pads, single bold Plex-Mono result, diverging scale on nutrient output.
- `UnifiedDataLogsModal.tsx` (2,013 lines) — wholesale `text-gray-700`, raw amber classes, `🧪` emoji, `h-9` (36px) inputs below 48px target.
- `WeatherDashboard`, `PestAlertDashboard`, `TodaysTasksSection` (36px complete button, color-only overdue), `FarmModal`, `farm-details/*`.

### Tier 3 — Dashboards & peripheral

- `analytics/page.tsx` (23 green classes, 4-hue KPI cards, three-greens Alerts), `reports` (4-shades-of-green tabs), `performance` (teal — fully off-system; 6-hue best-practices grid), `portfolio` (2px health dot, duplicate hand-rolled bottom nav).
- **Auth funnel (high-visibility):** `auth`, `login`, `signup`, `verify-otp`, `verify-email` — gradients, raw green/blue icon wrappers, blue "What's next?" boxes (no blue token), bespoke SVG spinners. First thing every user sees.
- `settings` (gray-50 bg, blue org card), `delete-account`, `workers` + `warehouse` (daily-use, gray bg + raw status colors + animate-pulse skeletons), `users`, `help`.
- `global-error.tsx` — off-brand hex `#37a765` (not sage `#6f8f5e`); inline-style only, so fix the hex at least.

### Already clean (no/low action)

`privacy`, `terms`, `auth-code-error`, landing `page.tsx` (on-brand; minor raw-hex shadows that are actually slate/sage), `calculators/page.tsx` shell, `EmptyStateDashboard`, `WaterCalculationModal` (good token use, 48px inputs).

---

## Severity counts (approx, from the audit)

- **HIGH** (gradients, color-only status, missing nutrient scale, wrong consultant structure, off-system blue/teal/purple, raw hex): heaviest in consultant review screen, calculators, analytics, auth funnel.
- **MED** (hardcoded green/gray classes, missing Plex/Mono, sub-48px targets): pervasive — most files.
- **LOW** (polish, radius, spacing nits): scattered.

## Recommended sequence

1. **Tier 0** in one PR — fonts + tokens + shared NutrientScale/StatusTag. Verify one build; most screens improve for free.
2. **Consultant worklist + review workbench** (Tier 1) — the structural net-new work; highest design ROI.
3. **Farmer dashboard + calculators** (Tier 2).
4. Sweep **dashboards + auth + daily-use** (Tier 3) screen by screen, replacing raw colors with the now-existing tokens.
