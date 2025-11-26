/**
 * Type definitions for Enterprise RBAC System
 * Role-Based Access Control for multi-tenant organizations
 */

import { Json } from './database'

// ============================================
// CORE ENUMS AND CONSTANTS
// ============================================

export const USER_ROLES = [
  'owner',
  'admin',
  'farm_manager',
  'supervisor',
  'field_worker',
  'consultant',
  'accountant',
  'viewer'
] as const

export type UserRole = (typeof USER_ROLES)[number]

export const ORGANIZATION_TYPES = ['individual', 'business', 'enterprise'] as const
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number]

export const SUBSCRIPTION_TIERS = ['free', 'business', 'enterprise'] as const
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number]

export const SUBSCRIPTION_STATUSES = ['active', 'suspended', 'cancelled', 'trial'] as const
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

export const MEMBER_STATUSES = ['active', 'inactive', 'suspended'] as const
export type MemberStatus = (typeof MEMBER_STATUSES)[number]

export const INVITATION_STATUSES = ['pending', 'accepted', 'declined', 'expired'] as const
export type InvitationStatus = (typeof INVITATION_STATUSES)[number]

export const PERMISSIONS = ['create', 'read', 'update', 'delete'] as const
export type Permission = (typeof PERMISSIONS)[number]

export const RESOURCE_TYPES = [
  'farms',
  'irrigation_records',
  'spray_records',
  'fertigation_records',
  'harvest_records',
  'expense_records',
  'task_reminders',
  'soil_test_records',
  'petiole_test_records',
  'calculation_history',
  'users',
  'reports',
  'ai_features',
  'calculators'
] as const
export type ResourceType = (typeof RESOURCE_TYPES)[number]

export const AUDIT_ACTIONS = [
  'create',
  'update',
  'delete',
  'export',
  'import',
  'invite',
  'remove',
  'login',
  'logout',
  'view'
] as const
export type AuditAction = (typeof AUDIT_ACTIONS)[number]

// ============================================
// ORGANIZATION TYPES
// ============================================

export interface Organization {
  id: string
  name: string
  type: OrganizationType

  // Subscription & Billing
  subscriptionTier: SubscriptionTier
  subscriptionStatus: SubscriptionStatus
  maxUsers: number
  maxFarms: number

  // Organization Details
  registrationNumber?: string | null
  taxId?: string | null
  address?: string | null
  contactEmail?: string | null
  contactPhone?: string | null

  // Features & Settings
  features: OrganizationFeatures
  settings: OrganizationSettings

  // Audit
  createdBy: string
  createdAt: Date | string
  updatedAt: Date | string

  // Metadata
  metadata: Record<string, any>
}

export interface OrganizationFeatures {
  sso?: boolean
  customRoles?: boolean
  advancedAnalytics?: boolean
  apiAccess?: boolean
  whiteLabel?: boolean
  auditLogs?: boolean
  bulkImport?: boolean
  advancedReporting?: boolean
  [key: string]: boolean | undefined
}

export interface OrganizationSettings {
  timezone?: string
  language?: string
  dateFormat?: string
  currency?: string
  notifications?: {
    email?: boolean
    sms?: boolean
    push?: boolean
  }
  [key: string]: any
}

export interface OrganizationInsert {
  name: string
  type: OrganizationType
  subscriptionTier?: SubscriptionTier
  subscriptionStatus?: SubscriptionStatus
  maxUsers?: number
  maxFarms?: number
  registrationNumber?: string
  taxId?: string
  address?: string
  contactEmail?: string
  contactPhone?: string
  features?: OrganizationFeatures
  settings?: OrganizationSettings
  createdBy: string
  metadata?: Record<string, any>
}

export interface OrganizationUpdate {
  name?: string
  type?: OrganizationType
  subscriptionTier?: SubscriptionTier
  subscriptionStatus?: SubscriptionStatus
  maxUsers?: number
  maxFarms?: number
  registrationNumber?: string
  taxId?: string
  address?: string
  contactEmail?: string
  contactPhone?: string
  features?: OrganizationFeatures
  settings?: OrganizationSettings
  metadata?: Record<string, any>
}

// ============================================
// ORGANIZATION MEMBER TYPES
// ============================================

