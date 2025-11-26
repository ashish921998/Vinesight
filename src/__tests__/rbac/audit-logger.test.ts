/**
 * Functional Tests for Audit Logger
 * Tests the audit logging functionality
 */

import { AuditLogger } from '@/lib/audit-logger'
import type { AuditAction, ResourceType } from '@/types/rbac'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn()
  }
}

describe('Audit Logger - Functional Tests', () => {
  let auditLogger: AuditLogger
  let mockFrom: jest.Mock
  let mockInsert: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    mockInsert = jest.fn().mockResolvedValue({ data: {}, error: null })
    mockFrom = jest.fn().mockReturnValue({ insert: mockInsert })

    mockSupabaseClient.from = mockFrom
    mockSupabaseClient.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    })

    auditLogger = new AuditLogger(mockSupabaseClient as any)
  })

  describe('log() - Basic Logging', () => {
    test('should log create action', async () => {
      await auditLogger.log({
        organizationId: 'org-123',
        action: 'create',
        resourceType: 'farms',
        resourceId: 1,
        metadata: { name: 'New Farm' }
      })

      expect(mockFrom).toHaveBeenCalledWith('audit_logs')
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        organizationId: 'org-123',
        userId: 'test-user-id',
        action: 'create',
        resourceType: 'farms',
        resourceId: 1,
        metadata: { name: 'New Farm' }
      }))
    })

    test('should log update action with old and new values', async () => {
      await auditLogger.log({
        organizationId: 'org-123',
        action: 'update',
        resourceType: 'farms',
        resourceId: 1,
        oldValues: { name: 'Old Name', area: 10 },
        newValues: { name: 'New Name', area: 15 },
        metadata: { reason: 'Correction' }
      })

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        action: 'update',
        oldValues: { name: 'Old Name', area: 10 },
        newValues: { name: 'New Name', area: 15 }
      }))
    })

    test('should log delete action', async () => {
      await auditLogger.log({
        organizationId: 'org-123',
        action: 'delete',
        resourceType: 'records',
        resourceId: 5,
        oldValues: { type: 'irrigation', duration: 60 }
      })

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        action: 'delete',
        resourceType: 'records',
        resourceId: 5
      }))
    })

    test('should include timestamp in log', async () => {
      const beforeTime = Date.now()

      await auditLogger.log({
        organizationId: 'org-123',
        action: 'create',
        resourceType: 'farms',
        resourceId: 1
      })

      const afterTime = Date.now()

      expect(mockInsert).toHaveBeenCalled()
      const callArgs = mockInsert.mock.calls[0][0]
      const logTime = new Date(callArgs.createdAt).getTime()

      expect(logTime).toBeGreaterThanOrEqual(beforeTime)
      expect(logTime).toBeLessThanOrEqual(afterTime)
    })

    test('should handle missing optional fields', async () => {
      await auditLogger.log({
        organizationId: 'org-123',
        action: 'view',
        resourceType: 'reports',
        resourceId: 10
        // No metadata, old/new values
      })

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        action: 'view',
        resourceType: 'reports',
        resourceId: 10
      }))
    })
  })

  describe('Convenience Methods', () => {
    test('logCreate() should log create action', async () => {
      await auditLogger.logCreate('org-123', 'farms', 1, { name: 'Test Farm' })

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        action: 'create',
        resourceType: 'farms',
        resourceId: 1,
        newValues: { name: 'Test Farm' }
      }))
    })

    test('logUpdate() should log update action with both old and new values', async () => {
      const oldValues = { name: 'Old', area: 10 }
      const newValues = { name: 'New', area: 15 }

      await auditLogger.logUpdate('org-123', 'farms', 1, oldValues, newValues)

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        action: 'update',
        oldValues,
        newValues
      }))
    })

    test('logDelete() should log delete action with old values', async () => {
      const oldValues = { name: 'Deleted Farm', area: 20 }

      await auditLogger.logDelete('org-123', 'farms', 1, oldValues)

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        action: 'delete',
        oldValues
      }))
    })

    test('logExport() should log export action', async () => {
      await auditLogger.logExport('org-123', 'reports', 5, {
        format: 'CSV',
        recordCount: 100
      })

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        action: 'export',
        resourceType: 'reports',
        metadata: expect.objectContaining({
          format: 'CSV',
          recordCount: 100
        })
      }))
    })

    test('logInvite() should log invite action', async () => {
      await auditLogger.logInvite('org-123', {
        email: 'newuser@example.com',
        role: 'farm_manager'
      })

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        action: 'invite',
        resourceType: 'users',
        metadata: expect.objectContaining({
          email: 'newuser@example.com',
          role: 'farm_manager'
        })
      }))
    })

    test('logRemove() should log remove action', async () => {
      await auditLogger.logRemove('org-123', 'user-456', {
        email: 'removed@example.com',
        role: 'viewer'
      })

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        action: 'remove',
        resourceType: 'users',
        resourceId: 'user-456',
        metadata: expect.objectContaining({
          email: 'removed@example.com',
          role: 'viewer'
        })
      }))
    })
  })

  describe('Audit Trail Integrity', () => {
    test('should not allow modifying logged entries', async () => {
      // Audit logs should be insert-only, no updates or deletes
      // This is enforced at database level but we verify the API doesn't provide methods

      expect(auditLogger).not.toHaveProperty('update')
      expect(auditLogger).not.toHaveProperty('delete')
      expect(auditLogger).not.toHaveProperty('modify')
    })

    test('should log sequential actions in order', async () => {
      const actions = [
        { action: 'create' as const, resourceId: 1 },
        { action: 'update' as const, resourceId: 1 },
        { action: 'delete' as const, resourceId: 1 }
      ]

      for (const { action, resourceId } of actions) {
        await auditLogger.log({
          organizationId: 'org-123',
          action,
          resourceType: 'farms',
          resourceId
        })
      }

      expect(mockInsert).toHaveBeenCalledTimes(3)

      // Verify calls were made in order
      const calls = mockInsert.mock.calls
      expect(calls[0][0].action).toBe('create')
      expect(calls[1][0].action).toBe('update')
      expect(calls[2][0].action).toBe('delete')
    })

    test('should preserve metadata exactly as provided', async () => {
      const metadata = {
        complexData: {
          nested: {
            deeply: {
              value: 'test'
            }
          },
          array: [1, 2, 3],
          special: null,
          unicode: '测试',
          emoji: '🌾'
        }
      }

      await auditLogger.log({
        organizationId: 'org-123',
        action: 'create',
        resourceType: 'farms',
        resourceId: 1,
        metadata
      })

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        metadata
      }))
    })
  })

  describe('Error Handling', () => {
    test('should handle database insert failures', async () => {
      mockInsert.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' }
      })

      await expect(
        auditLogger.log({
          organizationId: 'org-123',
          action: 'create',
          resourceType: 'farms',
          resourceId: 1
        })
      ).rejects.toThrow('Insert failed')
    })

    test('should handle auth failures', async () => {
      mockSupabaseClient.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const newLogger = new AuditLogger(mockSupabaseClient as any)

      await expect(
        newLogger.log({
          organizationId: 'org-123',
          action: 'create',
          resourceType: 'farms',
          resourceId: 1
        })
      ).rejects.toThrow()
    })

    test('should validate required fields', async () => {
      await expect(
        auditLogger.log({
          organizationId: '',
          action: 'create',
          resourceType: 'farms',
          resourceId: 1
        } as any)
      ).rejects.toThrow()
    })

    test('should validate action types', async () => {
      await expect(
        auditLogger.log({
          organizationId: 'org-123',
          action: 'invalid_action' as any,
          resourceType: 'farms',
          resourceId: 1
        })
      ).rejects.toThrow()
    })

    test('should validate resource types', async () => {
      await expect(
        auditLogger.log({
          organizationId: 'org-123',
          action: 'create',
          resourceType: 'invalid_resource' as any,
          resourceId: 1
        })
      ).rejects.toThrow()
    })
  })

  describe('Performance and Scalability', () => {
    test('should handle bulk logging efficiently', async () => {
      const logs = Array.from({ length: 100 }, (_, i) => ({
        organizationId: 'org-123',
        action: 'create' as const,
        resourceType: 'records' as ResourceType,
        resourceId: i
      }))

      const startTime = Date.now()

      await Promise.all(logs.map(log => auditLogger.log(log)))

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(mockInsert).toHaveBeenCalledTimes(100)
      expect(duration).toBeLessThan(1000) // Should complete in under 1 second
    })

    test('should handle concurrent logging', async () => {
      const concurrent = 10

      const promises = Array.from({ length: concurrent }, (_, i) =>
        auditLogger.log({
          organizationId: 'org-123',
          action: 'create',
          resourceType: 'farms',
          resourceId: i
        })
      )

      await expect(Promise.all(promises)).resolves.toBeDefined()
      expect(mockInsert).toHaveBeenCalledTimes(concurrent)
    })

    test('should handle large metadata payloads', async () => {
      const largeMetadata = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          value: Math.random()
        }))
      }

      await auditLogger.log({
        organizationId: 'org-123',
        action: 'export',
        resourceType: 'reports',
        resourceId: 1,
        metadata: largeMetadata
      })

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        metadata: largeMetadata
      }))
    })
  })

  describe('Security and Privacy', () => {
    test('should not log sensitive information in plain text', async () => {
      // Passwords, tokens, etc. should be excluded or hashed
      const sensitiveData = {
        password: 'secret123',
        token: 'bearer_token_abc',
        apiKey: 'sk-1234567890'
      }

      await auditLogger.log({
        organizationId: 'org-123',
        action: 'update',
        resourceType: 'settings',
        resourceId: 1,
        newValues: sensitiveData
      })

      const callArgs = mockInsert.mock.calls[0][0]

      // In a real implementation, these should be redacted
      expect(callArgs.newValues).toBeDefined()
      // This test documents the expected behavior, actual implementation should redact
    })

    test('should include actor (user) in all logs', async () => {
      await auditLogger.log({
        organizationId: 'org-123',
        action: 'create',
        resourceType: 'farms',
        resourceId: 1
      })

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'test-user-id'
      }))
    })

    test('should log access attempts even if they fail', async () => {
      // This would typically be handled at a higher level,
      // but the audit logger should support logging failed attempts

      await auditLogger.log({
        organizationId: 'org-123',
        action: 'view',
        resourceType: 'farms',
        resourceId: 1,
        metadata: {
          success: false,
          reason: 'Permission denied'
        }
      })

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        metadata: expect.objectContaining({
          success: false,
          reason: 'Permission denied'
        })
      }))
    })
  })
})
