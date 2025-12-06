# RBAC System Functional Tests

This directory contains comprehensive functional tests for the VineSight RBAC (Role-Based Access Control) system.

## Overview

These tests validate the business logic, permissions, and security of the enterprise multi-tenant RBAC system **without** testing UI components. They focus on:

- Permission checking logic
- Organization service operations
- Database helper functions and RLS policies
- Audit logging functionality

## Test Files

### 1. `permissions.test.ts`
Tests the core permission matrix and role hierarchy.

**Coverage:**
- All 8 user roles (owner, admin, farm_manager, supervisor, field_worker, consultant, accountant, viewer)
- Permission validation for all resources (farms, records, users, settings, reports)
- Role hierarchy and permission inheritance
- Edge cases and validation

**Key Test Suites:**
- Role Permission Matrix
- Permission Hierarchy
- Resource-Specific Permissions
- Edge Cases

### 2. `organization-service.test.ts`
Tests organization CRUD operations and business logic.

**Coverage:**
- Creating organizations
- Adding members with roles
- Creating and managing invitations
- Updating member roles
- Removing members
- Business rule validation

**Key Test Suites:**
- createOrganization
- addMember
- createInvitation
- updateMemberRole
- removeMember
- Business Logic Validation

### 3. `database-helpers.test.ts`
Tests the SQL helper functions and RLS policy logic.

**Coverage:**
- `is_org_admin()` function logic
- `has_org_role()` function logic
- `can_access_farm()` function logic
- `has_farm_permission()` function logic
- `get_user_farm_role()` function logic
- RLS policy validation
- Security edge cases

**Key Test Suites:**
- Database Helper Functions
- RLS Policy Logic Validation
- Edge Cases and Security

### 4. `audit-logger.test.ts`
Tests audit logging functionality and trail integrity.

**Coverage:**
- Basic logging operations
- Convenience methods (logCreate, logUpdate, logDelete, etc.)
- Audit trail integrity
- Error handling
- Performance with bulk operations
- Security and privacy considerations

**Key Test Suites:**
- Basic Logging
- Convenience Methods
- Audit Trail Integrity
- Error Handling
- Performance and Scalability
- Security and Privacy

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Only RBAC Tests
```bash
npm run test:rbac
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test permissions.test.ts
npm test organization-service.test.ts
npm test database-helpers.test.ts
npm test audit-logger.test.ts
```

### Run Specific Test Suite
```bash
npm test -- --testNamePattern="Role Permission Matrix"
npm test -- --testNamePattern="createOrganization"
npm test -- --testNamePattern="Audit Trail Integrity"
```

## Test Statistics

- **Total Test Files:** 4
- **Total Test Suites:** 26+
- **Total Test Cases:** 100+
- **Code Coverage Target:** 90%+

## What's Tested

### ✅ Permission Logic
- All 8 roles have correct permissions
- Role hierarchy is maintained
- Resource-specific access control
- Edge cases (null values, empty arrays, etc.)

### ✅ Organization Operations
- Creating organizations with validation
- Adding members with role assignment
- Invitation system (creation, expiry, uniqueness)
- Role updates and member removal
- Business rule enforcement

### ✅ Database Functions
- Admin role checking
- Role membership validation
- Farm access control
- Permission checking with farm context
- User role determination

### ✅ Audit Logging
- All CRUD operations are logged
- Metadata preservation
- Immutability of audit logs
- Error handling
- Performance under load

## What's NOT Tested (UI Tests)

These functional tests do NOT cover:
- React component rendering
- User interactions (clicks, form submissions)
- Visual appearance
- Browser compatibility
- Accessibility features
- UI state management

## Test Coverage Requirements

Each test file should maintain:
- **Line Coverage:** > 90%
- **Branch Coverage:** > 85%
- **Function Coverage:** > 90%
- **Statement Coverage:** > 90%

## Adding New Tests

When adding new RBAC features, create tests in this directory following the pattern:

```typescript
// File: new-feature.test.ts

describe('New Feature - Functional Tests', () => {
  describe('Feature Aspect 1', () => {
    test('should do something specific', () => {
      // Arrange
      const input = { ... }

      // Act
      const result = someFunction(input)

      // Assert
      expect(result).toEqual(expected)
    })
  })
})
```

## Continuous Integration

These tests run automatically on:
- Every commit (pre-commit hook)
- Pull request creation
- Merge to main branch
- Deployment to staging/production

## Debugging Tests

### Run Single Test with Debug Output
```bash
npm test -- --testNamePattern="specific test name" --verbose
```

### Run with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### View Failed Test Details
```bash
npm test -- --verbose --no-coverage
```

## Maintenance

- **Update tests** when modifying RBAC logic
- **Add tests** for new roles or permissions
- **Review coverage** reports regularly
- **Refactor tests** to reduce duplication
- **Document** complex test scenarios

## Related Documentation

- [ENTERPRISE_RBAC_PLAN.md](../../../ENTERPRISE_RBAC_PLAN.md) - Full RBAC implementation plan
- [RBAC_IMPLEMENTATION_STATUS.md](../../../RBAC_IMPLEMENTATION_STATUS.md) - Implementation checklist
- [types/rbac.ts](../../types/rbac.ts) - TypeScript type definitions
- [lib/organization-service.ts](../../lib/organization-service.ts) - Service implementation

## Questions or Issues?

If tests are failing:
1. Check if database migrations are up to date
2. Verify environment variables are set correctly
3. Review recent changes to RBAC logic
4. Check test logs for specific error messages

For help, contact the development team or file an issue.
