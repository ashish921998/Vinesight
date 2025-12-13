import { FlatCompat } from '@eslint/eslintrc'
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname
})

// Convert recommended rules to warnings
const recommendedAsWarnings = Object.fromEntries(
  Object.entries(tseslint.configs.recommended.rules || {}).map(([key, value]) => {
    if (Array.isArray(value)) {
      return [key, ['warn', ...value.slice(1)]]
    }
    return [key, value === 'error' ? 'warn' : value]
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
