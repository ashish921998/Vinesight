# FarmAI Improvement Roadmap

## Backend-Driven Analytics Aggregation _(Owner: TBD • Status: Pending)_

### Objective

Shift intensive data aggregation away from the client by consolidating analytics logic into Supabase SQL functions for faster, scalable dashboards.

### Key Steps

1. Design Supabase RPCs (starting with `get_farm_analytics`) that join irrigation, spray, harvest, and farm tables with optional time-range filters.
2. Add migrations plus regenerated Supabase TypeScript types; expose typed wrappers in `CloudDataService`.
3. Refactor `src/app/analytics/page.tsx` to depend on the RPC payload, eliminating farm-by-farm loops and local aggregations.
4. Adapt `AnalyticsService.generateAdvancedAnalytics` to consume the pre-aggregated data and add retry/error handling for RPC calls.
5. Benchmark the SQL plans with representative data volumes and tune indexes as needed.

## Server State Management with React Query _(Owner: TBD • Status: Pending)_

### Objective

Replace ad-hoc `useEffect` data fetching with a standardized server-state library for caching, re-fetching, and deduplication.

### Key Steps

1. Add `@tanstack/react-query` and create a shared provider wrapper for client layouts.
2. Convert analytics, performance, and dashboard pages to `useQuery`/`useMutation`, using stable query keys tied to farm/time filters and guarding execution with `enabled` flags.
3. Centralize fetch logic inside hooks such as `useFarmAnalytics` so components stay declarative.
4. Document cache invalidation patterns (e.g., mutations invalidating `['efficiencyMetrics', farmId]`).

## Component Decomposition _(Owner: TBD • Status: Pending)_

### Objective

Break oversized UI components into focused modules to simplify testing, reuse, and readability.

### Key Steps

1. Split `EditRecordModal` into a lightweight modal shell plus record-specific form components located under `src/components/journal/edit-forms/`.
2. Extract `SoilHealthMonitoring` tab panels (`PhysicalInputs`, `ChemicalInputs`, `BiologicalInputs`, `AnalysisResults`) into separate files coordinated by a parent container.
3. After adopting RPC analytics, extract presentation-only subcomponents (metrics cards, cost analysis, yield analysis, recent activity) from `analytics/page.tsx`.
4. Add Storybook stories or unit tests for each new child component where practical.

## Type Safety & Form Handling _(Owner: TBD • Status: Pending)_

### Objective

Remove TypeScript suppression, standardize validation, and centralize scoring constants for consistent logic.

### Key Steps

1. Eliminate `@ts-nocheck` from `src/lib/farmer-learning-service.ts` by defining precise Supabase response types and tightening helper signatures.
2. Extract repeated scoring thresholds/weights from `analytics-service.ts` into named constants or configuration objects.
3. Adopt `react-hook-form` with Zod schemas for calculators and data-entry forms (starting with `LAICalculator`) to cut manual parsing and improve validation feedback.
4. Share common utilities for mapping scores to colors/badges instead of duplicating logic across components.

## Database Schema Normalization _(Owner: TBD • Status: Pending)_

### Objective

Normalize heavy JSON columns into relational tables to unlock enforced integrity and richer querying.

### Key Steps

1. Identify JSON fields that require structured queries (`soil_test_records.parameters`, `profitability_analyses.expense_breakdown`, etc.) and design companion tables.
2. Create Supabase migrations for the new tables, including backfill scripts that migrate existing JSON data safely.
3. Update row-level security policies for the new tables and regenerate database types.
4. Adjust TypeScript interfaces/services to depend on the normalized schema and remove JSON field usage.
5. Stage migrations through dev/staging before production deployment, with rollback scripts prepared.

## Sequencing & Testing Guidance

1. Complete backend analytics RPC work first to unblock UI simplification.
2. Introduce the React Query provider immediately after backend changes so subsequent component refactors can lean on the new hooks.
3. Parallelize component decomposition with the React Query rollout, ensuring each refactor lands with updated tests or stories.
4. Schedule schema normalization post-analytics to avoid overlapping migrations; verify data migration using spot checks and Supabase type regeneration.
5. After each milestone, run `npm run lint`, `npm run typecheck`, and targeted integration tests covering analytics flows.

## Risks & Mitigations

- **RPC performance regressions**: Review query plans, add pagination/time filters, and tune indexes before rollout.
- **React Query SSR boundaries**: Keep providers within client components/layouts and guard queries with `enabled` flags to avoid hydration issues.
- **Schema migration errors**: Wrap migration scripts in transactions, schedule during low-traffic windows, and maintain rollback scripts.
- **Tightened TypeScript checks introducing build breaks**: Resolve the `farmer-learning-service` typing issues first and consider incremental strictness toggles afterward.