export interface OrganizationMember {
  id: string
  organizationId: string
  userId: string

  // Role & Permissions
  role: UserRole
  customPermissions: Record<string, any>

  // Farm-level assignments
  assignedFarmIds: number[] | null

  // Status & Metadata
  status: MemberStatus
  invitedBy?: string | null
  joinedAt: Date | string
  lastActiveAt?: Date | string | null

  createdAt: Date | string
  updatedAt: Date | string
}

export interface OrganizationMemberInsert {
  organizationId: string
  userId: string
  role: UserRole
  customPermissions?: Record<string, any>
  assignedFarmIds?: number[] | null
  status?: MemberStatus
  invitedBy?: string
}

export interface OrganizationMemberUpdate {
  role?: UserRole
  customPermissions?: Record<string, any>
  assignedFarmIds?: number[] | null
  status?: MemberStatus
  lastActiveAt?: Date | string
}

// ============================================
// ORGANIZATION INVITATION TYPES
// ============================================

export interface OrganizationInvitation {
  id: string
  organizationId: string

  // Invitation details
  email: string
  role: UserRole
  assignedFarmIds: number[] | null

  // Status
  status: InvitationStatus
  token: string
  expiresAt: Date | string

  // Audit
  invitedBy: string
  acceptedBy?: string | null
  createdAt: Date | string
  acceptedAt?: Date | string | null

  // Metadata
  message?: string | null
  metadata: Record<string, any>
}

export interface OrganizationInvitationInsert {
  organizationId: string
  email: string
  role: UserRole
  assignedFarmIds?: number[] | null
  token: string
  expiresAt: Date | string
  invitedBy: string
  message?: string
  metadata?: Record<string, any>
}

export interface OrganizationInvitationUpdate {
  status?: InvitationStatus
  acceptedBy?: string
  acceptedAt?: Date | string
}

// ============================================
// AUDIT LOG TYPES
// ============================================

export interface AuditLog {
  id: string
  organizationId?: string | null
  farmId?: number | null

  // User & Action
  userId?: string | null
  userRole?: UserRole | null
  action: AuditAction

  // Resource Details
  resourceType: string
  resourceId?: string | null

  // Changes (for update actions)
  oldValues?: Record<string, any> | null
  newValues?: Record<string, any> | null

  // Context
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null

  // Metadata
  timestamp: Date | string
  metadata: Record<string, any>
}

export interface AuditLogInsert {
  organizationId?: string | null
  farmId?: number | null
  userId?: string | null
  userRole?: UserRole | null
  action: AuditAction
  resourceType: string
  resourceId?: string | null
  oldValues?: Record<string, any> | null
  newValues?: Record<string, any> | null
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
  metadata?: Record<string, any>
}

// ============================================
// ROLE PERMISSION TYPES
// ============================================

export interface PermissionMatrix {
  farms: ResourcePermissions
  irrigation_records: ResourcePermissions
  spray_records: ResourcePermissions
  fertigation_records: ResourcePermissions
  harvest_records: ResourcePermissions
  expense_records: ResourcePermissions
  task_reminders: ResourcePermissions
  soil_test_records: ResourcePermissions
  petiole_test_records: ResourcePermissions
  users: UserManagementPermissions
  reports: ReportPermissions
  ai_features: AIFeaturePermissions
  calculators: CalculatorPermissions
}

export interface ResourcePermissions {
  create: boolean
  read: boolean
  update: boolean
  delete: boolean
}

export interface UserManagementPermissions {
  invite: boolean
  manage: boolean
  remove: boolean
}

export interface ReportPermissions {
  generate: boolean
  export: boolean
}

export interface AIFeaturePermissions {
  chat: boolean
  disease_detection: boolean
  analytics: boolean
}

export interface CalculatorPermissions {
  basic: boolean
  advanced: boolean
}

export interface RolePermission {
  id: string
  organizationId: string
  roleName: string
  roleType: 'system' | 'custom'
  permissions: PermissionMatrix
  description?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface RolePermissionInsert {
  organizationId: string
  roleName: string
  roleType: 'system' | 'custom'
  permissions: PermissionMatrix
  description?: string
}

export interface RolePermissionUpdate {
  roleName?: string
  permissions?: PermissionMatrix
  description?: string
}

// ============================================
// EXTENDED FARM TYPES (with Organization)
// ============================================

export interface FarmWithOrganization {
  id: number
  name: string
  region: string
  area: number
  grapeVariety: string
  plantingDate: string
  vineSpacing: number
  rowSpacing: number
  dateOfPruning?: string | null
  userId: string
  createdAt: string
  updatedAt: string

