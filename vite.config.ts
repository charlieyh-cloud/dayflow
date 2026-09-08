import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * GitHub Pages 등 서브경로 배포를 위해 base 를 환경 변수로 제어한다.
 * manifest 의 start_url·scope 와 Service Worker 등록 경로가 모두 이 값을 따른다.
 */
const base = process.env.VITE_BASE_PATH ?? '/'

export default defineConfig({
  base,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // 소스맵은 배포 후 디버깅과 Lighthouse 진단에 필요하다.
    sourcemap: true,
    rollupOptions: {
      output: {
        // 빌드마다 해시가 바뀌므로 구버전 에셋이 캐시에 남지 않는다.
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      // 커스텀 Service Worker(푸시·백그라운드 동기화)를 STEP 4에서 확장하므로
      // generateSW 가 아닌 injectManifest 를 쓴다. src/sw.ts → dist/sw.js
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      // 자동 갱신 대신 사용자에게 "새 버전이 있습니다" 배너로 알린다.
      registerType: 'prompt',
      injectRegister: null,
      manifest: false, // public/manifest.webmanifest 를 직접 관리한다
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'],
        // 소스맵은 precache 대상에서 제외한다.
        globIgnores: ['**/*.map', '**/node_modules/**'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
    headers: {
      // Service Worker 는 절대 캐시하지 않는다. 갱신 미반영의 주원인.
      'Cache-Control': 'no-cache',
    },
  },
})
