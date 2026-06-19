/**
 * Builds the share-ready invite message a consultant copies for a farmer.
 *
 * The mobile-app step labels below mirror the React Native Settings screen
 * (`settings.joinOrg.title` → "Join your consultant" in AccountSection.tsx).
 * Keep this template in sync if those navigation labels change.
 */
export function buildJoinMessage(organizationName: string, joinCode: string): string {
  const trimmedName = organizationName.trim()
  const subject = trimmedName ? `"${trimmedName}"` : 'your consultant'
  return `Join ${subject} on VineSight. Open the app → Settings → Join your consultant → enter code: ${joinCode}`
}
