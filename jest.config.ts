import nextJest from 'next/jest'

const createJestConfig = nextJest({
  dir: './',
})

const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx)',
    '**/?(*.)+(test).+(ts|tsx)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^.+\\.(css|scss|sass|less)$': 'identity-obj-proxy',
    '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg|ico|bmp|ttf|woff|woff2)$': '<rootDir>/__mocks__/fileMock.js'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@radix-ui|@supabase|lucide-react)/)'
  ],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: [
    // Focus initial coverage on core logic and API; expand gradually
    'src/lib/**/*.{ts,tsx}',
    'src/app/api/**/*.{ts,tsx}',
    // Include one representative UI component (smoke test)
    'src/components/ui/button.tsx',
    // Exclusions
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!public/**',
    '!supabase/**',
    '!context/**',
    '!src/test-utils.tsx'
  ],
  coverageThreshold: {
    global: {
      statements: 60,
      branches: 50,
      functions: 60,
      lines: 60
    }
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/e2e/']
} as import('jest').Config

export default createJestConfig(config)
