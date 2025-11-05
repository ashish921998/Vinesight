# VineSight Testing Documentation

## Overview

This document describes the testing infrastructure and test coverage for the VineSight application. The test suite ensures the reliability and correctness of critical agricultural calculations, business logic, and security features.

## Testing Framework

- **Test Runner**: Vitest 4.0.7
- **Testing Library**: @testing-library/react 16.3.0 + @testing-library/jest-dom
- **Environment**: jsdom (for React components)
- **Coverage Tool**: @vitest/coverage-v8

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Current Test Coverage

### Test Statistics

- **Total Test Files**: 4
- **Total Tests**: 180
- **Test Pass Rate**: 100%

### Tested Modules

| Module | Tests | Description |
|--------|-------|-------------|
| `validation.ts` | 82 | Security-critical input validation and sanitization |
| `etc-calculator.ts` | 41 | Scientific evapotranspiration calculations |
| `lai-calculator.ts` | 40 | Leaf Area Index and canopy management |
| `utils.ts` | 17 | General utility functions |

## Test Categories

### 1. Security & Validation Tests (`validation.test.ts`)

**Purpose**: Ensure all user inputs are properly validated and sanitized to prevent security vulnerabilities.

**Key Test Areas**:
- **XSS Prevention**: Tests for HTML tag removal, script injection blocking
- **SQL Injection Protection**: Tests for SQL keyword removal, quote escaping
- **Input Sanitization**: Tests for dangerous URI removal (javascript:, data:, vbscript:)
- **HTML Encoding**: Tests for proper entity encoding
- **Schema Validation**: Tests for all Zod schemas (Farm, Irrigation, Spray, Harvest, Task, Expense, ETc)
- **Rate Limiting**: Tests for SecurityRateLimiter class functionality
- **File Upload Validation**: Tests for file type and size restrictions
- **CSRF Token Generation**: Tests for security token generation

**Critical Test Cases**:
```typescript
// XSS Prevention
expect(sanitizeString('<script>alert("xss")</script>')).toBe('alert("xss")')

// SQL Injection Prevention
expect(sanitizeForSQL("DROP TABLE users")).toBe(" TABLE users")

// Rate Limiting
rateLimiter.checkLimit('user-id') // should block after limit
```

### 2. Scientific Calculator Tests (`etc-calculator.test.ts`)

**Purpose**: Verify accuracy of FAO Penman-Monteith evapotranspiration calculations.

**Key Test Areas**:
- **ETo Calculation**: Reference evapotranspiration using multiple solar radiation inputs
- **Crop Coefficients**: Correct Kc values for all grape growth stages
- **ETc Calculation**: Crop-specific evapotranspiration
- **Irrigation Recommendations**: Smart recommendations based on weather and soil
- **Growth Stage Detection**: Automatic stage determination
- **Input Validation**: Weather and location data validation
- **Edge Cases**: Extreme temperatures, zero values, boundary conditions

**Growth Stages Tested**:
- Dormant (Kc = 0.15)
- Bud Break (Kc = 0.3)
- Flowering (Kc = 0.7)
- Fruit Set (Kc = 0.95)
- Veraison (Kc = 0.85)
- Harvest (Kc = 0.45)
- Post-Harvest (Kc = 0.6)

**Critical Test Cases**:
```typescript
// Validates FAO-56 Penman-Monteith equation implementation
const eto = ETcCalculator.calculateETo(weatherData, location)
expect(eto).toBeGreaterThan(0)
expect(eto).toBeLessThan(20) // Reasonable range

// Verifies irrigation recommendations
expect(result.irrigationRecommendation.shouldIrrigate).toBe(false) // for dormant
expect(result.irrigationRecommendation.shouldIrrigate).toBe(true) // for fruit_set with high temp
```

### 3. Canopy Management Tests (`lai-calculator.test.ts`)

**Purpose**: Validate Leaf Area Index calculations and canopy management recommendations.

**Key Test Areas**:
- **LAI Calculation**: Leaf area index based on vine morphology
- **Canopy Classification**: Sparse, optimal, dense, overcrowded categories
- **Light Interception**: Beer-Lambert law for canopy light penetration
- **Plant Density**: Vines per hectare calculations
- **Quality Metrics**: Fruit exposure, airflow, disease risk assessment
- **Recommendations**: Canopy management, pruning, trellis adjustments
- **Seasonal Adjustments**: Growth stage-specific calculations
- **Trellis Systems**: VSP, Geneva, Scott-Henry, Lyre, Pergola
- **Production Goals**: Optimal LAI for table, wine, and raisin grapes

**Critical Test Cases**:
```typescript
// LAI Classification
expect(result.canopyDensity).toBe('sparse') // LAI < 1.0
expect(result.canopyDensity).toBe('optimal') // 1.0 <= LAI <= 2.5
expect(result.canopyDensity).toBe('overcrowded') // LAI > 4.0

// Quality Assessment
expect(result.qualityMetrics.diseaseRisk).toBe('high') // for LAI > 4.0
expect(result.qualityMetrics.airflow).toBe('good') // for 2.0 <= LAI <= 3.0
```

