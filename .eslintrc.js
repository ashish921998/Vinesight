module.exports = {
  extends: [
    'next',
    'next/core-web-vitals',
    'plugin:prettier/recommended', // adds the "prettier" plugin and disables conflicting ESLint rules
  ],
  plugins: ['prettier'],
  rules: {
    // Keep linting, but let Prettier handle formatting issues
    'prettier/prettier': 'error',
    // Other custom rules
    'no-console': 'warn',
  },
}
