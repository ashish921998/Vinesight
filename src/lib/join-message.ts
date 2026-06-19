/**
 * Builds the share-ready invite message a consultant copies for a farmer.
 *
 * NOTE: The mobile-app step labels below ("Settings → Connect to consultant → enter code")
 * are placeholders and TBD — confirm them against the React Native Settings screen and
 * keep this template in sync with the actual navigation labels there.
 */
export function buildJoinMessage(organizationName: string, joinCode: string): string {
  const trimmedName = organizationName.trim()
  const subject = trimmedName ? `"${trimmedName}"` : 'your consultant'
  return `Join ${subject} on VineSight. Open the app → Settings → Connect to consultant → enter code: ${joinCode}`
}
