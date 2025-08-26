import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

export default [
  ...compat.extends('next/core-web-vitals'),
  {
    ignores: [
      '.next/**/*',
      'node_modules/**/*', 
      'public/**/*',
      '*.config.js',
      '*.config.ts',
      '*.config.mjs',
      'build/**/*',
      'dist/**/*'
    ]
  },
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', 'app/**/*.{js,jsx,ts,tsx}', 'pages/**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Critical error prevention rules
      'prefer-const': 'warn',
      
      // React/Next.js specific rules  
      'react-hooks/exhaustive-deps': 'warn',
      'react/no-unescaped-entities': 'warn',
      
      // Security and best practices
      'no-console': 'warn',
      'no-debugger': 'error', 
      'no-alert': 'warn',
      
      // Code quality rules
      'no-duplicate-imports': 'warn',
      'no-unreachable': 'error',
      'no-constant-condition': 'warn',
      
      // React best practices
      'react/jsx-key': 'error',
      'react-hooks/rules-of-hooks': 'error',
    }
  }
];
