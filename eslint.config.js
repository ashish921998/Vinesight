import { FlatCompat } from '@eslint/eslintrc'
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname
})

// Convert recommended rules to warnings (handles both string and numeric severities)
const recommendedAsWarnings = Object.fromEntries(
  Object.entries(tseslint.configs.recommended.rules || {}).map(([key, value]) => {
    if (Array.isArray(value)) {
      const [severity, ...rest] = value
      // Convert first element: 'error' -> 'warn' or 2 -> 1
      const newSeverity = severity === 'error' ? 'warn' : severity === 2 ? 1 : severity
      return [key, [newSeverity, ...rest]]
    }
    // Standalone value: 'error' -> 'warn' or 2 -> 1
    if (value === 'error') return [key, 'warn']
    if (value === 2) return [key, 1]
    return [key, value]
  })
)

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts']
  },
  ...compat.config({
    extends: ['next', 'next/core-web-vitals']
  }),
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tseslint
    },
    languageOptions: {
      parser: tsparser
    },
    rules: {
      // Include recommended rules as warnings (won't break builds)
      ...recommendedAsWarnings,
      // Custom overrides
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ]
    }
  },
  pluginPrettierRecommended
]

export default config
