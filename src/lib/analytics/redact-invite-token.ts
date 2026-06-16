// Consultant signup links carry a 7-day bearer token in the URL PATH: farmer invites use
// /signup/invite/<token> and team-member invites use /signup/member/<token>. PostHog autocapture
// ($pageview $current_url) and Sentry replay would otherwise ship that token to first-party
// analytics, leaking a live invite secret to anyone with analytics read access. Redact the token
// segment from any captured string before it leaves the browser. (Residual: browser history and
// server access logs still carry the URL, which is inherent to magic-link invites and acceptable
// here; a deeper fix would move the token out of the URL entirely.)
//
// Shared by the PostHog `before_send` and the Sentry `beforeSend`, so neither can leak the token.
const INVITE_TOKEN_RE = /\/signup\/(invite|member)\/[^\s/?#$]+/g

export const redactInviteToken = (value: unknown): unknown =>
  typeof value === 'string' ? value.replace(INVITE_TOKEN_RE, '/signup/$1/[redacted]') : value

export const redactInviteTokens = (obj: Record<string, unknown> | undefined | null): void => {
  if (!obj) return
  for (const key of Object.keys(obj)) {
    obj[key] = redactInviteToken(obj[key])
  }
}
