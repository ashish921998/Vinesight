export const consultantKeys = {
  access: (userId: string) => ['consultant', 'access', userId] as const,
  farmers: (orgId: string, scope: string) => ['consultant', 'farmers', orgId, scope] as const,
  farmerProfile: (farmerId: string) => ['consultant', 'farmer', farmerId, 'profile'] as const,
  farmerFarms: (farmerId: string) => ['consultant', 'farmer', farmerId, 'farms'] as const,
  farmDetail: (farmId: number, orgId: string, scope: string) =>
    ['consultant', 'farm', farmId, 'detail', orgId, scope] as const,
  farmerValidation: (farmerId: string, orgId: string, scope: string) =>
    ['consultant', 'farmer', farmerId, 'validation', orgId, scope] as const,
  farmerVisits: (farmerId: string, orgId: string, scope: string) =>
    ['consultant', 'farmer', farmerId, 'visits', orgId, scope] as const
}
