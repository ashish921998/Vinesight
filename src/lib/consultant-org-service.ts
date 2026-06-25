// Client helpers for the org-branding endpoints. All three hit the single
// /api/consultant/organization route (owner/admin gated, service-role backed):
//   PATCH  → rename the org           POST → upload/replace the logo
//   DELETE → remove the logo
// After any of these resolve, callers should invalidate the consultant-access
// query so the sidebar (logo + name) re-renders with the new identity.

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string }
    return data.error || fallback
  } catch {
    return fallback
  }
}

/** Rename the organization. Returns the saved name. */
export async function updateOrganizationName(name: string): Promise<string> {
  const response = await fetch('/api/consultant/organization', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })
  if (!response.ok) {
    throw new Error(await readError(response, 'Failed to update organization name'))
  }
  const data = (await response.json()) as { name: string }
  return data.name
}

/** Upload (or replace) the organization logo. Returns the new public URL. */
export async function uploadOrganizationLogo(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('/api/consultant/organization', {
    method: 'POST',
    body: formData
  })
  if (!response.ok) {
    throw new Error(await readError(response, 'Failed to upload logo'))
  }
  const data = (await response.json()) as { logoUrl: string }
  return data.logoUrl
}

/** Remove the organization logo (reverts the sidebar to the building glyph). */
export async function removeOrganizationLogo(): Promise<void> {
  const response = await fetch('/api/consultant/organization', { method: 'DELETE' })
  if (!response.ok) {
    throw new Error(await readError(response, 'Failed to remove logo'))
  }
}
