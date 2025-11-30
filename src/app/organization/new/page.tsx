'use client'

/**
 * Create Organization Page
 * Wizard to create a new organization
 */

import { CreateOrganizationWizard } from '@/components/organization/CreateOrganizationWizard'

export default function CreateOrganizationPage() {
  return (
    <div className="container py-8">
      <CreateOrganizationWizard />
    </div>
  )
}
