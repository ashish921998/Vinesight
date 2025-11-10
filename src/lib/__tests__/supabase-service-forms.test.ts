import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { SupabaseService } from '../supabase-service'
import type { Farm, TaskReminder } from '@/types/types'
import type {
  IrrigationRecord,
  SprayRecord,
  HarvestRecord,
  FertigationRecord,
  ExpenseRecord,
  SoilTestRecord,
  PetioleTestRecord
} from '../supabase'

// Mock the Supabase client
vi.mock('../supabase', () => ({
  getTypedSupabaseClient: vi.fn(() => mockSupabaseClient)
}))

// Create a comprehensive mock Supabase client
let mockSupabaseClient: any

describe('SupabaseService - Form Submissions', () => {
  beforeEach(() => {
    // Reset mock for each test
    mockSupabaseClient = {
      auth: {
        getUser: vi.fn(() => ({
          data: { user: { id: 'test-user-123' } },
          error: null
        }))
      },
      from: vi.fn((table: string) => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: 1, ...mockData[table] },
              error: null
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: { id: 1, ...mockData[table] },
                error: null
              }))
            }))
          }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: mockData[table],
                error: null
              }))
            }))
          }))
        })),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: mockData[table],
              error: null
            })),
            order: vi.fn(() => ({
              data: [mockData[table]],
              error: null
            }))
          })),
          order: vi.fn(() => ({
            data: [mockData[table]],
            error: null
          }))
        }))
      }))
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const mockData: Record<string, any> = {
    farms: {
      id: 1,
      user_id: 'test-user-123',
      name: 'Test Farm',
      location: 'Nashik',
      area: 5,
      area_unit: 'acre',
      grape_variety: 'Thompson Seedless',
      planting_date: '2023-01-15',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z'
    },
    irrigation_records: {
      id: 1,
      farm_id: 1,
      date: '2025-01-15',
      duration: 2.5,
      area: 5,
      growth_stage: 'flowering',
      moisture_status: 'moderate',
      system_discharge: 500,
      notes: 'Test irrigation',
      created_at: '2025-01-15T00:00:00Z'
    },
    spray_records: {
      id: 1,
      farm_id: 1,
      date: '2025-01-15',
      water_volume: 100,
      chemicals: [{ name: 'Test Chemical', quantity: 2, unit: 'gm/L' }],
      notes: 'Test spray',
      created_at: '2025-01-15T00:00:00Z'
    },
    harvest_records: {
      id: 1,
      farm_id: 1,
      date: '2025-01-15',
      quantity: 1000,
      grade: 'Grade A',
      price_per_kg: 50,
      buyer: 'Test Buyer',
      notes: 'Test harvest',
      created_at: '2025-01-15T00:00:00Z'
    },
    fertigation_records: {
      id: 1,
      farm_id: 1,
      date: '2025-01-15',
      fertilizers: [{ type: 'NPK', quantity: 10, unit: 'kg/acre' }],
      notes: 'Test fertigation',
      created_at: '2025-01-15T00:00:00Z'
    },
    expense_records: {
      id: 1,
      farm_id: 1,
      date: '2025-01-15',
      category: 'labor',
      description: 'Worker wages',
      cost: 5000,
      remarks: 'Test expense',
      created_at: '2025-01-15T00:00:00Z'
    },
    soil_test_records: {
      id: 1,
      farm_id: 1,
      test_date: '2025-01-01',
      ph: 6.5,
      ec: 0.5,
      organic_carbon: 0.6,
      nitrogen: 250,
      phosphorus: 25,
      potassium: 300,
      created_at: '2025-01-15T00:00:00Z'
    },
    petiole_test_records: {
      id: 1,
      farm_id: 1,
      test_date: '2025-01-01',
      nitrogen: 2.5,
      phosphorus: 0.3,
      potassium: 1.5,
      created_at: '2025-01-15T00:00:00Z'
    }
  }

  describe('Farm Creation', () => {
    it('should create a new farm with valid data', async () => {
      const farmData: Omit<Farm, 'id' | 'created_at' | 'updated_at' | 'user_id'> = {
        name: 'Test Farm',
        location: 'Nashik',
        area: 5,
        area_unit: 'acre',
        grape_variety: 'Thompson Seedless',
        planting_date: '2023-01-15'
      } as any

      const result = await SupabaseService.createFarm(farmData)

      expect(result).toBeDefined()
      expect(result.name).toBe('Test Farm')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('farms')
    })

    it('should require authentication to create farm', async () => {
      mockSupabaseClient.auth.getUser = vi.fn(() => ({
        data: { user: null },
        error: null
      }))

      const farmData: any = {
        name: 'Test Farm',
        location: 'Nashik'
      }

      await expect(SupabaseService.createFarm(farmData)).rejects.toThrow('authenticated')
    })
  })

  describe('Irrigation Record Submission', () => {
    it('should create irrigation record with valid data', async () => {
      const record: Omit<IrrigationRecord, 'id' | 'created_at'> = {
        farm_id: 1,
        date: '2025-01-15',
        duration: 2.5,
        area: 5,
        growth_stage: 'flowering',
        moisture_status: 'moderate',
        system_discharge: 500,
        notes: 'Regular irrigation'
      } as any

      const result = await SupabaseService.addIrrigationRecord(record)

      expect(result).toBeDefined()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('irrigation_records')
    })

    it('should reject duration exceeding 24 hours', async () => {
      const record: any = {
        farm_id: 1,
        date: '2025-01-15',
        duration: 25,
        area: 5
      }

      await expect(SupabaseService.addIrrigationRecord(record)).rejects.toThrow(
        'Duration cannot exceed 24 hours'
      )
    })

    it('should reject negative duration', async () => {
      const record: any = {
        farm_id: 1,
        date: '2025-01-15',
        duration: -1,
        area: 5
      }

      await expect(SupabaseService.addIrrigationRecord(record)).rejects.toThrow(
        'Duration must be greater than 0'
      )
    })

    it('should reject zero duration', async () => {
      const record: any = {
        farm_id: 1,
        date: '2025-01-15',
        duration: 0,
        area: 5
      }

      await expect(SupabaseService.addIrrigationRecord(record)).rejects.toThrow(
        'Duration must be greater than 0'
      )
    })

    it('should reject area exceeding maximum', async () => {
      const record: any = {
        farm_id: 1,
        date: '2025-01-15',
        duration: 2,
        area: 30000
      }

      await expect(SupabaseService.addIrrigationRecord(record)).rejects.toThrow(
        'Area cannot exceed 25,000 acres'
      )
    })

    it('should reject negative area', async () => {
      const record: any = {
        farm_id: 1,
        date: '2025-01-15',
        duration: 2,
        area: -5
      }

      await expect(SupabaseService.addIrrigationRecord(record)).rejects.toThrow(
        'Area must be greater than 0'
      )
    })

    it('should reject system discharge exceeding maximum', async () => {
      const record: any = {
        farm_id: 1,
        date: '2025-01-15',
        duration: 2,
        area: 5,
        system_discharge: 15000
      }

      await expect(SupabaseService.addIrrigationRecord(record)).rejects.toThrow(
        'System discharge cannot exceed 10,000 L/h'
      )
    })

    it('should reject negative system discharge', async () => {
      const record: any = {
        farm_id: 1,
        date: '2025-01-15',
        duration: 2,
        area: 5,
        system_discharge: -100
      }

      await expect(SupabaseService.addIrrigationRecord(record)).rejects.toThrow(
        'System discharge must be greater than 0'
      )
    })

    it('should reject NaN values', async () => {
      const record: any = {
        farm_id: 1,
        date: '2025-01-15',
        duration: NaN,
        area: 5
      }

      await expect(SupabaseService.addIrrigationRecord(record)).rejects.toThrow(
        'must be greater than 0'
      )
    })

    it('should reject Infinity values', async () => {
      const record: any = {
        farm_id: 1,
        date: '2025-01-15',
        duration: Infinity,
        area: 5
      }

      await expect(SupabaseService.addIrrigationRecord(record)).rejects.toThrow()
    })
  })

  describe('Irrigation Record Update', () => {
    it('should update irrigation record with valid data', async () => {
      const updates: Partial<IrrigationRecord> = {
        duration: 3,
        notes: 'Updated notes'
      }

      const result = await SupabaseService.updateIrrigationRecord(1, updates)

      expect(result).toBeDefined()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('irrigation_records')
    })

    it('should validate duration on update', async () => {
      const updates: any = {
        duration: 30
      }

      await expect(SupabaseService.updateIrrigationRecord(1, updates)).rejects.toThrow(
        'Duration cannot exceed 24 hours'
      )
    })

    it('should validate area on update', async () => {
      const updates: any = {
        area: -10
      }

      await expect(SupabaseService.updateIrrigationRecord(1, updates)).rejects.toThrow(
        'Area must be greater than 0'
      )
    })

    it('should validate system discharge on update', async () => {
      const updates: any = {
        system_discharge: 20000
      }

      await expect(SupabaseService.updateIrrigationRecord(1, updates)).rejects.toThrow(
        'System discharge cannot exceed 10,000 L/h'
      )
    })
  })

  describe('Spray Record Submission', () => {
    it('should create spray record with valid chemical data', async () => {
      const record = {
        farm_id: 1,
        date: '2025-01-15',
        water_volume: 100,
        chemicals: [
          { name: 'Metalaxyl', quantity: 2, unit: 'gm/L' },
          { name: 'Bordeaux', quantity: 5, unit: 'ml/L' }
        ],
        notes: 'Disease prevention'
      } as any

      const result = await SupabaseService.addSprayRecord(record)

      expect(result).toBeDefined()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('spray_records')
    })
  })

  describe('Harvest Record Submission', () => {
    it('should create harvest record with valid data', async () => {
      const record = {
        farm_id: 1,
        date: '2025-01-15',
        quantity: 1000,
        grade: 'Grade A',
        price_per_kg: 50,
        buyer: 'Local Market',
        notes: 'Good quality harvest'
      } as any

      const result = await SupabaseService.addHarvestRecord(record)

      expect(result).toBeDefined()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('harvest_records')
    })
  })

  describe('Fertigation Record Submission', () => {
    it('should create fertigation record with valid fertilizer data', async () => {
      const record = {
        farm_id: 1,
        date: '2025-01-15',
        fertilizer: 'NPK 19:19:19',
        quantity: 10,
        unit: 'kg/acre',
        notes: 'Regular fertigation'
      } as any

      const result = await SupabaseService.addFertigationRecord(record)

      expect(result).toBeDefined()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('fertigation_records')
    })
  })

  describe('Expense Record Submission', () => {
    it('should create expense record with valid data', async () => {
      const record = {
        farm_id: 1,
        date: '2025-01-15',
        category: 'labor',
        description: 'Worker wages',
        cost: 5000,
        remarks: 'Monthly payment'
      } as any

      const result = await SupabaseService.addExpenseRecord(record)

      expect(result).toBeDefined()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('expense_records')
    })

    it('should accept all valid expense categories', async () => {
      const categories = ['labor', 'materials', 'equipment', 'other']

      for (const category of categories) {
        const record: any = {
          farm_id: 1,
          date: '2025-01-15',
          category,
          description: `${category} expense`,
          cost: 1000
        }

        const result = await SupabaseService.addExpenseRecord(record)
        expect(result).toBeDefined()
      }
    })
  })

  describe('Soil Test Record Submission', () => {
    it('should create soil test record with valid parameters', async () => {
      const record = {
        farm_id: 1,
        test_date: '2025-01-01',
        ph: 6.5,
        ec: 0.5,
        organic_carbon: 0.6,
        nitrogen: 250,
        phosphorus: 25,
        potassium: 300,
        calcium: 1500,
        magnesium: 200
      } as any

      const result = await SupabaseService.addSoilTestRecord(record)

      expect(result).toBeDefined()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('soil_test_records')
    })
  })

  describe('Petiole Test Record Submission', () => {
    it('should create petiole test record with valid parameters', async () => {
      const record = {
        farm_id: 1,
        date: '2025-01-01',
        parameters: {
          nitrogen: 2.5,
          phosphorus: 0.3,
          potassium: 1.5,
          calcium: 1.8,
          magnesium: 0.5
        }
      } as any

      const result = await SupabaseService.addPetioleTestRecord(record)

      expect(result).toBeDefined()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('petiole_test_records')
    })
  })

  describe('Farm Update', () => {
    it('should update farm with partial data', async () => {
      const updates: Partial<Farm> = {
        name: 'Updated Farm Name',
        area: 10
      }

      const result = await SupabaseService.updateFarm(1, updates)

      expect(result).toBeDefined()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('farms')
    })
  })

  describe('Delete Operations', () => {
    it('should delete irrigation record', async () => {
      await SupabaseService.deleteIrrigationRecord(1)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('irrigation_records')
    })

    it('should delete farm', async () => {
      await SupabaseService.deleteFarm(1)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('farms')
    })
  })

  describe('Error Handling', () => {
    it('should handle Supabase errors gracefully', async () => {
      mockSupabaseClient.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: { message: 'Database error', code: 'DB_ERROR' }
            }))
          }))
        }))
      }))

      const record: any = {
        farm_id: 1,
        date: '2025-01-15',
        duration: 2,
        area: 5
      }

      await expect(SupabaseService.addIrrigationRecord(record)).rejects.toThrow()
    })

    it('should handle authentication errors', async () => {
      mockSupabaseClient.auth.getUser = vi.fn(() => ({
        data: { user: null },
        error: { message: 'Not authenticated' }
      }))

      const farmData: any = {
        name: 'Test Farm'
      }

      await expect(SupabaseService.createFarm(farmData)).rejects.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle optional fields in irrigation record', async () => {
      const record: any = {
        farm_id: 1,
        date: '2025-01-15',
        duration: 2
        // area, system_discharge, notes are optional
      }

      const result = await SupabaseService.addIrrigationRecord(record)
      expect(result).toBeDefined()
    })

    it('should handle empty notes', async () => {
      const record: any = {
        farm_id: 1,
        date: '2025-01-15',
        duration: 2,
        area: 5,
        notes: ''
      }

      const result = await SupabaseService.addIrrigationRecord(record)
      expect(result).toBeDefined()
    })

    it('should handle very small valid durations', async () => {
      const record: any = {
        farm_id: 1,
        date: '2025-01-15',
        duration: 0.1,
        area: 5
      }

      const result = await SupabaseService.addIrrigationRecord(record)
      expect(result).toBeDefined()
    })

    it('should handle maximum valid duration', async () => {
      const record: any = {
        farm_id: 1,
        date: '2025-01-15',
        duration: 24,
        area: 5
      }

      const result = await SupabaseService.addIrrigationRecord(record)
      expect(result).toBeDefined()
    })
  })
})
