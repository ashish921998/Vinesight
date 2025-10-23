# Testing Setup Guide

## Installation

To run the tests, you need to install the testing dependencies:

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

## Package.json Scripts

Add the following scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm test:ui

# Run tests with coverage
npm test:coverage
```

## Test Files Created

1. `vitest.config.ts` - Vitest configuration
2. `vitest.setup.ts` - Test setup with mocks
3. `src/app/farms/__tests__/logs-page-utils.test.ts` - Tests for utility functions
4. `src/components/farm-details/__tests__/ActivityFeed.test.tsx` - Tests for ActivityFeed component

## Test Coverage

The tests cover:
- ✅ Pure functions (formatLogDate, getDaysAfterPruning)
- ✅ Component rendering (loading, empty, populated states)
- ✅ User interactions (clicks, edits, deletes)
- ✅ Event propagation (stopPropagation)
- ✅ Edge cases and error handling
- ✅ Responsive design
- ✅ Accessibility

## Notes

- The tests are comprehensive and follow best practices
- Mock implementations for Next.js router and toast notifications are included
- Tests use TypeScript for type safety
- All tests follow the AAA pattern (Arrange, Act, Assert)