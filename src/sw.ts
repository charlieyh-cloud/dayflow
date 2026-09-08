/// <reference lib="webworker" />
/**
 * DayFlow Service Worker.
 *
 * STEP 1 범위: 앱 셸 precache, 정적 에셋 stale-while-revalidate, 오프라인 폴백.
 * STEP 4 에서 push / notificationclick / Background Sync 핸들러를 여기에 덧붙인다.
 *
 * 중요: 이 파일이 빌드된 dist/sw.js 에는 절대 장기 캐시 헤더를 붙이지 않는다.
 * (호스팅 설정은 public/_headers 와 vite.config.ts 의 preview.headers 참조)
 */
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'
import type { WorkboxPlugin } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope

/**
 * workbox 플러그인 클래스의 선언 타입은 exactOptionalPropertyTypes 와 어긋난다
 * (선택 메서드를 `T | undefined` 로 선언해 둔 라이브러리 쪽 문제).
 * 런타임 동작에는 영향이 없어 여기서 한 번만 좁혀 쓴다.
 */
const asPlugin = (plugin: unknown): WorkboxPlugin => plugin as WorkboxPlugin

const OFFLINE_URL = 'offline.html'

// ── 앱 셸 precache ──
// __WB_MANIFEST 는 빌드 시 vite-plugin-pwa 가 주입한다.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// ── 내비게이션 요청 ──
// SPA 이므로 index.html 로 돌려주고, 실패하면 오프라인 페이지를 보여준다.
const navigationHandler = createHandlerBoundToURL('index.html')
registerRoute(
  new NavigationRoute(async (options) => {
    try {
      return await navigationHandler(options)
    } catch {
      const cache = await caches.open('offline-fallback')
      const cached = await cache.match(OFFLINE_URL)
      return cached ?? Response.error()
    }
  }),
)

// ── 정적 에셋: stale-while-revalidate ──
registerRoute(
  ({ request }) =>
    request.destination === 'style' || request.destination === 'script' || request.destination === 'worker',
  new StaleWhileRevalidate({
    cacheName: 'static-assets',
    plugins: [asPlugin(new CacheableResponsePlugin({ statuses: [0, 200] }))],
  }),
)

// ── 이미지: cache-first, 60일 / 60개 제한 ──
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      asPlugin(new CacheableResponsePlugin({ statuses: [0, 200] })),
      asPlugin(
        new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 24 * 60 * 60, purgeOnQuotaError: true }),
      ),
    ],
  }),
)

// ── 폰트: cache-first, 1년 ──
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts',
    plugins: [
      asPlugin(new CacheableResponsePlugin({ statuses: [0, 200] })),
      asPlugin(new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 })),
    ],
  }),
)

// ── 설치: 오프라인 폴백 페이지를 미리 저장 ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('offline-fallback').then((cache) => cache.add(new Request(OFFLINE_URL, { cache: 'reload' }))),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// ── 업데이트 적용 ──
// registerType: 'prompt' 이므로 사용자가 배너에서 "새로고침"을 눌러야 교체된다.
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if ((event.data as { type?: string } | undefined)?.type === 'SKIP_WAITING') {
    void self.skipWaiting()
  }
})
