import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // vite-plugin-pwa 가 빌드 때 만드는 가상 모듈이라 Vitest 에서는 스텁으로 대체한다.
      'virtual:pwa-register/react': fileURLToPath(new URL('./tests/stubs/pwa-register.ts', import.meta.url)),
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
        'src/types/**',
        'src/**/*.d.ts',
        'src/**/index.ts',

        // 아래는 jsdom 이 아니라 실제 브라우저에서만 의미 있는 코드다.
        // Playwright(tests/e2e)가 커버하며, 여기서 중복 집계하지 않는다.
        'src/sw.ts', // Service Worker — jsdom 에 등록 API 가 없다
        'src/app/**', // 앱 셸·라우트 — e2e/smoke.spec.ts 가 검증
        'src/components/UpdateBanner.tsx', // virtual:pwa-register 가 필요
        'src/components/InstallPrompt.tsx', // beforeinstallprompt 이벤트가 필요
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
