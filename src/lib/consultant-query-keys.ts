export const consultantKeys = {
  access: (userId: string) => ['consultant', 'access', userId] as const,
  farmers: (orgId: string, scope: string) => ['consultant', 'farmers', orgId, scope] as const,
  farmerProfile: (farmerId: string) => ['consultant', 'farmer', farmerId, 'profile'] as const,
  farmerFarms: (farmerId: string) => ['consultant', 'farmer', farmerId, 'farms'] as const,
  farmDetail: (farmId: number, orgId: string, scope: string) =>
    ['consultant', 'farm', farmId, 'detail', orgId, scope] as const,
  farmLabTests: (farmId: number) => ['consultant', 'farm', farmId, 'labTests'] as const,
  farmPlans: (farmId: number) => ['consultant', 'farm', farmId, 'plans'] as const,
  farmTriage: (farmId: number, orgId: string, scope: string) =>
    ['consultant', 'farm', farmId, 'triage', orgId, scope] as const,
  farmReportFiles: (farmId: number) => ['consultant', 'farm', farmId, 'reportFiles'] as const,
  reportSignedUrl: (path: string) => ['consultant', 'report', 'signedUrl', path] as const,
  farmerValidation: (farmerId: string, orgId: string, scope: string) =>
    ['consultant', 'farmer', farmerId, 'validation', orgId, scope] as const,
  farmerVisits: (farmerId: string, orgId: string, scope: string) =>
    ['consultant', 'farmer', farmerId, 'visits', orgId, scope] as const,
  reviewQueue: (orgId: string, scope: string) =>
    ['consultant', 'reviewQueue', orgId, scope] as const,
  triageItems: (orgId: string, scope: string) =>
    ['consultant', 'triageItems', orgId, scope] as const,
  orgMembers: (orgId: string) => ['consultant', 'orgMembers', orgId] as const,
  pendingInvites: (orgId: string) => ['consultant', 'pendingInvites', orgId] as const,
  orgAdherence: (orgId: string, scope: string) =>
    ['consultant', 'orgAdherence', orgId, scope] as const,
  orgNutrientStatus: (orgId: string, scope: string) =>
    ['consultant', 'orgNutrientStatus', orgId, scope] as const,
  // Keyed on orgId only: the fetch (getPlanTriageIdsByOrg) is org-wide and
  // ignores farmer scope, so 'assigned' and 'all' callers share one cache entry.
  orgPlanLinks: (orgId: string) => ['consultant', 'orgPlanLinks', orgId] as const
}
