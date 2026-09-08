# DayFlow

날짜·시간 기반 일정 관리 To-Do **PWA**. "기록 → 알림 → 이동 → 완료"까지의 실행 루프를 웹과 모바일에서 끊김 없이 잇습니다.

상세 요구사항은 [`docs/prd.md`](docs/prd.md)에 있습니다. 개발 규칙은 [`CLAUDE.md`](CLAUDE.md)를 참고하세요.

## 핵심 원칙

- **오프라인 우선** — 로컬(IndexedDB)에 먼저 쓰고 서버와 나중에 동기화합니다. 서버 없이도 앱이 동작합니다.
- **접근성은 기능 요건** — WCAG 2.2 AA 를 CI 게이트로 강제합니다. axe critical·serious 0건, Lighthouse Accessibility 100점 미만이면 병합할 수 없습니다.
- **Service Worker 는 캐시하지 않는다** — 갱신 미반영의 가장 흔한 원인입니다.

## 시작하기

```bash
npm ci
npm run dev          # http://localhost:5173
```

### 프로덕션 빌드 확인

```bash
npm run build
npm run preview      # http://localhost:4173 (sw.js 에 no-cache 헤더 적용)
```

오프라인 동작을 확인하려면 `preview` 실행 후 브라우저 개발자 도구의 Network 탭에서 Offline 을 켜고 새로고침하세요.

## 스크립트

| 명령                    | 설명                                    |
| ----------------------- | --------------------------------------- |
| `npm run dev`           | 개발 서버 (Service Worker 포함)         |
| `npm run build`         | 타입 체크 + 프로덕션 빌드               |
| `npm run preview`       | 빌드 결과 미리보기                      |
| `npm run lint`          | ESLint (jsx-a11y 규칙 전부 오류로 승격) |
| `npm run typecheck`     | TypeScript 검사                         |
| `npm run test`          | 단위 + 컴포넌트 접근성 테스트 (Vitest)  |
| `npm run test:coverage` | 커버리지 (70% 미만 실패)                |
| `npm run test:e2e`      | Playwright E2E                          |
| `npm run test:a11y`     | Playwright + axe-core 접근성 검사       |
| `npm run size`          | 번들 크기 검사 (앱 셸 200KB gzip)       |

## 디렉터리 구조

```
.github/workflows/   ci.yml · deploy.yml · preview.yml
public/              manifest.webmanifest · offline.html · icons/
src/
  app/               앱 셸, 라우트
  components/        공통 UI (Button · Input · Modal · Toast …)
  features/          tasks · categories · chat · map · notifications · sync · auth
  lib/               유틸, 훅
  db/                IndexedDB 스키마 (STEP 2)
  styles/            디자인 토큰, 전역 스타일
  types/             도메인 타입 단일 소스
  sw.ts              Service Worker 소스 → 빌드 시 dist/sw.js
server/              API · 알림 스케줄러 (STEP 4)
tests/               unit/ · e2e/ · a11y/
```

> `src/sw.ts` 는 Workbox `injectManifest` 로 컴파일되어 `dist/sw.js` 로 배포됩니다. `public/` 에 직접 두지 않는 이유는 precache manifest 주입과 TypeScript 검사가 필요하기 때문입니다.

## 환경 변수

`.env.example` 을 `.env` 로 복사해 채웁니다. 실제 값은 커밋하지 않습니다.

- `VITE_` 접두사가 붙은 값만 클라이언트 번들에 포함됩니다. **비밀 키에는 절대 이 접두사를 쓰지 마세요.**
- LLM·지도 API 호출은 클라이언트에서 직접 하지 않고 서버 프록시를 경유합니다.
- 운영 환경의 시크릿은 GitHub Secrets 로 관리합니다.

## CI 게이트

`main` / `develop` 은 직접 푸시할 수 없습니다. PR 로만 병합하며 아래 검사를 모두 통과해야 합니다.

| 단계        | 도구              | 실패 조건                                   |
| ----------- | ----------------- | ------------------------------------------- |
| 린트        | ESLint + Prettier | 오류 1건 이상                               |
| 타입        | TypeScript        | 오류 1건 이상                               |
| 단위 테스트 | Vitest            | 실패 또는 커버리지 70% 미만                 |
| E2E         | Playwright        | 핵심 플로우 실패                            |
| **접근성**  | axe-core          | critical·serious 1건 이상                   |
| Lighthouse  | lighthouse-ci     | Accessibility 100 미만, Performance 90 미만 |
| 번들 크기   | size-limit        | 앱 셸 200KB(gzip) 초과                      |
| 빌드        | Vite              | 빌드 실패                                   |

색상 대비는 `tests/unit/contrast.test.ts` 가 디자인 토큰을 직접 파싱해 검증합니다. 토큰 값을 바꾸면 즉시 잡힙니다.

## 배포

`main` 에 병합되면 GitHub Pages 로 자동 배포됩니다. 서브경로 배포에 맞춰 `VITE_BASE_PATH` 가 주입되고, manifest 의 `start_url`·`scope` 와 Service Worker 등록 경로가 이를 따릅니다.

배포 주소: <https://charlieyh-cloud.github.io/dayflow/>

Service Worker 캐시 정책은 `public/_headers`(Cloudflare Pages · Netlify)와 `public/vercel.json` 에 정의되어 있습니다. 다른 호스팅을 쓰더라도 `/sw.js` 에 `no-cache` 를 반드시 적용하세요.

### 알려진 제약 — GitHub Pages 와 Service Worker 캐시

**GitHub Pages 는 커스텀 응답 헤더를 지원하지 않습니다.** `_headers` 파일이 무시되어 `/sw.js` 가 `Cache-Control: max-age=600` 으로 내려갑니다. 최대 10분간 구버전 Service Worker 가 남을 수 있습니다.

완화책은 이미 들어가 있습니다.

- 브라우저가 Service Worker 스크립트를 캐시하는 최대 시간은 24시간으로 제한됩니다.
- 앱이 한 시간마다 `registration.update()` 로 갱신을 확인합니다.
- 갱신이 감지되면 "새 버전이 있습니다" 배너로 사용자에게 알립니다.

정확한 `no-cache` 가 필요해지면 Cloudflare Pages 또는 Vercel 로 옮기세요. 설정 파일은 이미 리포지터리에 있습니다. STEP 4 에서 알림 스케줄러용 백엔드를 붙일 때 함께 결정하는 편이 좋습니다 (PRD 열린 질문 6번).

## 커밋 규칙

Conventional Commits 를 따릅니다. commitlint 가 커밋 시점에 강제합니다.

```
feat(notifications): 백그라운드 푸시 수신 핸들러 구현
a11y(views): 월간 뷰 키보드 탐색 순서 수정
```

type: `feat` `fix` `a11y` `perf` `refactor` `test` `docs` `chore` `ci`
