This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Testing & CI

This project includes unit/integration tests with Jest + React Testing Library and end-to-end tests with Playwright. CI runs on pull requests and pushes to `main` to prevent regressions.

### Unit & Integration (Jest)
- Config: `jest.config.ts` using `next/jest` (TS + JSX supported)
- Setup: `jest.setup.ts` loads `@testing-library/jest-dom` and optional MSW
- Tests live next to code: `**/*.test.(ts|tsx)` or `**/__tests__/*.(ts|tsx)`
- Default environment: `jsdom` (use `/** @jest-environment node */` for server-only tests)
- Path alias `@/*` is supported. Static assets and styles are mocked.

Example specs added:
- `src/app/api/health/route.test.ts` – tests API handler return shape
- `src/lib/logger.test.ts` – verifies log level gating and formatting
- `src/components/ui/button.test.tsx` – component smoke test with RTL

MSW usage:
- Available via `src/test/msw/server.ts`. Disabled by default for unit tests; enable per-run with `MSW=true` env if needed.

Coverage:
- Collected from `src/**/*.{ts,tsx}` with sensible exclusions
- Global thresholds: statements 60%, branches 50%, functions 60%, lines 60%
- Reports: text + lcov in `coverage/`

Run locally:
```bash
# Unit tests
npm run test        # CI mode (coverage)
npm run test:unit   # Local watchless run
```

### End-to-End (Playwright)
- Config: `playwright.config.ts` (Chromium), baseURL `http://localhost:3000`
- Tests: `e2e/*.spec.ts`
- Smoke suite:
  - `home.spec.ts` – homepage renders
  - `health.spec.ts` – `/api/health` returns JSON
  - `dashboard-auth.spec.ts` – unauthenticated user is redirected (Supabase auth calls are intercepted; no real network)

Run locally:
```bash
# First time: install browsers
npx playwright install chromium

# Run all e2e tests (headless by default)
npm run test:e2e
```

### Environment for tests
- Copy `.env.test.example` to `.env.local` (for e2e) or `.env.test` (for unit if needed). Values are safe placeholders; do not commit real secrets.
- No external services are called in tests. Supabase/AI/weather are stubbed via MSW or Playwright route interception.

### CI (GitHub Actions)
Workflow: `.github/workflows/ci.yml`
- Jobs: `lint`, `typecheck`, `unit-tests` (Jest + coverage artifact), `e2e` (Playwright with report on failure)
- Node 20.x with npm cache
- Uses `.env.test.example` (copied to `.env.local`) to avoid real network and secrets

If coverage falls below thresholds or tests fail, CI fails.
