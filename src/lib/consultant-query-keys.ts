export const consultantKeys = {
  access: () => ['consultant', 'access'] as const,
  farmers: (orgId: string, scope: string) => ['consultant', 'farmers', orgId, scope] as const,
  farmerProfile: (farmerId: string) => ['consultant', 'farmer', farmerId, 'profile'] as const,
  farmerFarms: (farmerId: string) => ['consultant', 'farmer', farmerId, 'farms'] as const,
  farmDetail: (farmId: number) => ['consultant', 'farm', farmId, 'detail'] as const,
  farmerVisits: (farmerId: string) => ['consultant', 'farmer', farmerId, 'visits'] as const
}
