import { redirect } from 'next/navigation'

// `/clients/[id]` was the pre-cockpit client-detail page. It's superseded by
// `/consultant/farmers/[farmerId]`, is no longer linked anywhere, and its old
// email-invite flow is incompatible with the phone-ownership accept gate.
// Redirect stale bookmarks to the canonical route, preserving the id.
export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/consultant/farmers/${id}`)
}
