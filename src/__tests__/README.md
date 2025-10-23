# Test Suite for VineSight Farm Management

## Overview
This test suite provides comprehensive coverage for the farm logs functionality and activity display utilities.

## Test Files

### 1. `lib/activity-display-utils.test.ts`
Tests for utility functions that format and display farm activity data:
- **getActivityDisplayData**: Tests formatting of different activity types (irrigation, spray, harvest, etc.)
- **groupActivitiesByDate**: Tests date-based grouping of activities
- **normalizeDateToYYYYMMDD**: Tests date normalization and formatting
- **transformActivitiesToLogEntries**: Tests activity transformation for UI display

### 2. `components/farm-details/ActivityFeed.test.tsx`
Component tests for the ActivityFeed component:
- Loading state rendering
- Empty state handling
- Pending tasks display
- Activity grouping and display
- UI interactions (click handlers, button clicks)

### 3. `app/farms/logs/page.utils.test.tsx`
Tests for utility functions in the farm logs page:
- **formatLogDate**: Date formatting with relative time (today, yesterday, etc.)
- **getDaysAfterPruning**: Calculate days since pruning date

## Running Tests

```bash
# Run all tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

The test suite focuses on:
1. **Pure functions** - All utility functions are thoroughly tested
2. **Edge cases** - Null/undefined inputs, invalid data, boundary conditions
3. **Data transformations** - Proper formatting and type conversions
4. **UI rendering** - Component states and user interactions

## Key Changes Tested

Based on the git diff, these tests specifically verify:

### From logs/page.tsx:
- ✅ Capitalization fix: "yesterday" → "Yesterday"
- ✅ Toast error handling on delete
- ✅ Click handlers with event propagation (e.stopPropagation())
- ✅ Simplified log display using getActivityDisplayData()
- ✅ Hover effects and cursor pointer for clickable elements

### From ActivityFeed.tsx:
- ✅ Activity grouping and summary display
- ✅ Click handlers for edit/delete with proper event handling
- ✅ Truncation of long text for better UX
- ✅ Icon display for multiple log types
- ✅ Date formatting utilities

## Best Practices

1. **Mock external dependencies**: next/navigation, sonner, etc.
2. **Test behavior, not implementation**: Focus on what users see and do
3. **Descriptive test names**: Clearly state what is being tested
4. **Arrange-Act-Assert pattern**: Set up data, perform action, verify result
5. **Edge case coverage**: Test null, undefined, empty arrays, invalid data

## Adding New Tests

When adding new functionality to the farm logs or activity feed:

1. Add tests BEFORE implementing the feature (TDD approach)
2. Cover happy path, edge cases, and error conditions
3. Test both UI rendering and business logic
4. Ensure mocks are properly set up for external dependencies