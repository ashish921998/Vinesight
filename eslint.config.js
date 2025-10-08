import { FlatCompat } from '@eslint/eslintrc'
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname
})

export default [
  {
    ignores: ['.next/**', 'node_modules/**']
  },
  ...compat.config({
    extends: ['next', 'next/core-web-vitals']
  }),
  {
    rules: {
      'no-console': 'warn'
    }
  },
  pluginPrettierRecommended
]
