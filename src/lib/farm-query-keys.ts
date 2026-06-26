/** Active filters for the farm logs list; part of the logs query key. */
export interface LogFilters {
  searchQuery: string
  selectedActivityTypes: string[]
  dateFrom: string
  dateTo: string
  page: number
  itemsPerPage: number
}

export const farmKeys = {
  list: () => ['farms', 'list'] as const,
  detail: (farmId: number) => ['farms', farmId, 'detail'] as const,
  summary: (farmId: number) => ['farms', farmId, 'summary'] as const,
  // Filterless form is the invalidation prefix: invalidating `logs(farmId)`
  // matches every filter-keyed `logs(farmId, filters)` variant below it.
  logs: (farmId: number, filters?: LogFilters) =>
    filters ? (['farms', farmId, 'logs', filters] as const) : (['farms', farmId, 'logs'] as const),
  records: (farmId: number) => ['farms', farmId, 'records'] as const,
  tasks: (farmId: number) => ['farms', farmId, 'tasks'] as const,
  labTests: (farmId: number) => ['farms', farmId, 'lab-tests'] as const,
  soilProfiles: (farmId: number) => ['farms', farmId, 'soil-profiles'] as const,
  plans: (farmId: number) => ['farms', farmId, 'plans'] as const
}
