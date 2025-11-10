/**
 * Functional Tests for Organization Service
 * Tests the organization CRUD operations and business logic
 */

import { OrganizationService } from '@/lib/organization-service'
import type {
  Organization,
  OrganizationMember,
  OrganizationInvitation,
  UserRole
} from '@/types/rbac'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn()
  }
}

describe('Organization Service - Functional Tests', () => {
  let orgService: OrganizationService
  let mockFrom: jest.Mock
  let mockSelect: jest.Mock
  let mockInsert: jest.Mock
  let mockUpdate: jest.Mock
  let mockDelete: jest.Mock
  let mockEq: jest.Mock
  let mockSingle: jest.Mock

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Setup mock chain
    mockSingle = jest.fn()
    mockEq = jest.fn().mockReturnValue({ single: mockSingle })
    mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
    mockInsert = jest.fn().mockReturnValue({ select: mockSelect, single: mockSingle })
    mockUpdate = jest.fn().mockReturnValue({ eq: mockEq })
    mockDelete = jest.fn().mockReturnValue({ eq: mockEq })
    mockFrom = jest.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq
    })

    mockSupabaseClient.from = mockFrom
    mockSupabaseClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    })

    orgService = new OrganizationService(mockSupabaseClient as any)
  })

  describe('createOrganization', () => {
    test('should create organization with valid data', async () => {
      const orgData = {
        name: 'Test Farm Co',
        description: 'A test farming organization',
        industry: 'agriculture' as const,
        size: 'small' as const
      }

      const mockOrg: Organization = {
        id: 'org-123',
        ...orgData,
        ownerId: 'test-user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockSingle.mockResolvedValue({ data: mockOrg, error: null })

      const result = await orgService.createOrganization(orgData)

      expect(result).toEqual(mockOrg)
      expect(mockFrom).toHaveBeenCalledWith('organizations')
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        name: orgData.name,
        description: orgData.description,
        ownerId: 'test-user-id'
      }))
    })

    test('should throw error when organization name is empty', async () => {
      const orgData = {
        name: '',
        description: 'Test',
        industry: 'agriculture' as const,
        size: 'small' as const
      }

      await expect(orgService.createOrganization(orgData)).rejects.toThrow()
    })

    test('should throw error when organization name is too long', async () => {
      const orgData = {
        name: 'A'.repeat(256),
        description: 'Test',
        industry: 'agriculture' as const,
        size: 'small' as const
      }

      await expect(orgService.createOrganization(orgData)).rejects.toThrow()
    })

    test('should handle database errors gracefully', async () => {
      const orgData = {
        name: 'Test Org',
        description: 'Test',
        industry: 'agriculture' as const,
        size: 'small' as const
      }

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      await expect(orgService.createOrganization(orgData)).rejects.toThrow('Database error')
    })
  })

  describe('addMember', () => {
    test('should add member with valid role', async () => {
      const memberData = {
        organizationId: 'org-123',
        userId: 'user-456',
        role: 'farm_manager' as UserRole,
        assignedFarmIds: [1, 2, 3]
      }

      const mockMember: OrganizationMember = {
        id: 'member-789',
        ...memberData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockSingle.mockResolvedValue({ data: mockMember, error: null })

      const result = await orgService.addMember(memberData)

      expect(result).toEqual(mockMember)
      expect(mockFrom).toHaveBeenCalledWith('organization_members')
      expect(mockInsert).toHaveBeenCalledWith(memberData)
    })

    test('should reject invalid role', async () => {
      const memberData = {
        organizationId: 'org-123',
        userId: 'user-456',
        role: 'invalid_role' as any,
        assignedFarmIds: []
      }

      await expect(orgService.addMember(memberData)).rejects.toThrow()
    })

    test('should validate assigned farm IDs are numbers', async () => {
      const memberData = {
        organizationId: 'org-123',
        userId: 'user-456',
        role: 'field_worker' as UserRole,
        assignedFarmIds: ['not', 'numbers'] as any
      }

      await expect(orgService.addMember(memberData)).rejects.toThrow()
    })
  })

  describe('createInvitation', () => {
    test('should create invitation with valid email and role', async () => {
      const invitationData = {
        organizationId: 'org-123',
        email: 'newuser@example.com',
        role: 'supervisor' as UserRole,
        assignedFarmIds: [1, 2]
      }

      const mockInvitation: OrganizationInvitation = {
        id: 'inv-456',
        ...invitationData,
        token: 'abc123def456',
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        invitedBy: 'test-user-id'
      }

      mockSingle.mockResolvedValue({ data: mockInvitation, error: null })

      const result = await orgService.createInvitation(invitationData)

      expect(result).toEqual(mockInvitation)
      expect(mockFrom).toHaveBeenCalledWith('organization_invitations')
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        organizationId: invitationData.organizationId,
        email: invitationData.email,
        role: invitationData.role,
        invitedBy: 'test-user-id'
      }))
    })

    test('should reject invalid email format', async () => {
      const invitationData = {
        organizationId: 'org-123',
        email: 'not-an-email',
        role: 'viewer' as UserRole,
        assignedFarmIds: []
      }

      await expect(orgService.createInvitation(invitationData)).rejects.toThrow()
    })

    test('should generate unique invitation token', async () => {
      const calls: any[] = []
      mockInsert.mockImplementation((data) => {
        calls.push(data)
        return { select: mockSelect, single: mockSingle }
      })

      mockSingle.mockResolvedValue({
        data: { token: 'generated-token' },
        error: null
      })

      await orgService.createInvitation({
        organizationId: 'org-123',
        email: 'user1@example.com',
        role: 'viewer',
        assignedFarmIds: []
      })

      await orgService.createInvitation({
        organizationId: 'org-123',
        email: 'user2@example.com',
        role: 'viewer',
        assignedFarmIds: []
      })

      expect(calls.length).toBe(2)
      expect(calls[0].token).toBeDefined()
      expect(calls[1].token).toBeDefined()
      // Tokens should be different
      expect(calls[0].token).not.toEqual(calls[1].token)
    })

    test('should set expiration to 7 days from now', async () => {
      const now = Date.now()
      const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000

      mockInsert.mockImplementation((data) => {
        const expiresAt = new Date(data.expiresAt)
        expect(expiresAt.getTime()).toBeGreaterThanOrEqual(sevenDaysFromNow - 1000)
        expect(expiresAt.getTime()).toBeLessThanOrEqual(sevenDaysFromNow + 1000)
        return { select: mockSelect, single: mockSingle }
      })

      mockSingle.mockResolvedValue({
        data: { id: 'inv-123' },
        error: null
      })

      await orgService.createInvitation({
        organizationId: 'org-123',
        email: 'test@example.com',
        role: 'viewer',
        assignedFarmIds: []
      })

      expect(mockInsert).toHaveBeenCalled()
    })
  })

  describe('updateMemberRole', () => {
    test('should update member role', async () => {
      const memberId = 'member-123'
      const newRole: UserRole = 'farm_manager'

      mockEq.mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: memberId, role: newRole },
          error: null
        })
      })

      await orgService.updateMemberRole(memberId, newRole)

      expect(mockFrom).toHaveBeenCalledWith('organization_members')
      expect(mockUpdate).toHaveBeenCalledWith({ role: newRole })
      expect(mockEq).toHaveBeenCalledWith('id', memberId)
    })

    test('should not allow updating to invalid role', async () => {
      const memberId = 'member-123'
      const invalidRole = 'super_admin' as any

      await expect(
        orgService.updateMemberRole(memberId, invalidRole)
      ).rejects.toThrow()
    })
  })

  describe('removeMember', () => {
    test('should remove member from organization', async () => {
      const memberId = 'member-123'

      mockEq.mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: {}, error: null })
      })

      await orgService.removeMember(memberId)

      expect(mockFrom).toHaveBeenCalledWith('organization_members')
      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', memberId)
    })

    test('should throw error when member not found', async () => {
      const memberId = 'nonexistent-member'

      mockEq.mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Member not found' }
        })
      })

      await expect(orgService.removeMember(memberId)).rejects.toThrow('Member not found')
    })
  })

  describe('Business Logic Validation', () => {
    test('viewer role should not have assigned farms', async () => {
      const memberData = {
        organizationId: 'org-123',
        userId: 'user-456',
        role: 'viewer' as UserRole,
        assignedFarmIds: [1, 2, 3] // Viewers shouldn't have assigned farms
      }

      // This should either throw or clear assigned farms
      await expect(
        orgService.addMember(memberData)
      ).rejects.toThrow(/viewer.*assigned farms/i)
    })

    test('owner role should have access to all farms', async () => {
      // Owner shouldn't need assigned_farm_ids
      const memberData = {
        organizationId: 'org-123',
        userId: 'user-456',
        role: 'owner' as UserRole,
        assignedFarmIds: [] // Empty is OK for owner
      }

      mockSingle.mockResolvedValue({
        data: { ...memberData, id: 'member-123' },
        error: null
      })

      const result = await orgService.addMember(memberData)
      expect(result).toBeDefined()
    })

    test('cannot invite same email twice to same organization', async () => {
      const invitationData = {
        organizationId: 'org-123',
        email: 'duplicate@example.com',
        role: 'viewer' as UserRole,
        assignedFarmIds: []
      }

      mockSingle
        .mockResolvedValueOnce({
          data: { id: 'inv-1' },
          error: null
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Duplicate invitation', code: '23505' }
        })

      await orgService.createInvitation(invitationData)

      await expect(
        orgService.createInvitation(invitationData)
      ).rejects.toThrow()
    })
  })
})