  // New organization fields
  organizationId?: string | null
  visibility: 'private' | 'org_wide'
  farmManagerIds: string[] | null
  metadata: Record<string, any>
}

// ============================================
// PERMISSION CHECK TYPES
// ============================================

export interface PermissionCheckContext {
  userId: string
  organizationId?: string | null
  farmId?: number
  resource: ResourceType
  permission: Permission
}

export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
  role?: UserRole
}

// ============================================
// ROLE DESCRIPTIONS
// ============================================

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  owner: 'Full control over organization including billing and deletion',
  admin: 'Administrative control without billing access',
  farm_manager: 'Full access to assigned farms and operations',
  supervisor: 'Operational control with data entry and task management',
  field_worker: 'Task execution and basic data entry',
  consultant: 'Advisory access with read-only operations and test result entry',
  accountant: 'Financial data access and expense management',
  viewer: 'Read-only access to dashboards and reports'
}

// ============================================
// ROLE PERMISSIONS MATRIX
// ============================================

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, PermissionMatrix> = {
  owner: {
    farms: { create: true, read: true, update: true, delete: true },
    irrigation_records: { create: true, read: true, update: true, delete: true },
    spray_records: { create: true, read: true, update: true, delete: true },
    fertigation_records: { create: true, read: true, update: true, delete: true },
    harvest_records: { create: true, read: true, update: true, delete: true },
    expense_records: { create: true, read: true, update: true, delete: true },
    task_reminders: { create: true, read: true, update: true, delete: true },
    soil_test_records: { create: true, read: true, update: true, delete: true },
    petiole_test_records: { create: true, read: true, update: true, delete: true },
    users: { invite: true, manage: true, remove: true },
    reports: { generate: true, export: true },
    ai_features: { chat: true, disease_detection: true, analytics: true },
    calculators: { basic: true, advanced: true }
  },
  admin: {
    farms: { create: true, read: true, update: true, delete: true },
    irrigation_records: { create: true, read: true, update: true, delete: true },
    spray_records: { create: true, read: true, update: true, delete: true },
    fertigation_records: { create: true, read: true, update: true, delete: true },
    harvest_records: { create: true, read: true, update: true, delete: true },
    expense_records: { create: true, read: true, update: true, delete: true },
    task_reminders: { create: true, read: true, update: true, delete: true },
    soil_test_records: { create: true, read: true, update: true, delete: true },
    petiole_test_records: { create: true, read: true, update: true, delete: true },
    users: { invite: true, manage: true, remove: true },
    reports: { generate: true, export: true },
    ai_features: { chat: true, disease_detection: true, analytics: true },
    calculators: { basic: true, advanced: true }
  },
  farm_manager: {
    farms: { create: false, read: true, update: true, delete: false },
    irrigation_records: { create: true, read: true, update: true, delete: true },
    spray_records: { create: true, read: true, update: true, delete: true },
    fertigation_records: { create: true, read: true, update: true, delete: true },
    harvest_records: { create: true, read: true, update: true, delete: true },
    expense_records: { create: true, read: true, update: true, delete: true },
    task_reminders: { create: true, read: true, update: true, delete: true },
    soil_test_records: { create: true, read: true, update: true, delete: true },
    petiole_test_records: { create: true, read: true, update: true, delete: true },
    users: { invite: false, manage: false, remove: false },
    reports: { generate: true, export: true },
    ai_features: { chat: true, disease_detection: true, analytics: true },
    calculators: { basic: true, advanced: true }
  },
  supervisor: {
    farms: { create: false, read: true, update: false, delete: false },
    irrigation_records: { create: true, read: true, update: true, delete: false },
    spray_records: { create: true, read: true, update: true, delete: false },
    fertigation_records: { create: true, read: true, update: true, delete: false },
    harvest_records: { create: true, read: true, update: true, delete: false },
    expense_records: { create: true, read: true, update: true, delete: false },
    task_reminders: { create: true, read: true, update: true, delete: false },
    soil_test_records: { create: true, read: true, update: true, delete: false },
    petiole_test_records: { create: true, read: true, update: true, delete: false },
    users: { invite: false, manage: false, remove: false },
    reports: { generate: true, export: false },
    ai_features: { chat: true, disease_detection: true, analytics: false },
    calculators: { basic: true, advanced: true }
  },
  field_worker: {
    farms: { create: false, read: true, update: false, delete: false },
    irrigation_records: { create: true, read: true, update: false, delete: false },
    spray_records: { create: true, read: true, update: false, delete: false },
    fertigation_records: { create: true, read: true, update: false, delete: false },
    harvest_records: { create: true, read: true, update: false, delete: false },
    expense_records: { create: false, read: true, update: false, delete: false },
    task_reminders: { create: false, read: true, update: true, delete: false },
    soil_test_records: { create: false, read: true, update: false, delete: false },
    petiole_test_records: { create: false, read: true, update: false, delete: false },
    users: { invite: false, manage: false, remove: false },
    reports: { generate: false, export: false },
    ai_features: { chat: false, disease_detection: false, analytics: false },
    calculators: { basic: true, advanced: false }
  },
  consultant: {
    farms: { create: false, read: true, update: false, delete: false },
    irrigation_records: { create: false, read: true, update: false, delete: false },
    spray_records: { create: false, read: true, update: false, delete: false },
    fertigation_records: { create: false, read: true, update: false, delete: false },
    harvest_records: { create: false, read: true, update: false, delete: false },
    expense_records: { create: false, read: false, update: false, delete: false },
    task_reminders: { create: false, read: true, update: false, delete: false },
    soil_test_records: { create: true, read: true, update: true, delete: false },
    petiole_test_records: { create: true, read: true, update: true, delete: false },
    users: { invite: false, manage: false, remove: false },
    reports: { generate: true, export: true },
    ai_features: { chat: true, disease_detection: true, analytics: true },
    calculators: { basic: true, advanced: true }
  },
  accountant: {
    farms: { create: false, read: true, update: false, delete: false },
    irrigation_records: { create: false, read: true, update: false, delete: false },
    spray_records: { create: false, read: true, update: false, delete: false },
    fertigation_records: { create: false, read: true, update: false, delete: false },
    harvest_records: { create: false, read: true, update: false, delete: false },
    expense_records: { create: true, read: true, update: true, delete: true },
    task_reminders: { create: false, read: true, update: false, delete: false },
    soil_test_records: { create: false, read: true, update: false, delete: false },
    petiole_test_records: { create: false, read: true, update: false, delete: false },
    users: { invite: false, manage: false, remove: false },
    reports: { generate: true, export: true },
    ai_features: { chat: false, disease_detection: false, analytics: false },
    calculators: { basic: true, advanced: true }
  },
  viewer: {
    farms: { create: false, read: true, update: false, delete: false },
    irrigation_records: { create: false, read: true, update: false, delete: false },
    spray_records: { create: false, read: true, update: false, delete: false },
    fertigation_records: { create: false, read: true, update: false, delete: false },
    harvest_records: { create: false, read: true, update: false, delete: false },
    expense_records: { create: false, read: true, update: false, delete: false },
    task_reminders: { create: false, read: true, update: false, delete: false },
    soil_test_records: { create: false, read: true, update: false, delete: false },
    petiole_test_records: { create: false, read: true, update: false, delete: false },
    users: { invite: false, manage: false, remove: false },
    reports: { generate: false, export: false },
    ai_features: { chat: false, disease_detection: false, analytics: false },
    calculators: { basic: false, advanced: false }
  }
}

// ============================================
// UTILITY TYPES
// ============================================

export interface OrganizationWithMembers extends Organization {
  members: OrganizationMember[]
  memberCount: number
  farmCount: number
}

export interface UserWithOrganizations {
  userId: string
  organizations: Array<{
    organization: Organization
    membership: OrganizationMember
  }>
}

export interface FarmAccessInfo {
  farmId: number
  canAccess: boolean
  role?: UserRole
  permissions: ResourcePermissions
}
