import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/a11y/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/main.tsx',
        'src/sw.ts',
        'src/types/**',
        'src/**/*.d.ts',
        'src/**/index.ts',
      ],
      thresholds: {
        // PRD 8.4: 커버리지 70% 미만이면 CI 실패
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
})
