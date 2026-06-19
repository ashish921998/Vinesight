/**
 * Canonical module home routes.
 *
 * The single source of truth for where each user module lands. Shared by the
 * edge-runtime middleware and the browser-side module-home resolver so the two
 * runtimes can never drift — if one changes without the other, middleware and
 * the client redirects disagree and every login bounces.
 *
 * Keep this file free of any browser- or server-only imports: it is imported by
 * both src/middleware.ts (edge) and client components.
 */
export const FARMER_HOME = '/dashboard'
export const ORG_HOME = '/consultant'
