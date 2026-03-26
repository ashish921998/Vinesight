import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TemplateService } from '../template-service'
import { getTypedSupabaseClient } from '../supabase'

vi.mock('../supabase', () => ({
  getTypedSupabaseClient: vi.fn()
}))

describe('TemplateService', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } })
      },
      from: vi.fn()
    }

    vi.mocked(getTypedSupabaseClient).mockResolvedValue(mockSupabase)
  })

  describe('getTemplates', () => {
    it('fetches all templates for org', async () => {
      const mockTemplates = [
        { id: 'template-1', name: 'Spring NPK', is_active: true, season_stage: 'flowering' }
      ]

      const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn().mockResolvedValue({ data: mockTemplates, error: null })
      }
      mockSupabase.from.mockReturnValue(chain)

      const result = await TemplateService.getTemplates('org-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('plan_templates')
      expect(chain.eq).toHaveBeenCalledWith('organization_id', 'org-123')
      expect(result).toEqual(mockTemplates)
    })
  })

  describe('getActiveTemplates', () => {
    it('fetches only active templates', async () => {
      const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn(() => chain)
      }
      // Second order call returns the result
      chain.order.mockReturnValueOnce(chain).mockResolvedValueOnce({ data: [], error: null })
      mockSupabase.from.mockReturnValue(chain)

      await TemplateService.getActiveTemplates('org-123')

      expect(chain.eq).toHaveBeenCalledWith('is_active', true)
    })
  })

  describe('createTemplate', () => {
    it('creates template with valid items', async () => {
      const mockCreated = { id: 'new-template', name: 'Test Template' }
      const chain: any = {
        insert: vi.fn(() => chain),
        select: vi.fn(() => chain),
        single: vi.fn().mockResolvedValue({ data: mockCreated, error: null })
      }
      mockSupabase.from.mockReturnValue(chain)

      const result = await TemplateService.createTemplate('org-123', 'user-123', {
        name: 'Test Template',
        season_stage: 'flowering',
        trigger_conditions: { n_min: 0.5, p_min: 0.3 },
        template_items: [
          {
            fertilizer_name: '19:19:19',
            base_quantity: 5,
            unit: 'kg/acre',
            method: 'soil',
            frequency: 1
          }
        ]
      })

      expect(result).toEqual(mockCreated)
    })

    it('rejects empty template items', async () => {
      await expect(
        TemplateService.createTemplate('org-123', 'user-123', {
          name: 'Test',
          season_stage: 'flowering',
          trigger_conditions: {},
          template_items: []
        })
      ).rejects.toThrow('Template must have at least one fertilizer item')
    })
  })

  describe('getTemplateCoverageStats', () => {
    it('calculates coverage by season and soil', async () => {
      const mockTemplates = [
        { season_stage: 'flowering', soil_type: 'loamy', is_active: true },
        { season_stage: 'flowering', soil_type: 'clay', is_active: true },
        { season_stage: 'pruning', soil_type: null, is_active: false }
      ]

      const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn().mockResolvedValue({ data: mockTemplates, error: null })
      }
      mockSupabase.from.mockReturnValue(chain)

      const stats = await TemplateService.getTemplateCoverageStats('org-123')

      expect(stats.total).toBe(3)
      expect(stats.active).toBe(2)
      expect(stats.by_season.flowering).toBe(2)
      expect(stats.by_season.pruning).toBe(1)
      expect(stats.by_soil.loamy).toBe(1)
      expect(stats.by_soil.clay).toBe(1)
    })

    it('handles empty templates', async () => {
      const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      }
      mockSupabase.from.mockReturnValue(chain)

      const stats = await TemplateService.getTemplateCoverageStats('org-123')

      expect(stats.total).toBe(0)
      expect(stats.active).toBe(0)
    })
  })

  describe('duplicateTemplate', () => {
    it('duplicates template with new name', async () => {
      const existingTemplate = {
        id: 'template-1',
        organization_id: 'org-123',
        created_by: 'user-1',
        name: 'Original',
        season_stage: 'flowering',
        soil_type: 'loamy',
        trigger_conditions: { n_min: 0.5 },
        template_items: [{ fertilizer_name: '19:19:19', base_quantity: 5 }],
        is_active: true,
        created_at: '2026-01-01',
        updated_at: '2026-01-01'
      }

      const selectChain: any = {
        select: vi.fn(() => selectChain),
        eq: vi.fn(() => selectChain),
        single: vi.fn().mockResolvedValue({ data: existingTemplate, error: null })
      }

      const insertChain: any = {
        insert: vi.fn(() => insertChain),
        select: vi.fn(() => insertChain),
        single: vi.fn().mockResolvedValue({ data: { id: 'new-template' }, error: null })
      }

      mockSupabase.from
        .mockReturnValueOnce(selectChain) // getTemplateById
        .mockReturnValueOnce(insertChain) // insert duplicate

      const result = await TemplateService.duplicateTemplate('template-1', 'Copy of Original')

      expect(result).toEqual({ id: 'new-template' })
    })

    it('throws when template not found', async () => {
      const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      }
      mockSupabase.from.mockReturnValue(chain)

      await expect(TemplateService.duplicateTemplate('non-existent', 'Copy')).rejects.toThrow(
        'Template not found'
      )
    })
  })
})
