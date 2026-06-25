export const farmKeys = {
  list: () => ['farms', 'list'] as const,
  detail: (farmId: number) => ['farms', farmId, 'detail'] as const,
  summary: (farmId: number) => ['farms', farmId, 'summary'] as const,
  logs: (farmId: number) => ['farms', farmId, 'logs'] as const,
  records: (farmId: number) => ['farms', farmId, 'records'] as const,
  tasks: (farmId: number) => ['farms', farmId, 'tasks'] as const,
  labTests: (farmId: number) => ['farms', farmId, 'lab-tests'] as const,
  soilProfiles: (farmId: number) => ['farms', farmId, 'soil-profiles'] as const
}