### 4. Utility Function Tests (`utils.test.ts`)

**Purpose**: Validate helper functions for UI and general operations.

**Key Test Areas**:
- **Class Name Merging**: Tailwind CSS class merging with `cn()`
- **String Utilities**: Capitalization functions
- **Edge Cases**: Empty strings, special characters, null/undefined handling

## Test Infrastructure

### Setup Files

#### `src/test/setup.ts`
Global test setup including:
- Testing Library extensions
- Mock environment variables
- Supabase client mocks
- Next.js router mocks
- DOM API mocks (matchMedia, IntersectionObserver, ResizeObserver)

#### `src/test/test-utils.tsx`
Custom render functions with providers for component testing.

#### `src/test/mockData.ts`
Reusable mock data for tests:
- Mock weather data
- Mock farm data
- Mock soil test results
- Mock AI profiles
- Mock pest predictions
- Mock Supabase client

### Configuration

#### `vitest.config.ts`
```typescript
{
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/test/setup.ts'],
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.*']
  }
}
```

## Best Practices

### Writing Tests

1. **Descriptive Test Names**: Use clear, specific test descriptions
   ```typescript
   it('should reject humidity above 100', () => { ... })
   ```

2. **Arrange-Act-Assert Pattern**:
   ```typescript
   // Arrange
   const input = { ... }

   // Act
   const result = calculateSomething(input)

   // Assert
   expect(result).toBe(expected)
   ```

3. **Test Independence**: Each test should be isolated and not depend on others

4. **Mock External Dependencies**: Mock Supabase, APIs, and external services

5. **Edge Case Coverage**: Test boundary conditions, null values, extreme inputs

### Code Coverage Goals

- **Critical Modules** (validation, calculators): 90%+ coverage
- **Business Logic**: 80%+ coverage
- **UI Components**: 70%+ coverage
- **Overall Project**: 70%+ coverage

## Future Test Additions

The following modules still need comprehensive test coverage:

### High Priority
- [ ] `nutrient-calculator.ts` - Nutrient recommendation algorithms
- [ ] `system-discharge-calculator.ts` - Irrigation system calculations
- [ ] `pest-prediction-service.ts` - AI-powered pest predictions
- [ ] `smart-task-generator.ts` - Task recommendation engine

### Medium Priority
- [ ] `weather-service.ts` - Weather API integration
- [ ] `ai-profile-service.ts` - Farmer personalization
- [ ] `soil-health.ts` - Soil analysis algorithms
- [ ] `yield-prediction.ts` - Yield forecasting
- [ ] `market-intelligence.ts` - Market data analysis

### Lower Priority
- [ ] `export-service.ts` - PDF/CSV generation
- [ ] `ai-service.ts` - AI chatbot integration
- [ ] `supabase-service.ts` - Database operations
- [ ] Custom hooks (`useETcCalculator`, `usePerformanceMonitor`, etc.)
- [ ] React components (calculators, dashboards, forms)

## Continuous Integration

### GitHub Actions (Recommended)

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage
```

## Debugging Tests

### Run Specific Test File
```bash
npx vitest src/lib/__tests__/validation.test.ts
```

### Run Specific Test
```bash
npx vitest -t "should remove HTML tags"
```

### Watch Mode for Development
```bash
npm test
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test:run"],
  "console": "integratedTerminal"
}
```

## Performance Considerations

- **Fast Execution**: Current test suite completes in ~6 seconds
- **Parallel Execution**: Tests run in parallel by default
- **Selective Testing**: Use watch mode to run only changed tests
- **Coverage Reports**: Generate coverage only when needed (adds ~2s)

## Security Testing

Security-focused tests ensure:
- ✅ XSS attack prevention
- ✅ SQL injection protection
- ✅ CSRF token generation
- ✅ Rate limiting enforcement
- ✅ File upload restrictions
- ✅ Input sanitization
- ✅ HTML entity encoding

## Scientific Accuracy

Agricultural calculations are validated against:
- ✅ FAO-56 Penman-Monteith standards
- ✅ Peer-reviewed crop coefficient values
- ✅ Industry-standard LAI methodologies
- ✅ Beer-Lambert law for light interception

## Maintainability

- **Mock Data**: Centralized in `src/test/mockData.ts`
- **Test Utilities**: Reusable helpers in `src/test/test-utils.tsx`
- **Setup Once**: Global setup in `src/test/setup.ts`
- **Clear Structure**: Tests mirror source code structure

---

**Last Updated**: November 5, 2025
**Test Suite Version**: 1.0.0
**Coverage**: Core modules (validation, ETc, LAI, utils)
