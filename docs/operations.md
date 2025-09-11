# Operations Guide: Reliability, Monitoring, and Backups

This document describes the production operations posture for VineSight, covering error tracking, performance monitoring, health/readiness endpoints, uptime checks, and Supabase backup strategy.

## Error tracking and performance monitoring

Default provider: Sentry via `@sentry/nextjs`.

Configuration:
- Environment variables
  - SENTRY_DSN: DSN for the Sentry project
  - SENTRY_TRACES_SAMPLE_RATE: Fraction between 0 and 1. Suggested default: 0.1
  - SENTRY_PROFILES_SAMPLE_RATE: Optional profiling sample rate. Suggested default: 0
  - SENTRY_ENABLED=false to explicitly disable in any environment
- Client, server, and edge runtimes initialize in `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- PII guarded via `beforeSend` to redact headers like Authorization, Cookie, and API keys
- Error boundaries capture client-side errors and unhandled promise rejections

Alerting and dashboards:
- Create alert rule: Unhandled exceptions threshold > 1/min for 5 minutes → send to email/Slack/PagerDuty
- Create performance alert: Apdex below target for 5 minutes or p95 web vitals regressed > X% week-over-week
- Set environment names (production, staging) and use the Sentry release step in CI to version errors by commit

Optional alternatives:
- You can replace Sentry with OpenTelemetry and export to a backend such as OTLP/Tempo; keep the wrapper/initialization pattern to remain pluggable

## Health and readiness endpoints

- Health: GET /api/health
  - Returns current app version, environment, timestamp
  - Dependency checks: Supabase reachability and Open‑Meteo reachability
  - Cache-Control: no-store
  - Intended for dashboards and observability, safe to expose

- Readiness: GET /api/ready
  - Validates critical environment variables and Supabase reachability
  - Returns non-200 when not ready (503)
  - Cache-Control: no-store
  - Configure external uptime checks to target this endpoint

## Logging and correlation

- Structured logs (JSON in production) with level from LOG_LEVEL (debug, info, warn, error)
- A request-scoped correlation ID is propagated via the x-request-id header by middleware
- API handlers should log start/finish with the correlation ID to aid traceability

## Uptime checks

Recommended setup (choose one or more):
- UptimeRobot/BetterStack/Checkly: HTTP check to https://<your-domain>/api/ready every 1–5 minutes
  - Success when HTTP 200
  - Alert when ≥2 consecutive failures
  - Regional checks from at least two regions
- Vercel Health/Checks: Configure checks for the same endpoint and set a failure budget aligned with SLOs

Runbooks:
- If readiness is failing due to missing env vars, set/rotate in the hosting provider and redeploy
- If Supabase reachability is failing, check Supabase status, project firewall rules, or recent credential rotations

## Supabase backup and retention strategy

Goals:
- RPO: ≤ 24 hours for snapshot backups; ≤ 1 hour with PITR
- RTO: ≤ 2 hours for restore into a new database and cutover

Recommended configuration:
- Enable automatic daily backups (Snapshots)
- On paid plans, enable Point-in-Time Recovery (PITR) for finer-grained restores
- Retention: 7–14 days for snapshots; 7–30 days PITR depending on budget and regulatory needs

Operational checks:
- Verify backup jobs are succeeding weekly
- Test restore quarterly in a staging project (restore a snapshot to a new database)

Restore playbook (snapshot to new database):
1. In Supabase dashboard, create a restore from a snapshot into a new project or a fork
2. Validate schema and data integrity on the restored environment
3. Update application env vars to point to the restored database if a cutover is required
4. Rotate supabase keys in both application and dashboard after cutover

Environment variables and secrets:
- Never commit secrets to the repo
- Use hosting provider environment settings with per-environment scoping
- Maintain a 1Password/Secrets Manager entry describing each secret and its rotation cadence

Key rotations and incident response:
- Rotate the following on compromise or scheduled cadence: Supabase anon key, service role key (server-only), webhook secrets, Sentry auth token
- Immediately revoke leaked tokens and re-deploy with rotated values
- Post-incident: capture timeline, root cause, impact, and prevention items

## CI integration

- `.github/workflows/ci.yml` includes an `ops-preflight` job that runs typecheck and verifies required env vars when provided
- A conditional Sentry release step runs only when SENTRY_AUTH_TOKEN, SENTRY_ORG, and SENTRY_PROJECT are set in repository secrets

## Monitoring checklist

- [ ] Sentry DSN configured for production
- [ ] Tracing sample rate set conservatively and adjusted based on volume
- [ ] Alert rules for unhandled exceptions and performance regressions
- [ ] Uptime checks hitting /api/ready
- [ ] Backups enabled with defined retention; quarterly restore test completed
- [ ] Environment variables documented and managed via provider secrets
