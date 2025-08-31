import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.test.js'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 10000,
  },
})
