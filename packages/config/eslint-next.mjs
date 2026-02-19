import baseConfig from './eslint-base.mjs'
import { defineConfig } from 'eslint/config'

// Next.js flat config — extends base with next-specific rules
// Usage: import nextConfig from '@openagents/config/eslint-next'
export default defineConfig([
  ...baseConfig,
  {
    rules: {
      // Next.js specific overrides
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
])
