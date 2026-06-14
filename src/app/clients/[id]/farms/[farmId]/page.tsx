import { redirect } from 'next/navigation'

// `/clients/[id]/farms/[farmId]` was the pre-cockpit farm-detail page under a
// client. Superseded by `/consultant/farmers/[farmerId]/farms/[farmId]`. Redirect
// stale bookmarks to the canonical route, preserving both ids.
export default async function ClientFarmPage({
  params
}: {
  params: Promise<{ id: string; farmId: string }>
}) {
  const { id, farmId } = await params
  redirect(`/consultant/farmers/${id}/farms/${farmId}`)
}
