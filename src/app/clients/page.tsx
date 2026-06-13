import { redirect } from 'next/navigation'

// `/clients` was the pre-cockpit client-management page. It's been superseded by
// `/consultant/farmers` (which lists clients and invites farmers via phone OTP), is no longer
// linked anywhere, and its old email-invite flow is incompatible with the phone-ownership
// accept gate. Redirect any stale bookmarks to the canonical page instead of 404ing.
export default function ClientsPage() {
  redirect('/consultant/farmers')
}
