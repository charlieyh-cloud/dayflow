# CLAUDE.md — DayFlow

날짜·시간 기반 일정 관리 To-Do **PWA**. "기록 → 알림 → 이동 → 완료" 루프를 웹/모바일에서 끊김 없이 제공한다.
상세 요구사항은 `docs/prd.md` (단일 진실 소스). 기능 ID(F-01 ~ F-10)로 참조한다.

## 핵심 제약 (모든 작업에 적용)

- **오프라인 우선**: 로컬(IndexedDB)에 먼저 쓰고 서버는 나중에 동기화한다. 서버 없이도 앱이 완전히 동작해야 한다.
- **접근성은 기능 요건**: WCAG 2.2 AA / KWCAG 2.2. axe critical·serious 위반 0건, Lighthouse Accessibility 100이 CI 게이트다.
- **PWA 요건**: HTTPS, manifest, Service Worker. `sw.js`는 `no-cache` 헤더 전제로 구성한다.
- 삭제는 soft delete (`deletedAt`). 모든 레코드에 `createdAt / updatedAt / deletedAt / syncVersion`.

## 기술 스택

| 영역             | 선택                                                                         |
| ---------------- | ---------------------------------------------------------------------------- |
| UI               | React + TypeScript (strict), Vite                                            |
| PWA              | vite-plugin-pwa / Workbox                                                    |
| 로컬 저장        | IndexedDB (Dexie)                                                            |
| 서버 상태        | TanStack Query (낙관적 업데이트)                                             |
| 반복 규칙        | rrule (iCalendar RRULE)                                                      |
| 테스트           | Vitest + Testing Library + jest-axe, Playwright (e2e/a11y)                   |
| 린트             | ESLint + Prettier + eslint-plugin-jsx-a11y, husky + lint-staged + commitlint |
| 백엔드 (STEP 4~) | Supabase (PostgreSQL, Auth, Realtime), Web Push (VAPID)                      |

## 디렉터리 구조 (PRD 8.1)

```
.github/workflows/   ci.yml · deploy.yml · preview.yml
public/              manifest.webmanifest · sw.js · icons/
src/
  components/        공통 UI (Button, Input, Modal, Toast …)
  features/          tasks · categories · chat · map · notifications · sync · auth
  lib/               유틸, API 클라이언트
  db/                Dexie 스키마
  types/             도메인 타입 단일 소스
server/              API · 알림 스케줄러
tests/               unit/ · e2e/ · a11y/
docs/                prd.md
```

- 기능 코드는 `src/features/<scope>/` 안에 둔다. 다른 feature를 직접 import하지 말고 `components`/`lib`/`types`를 통해 공유한다.
- 도메인 타입은 `src/types`에만 정의한다. 중복 정의 금지.

## 코딩 컨벤션

- 함수형 컴포넌트 + hooks만 사용. 클래스 컴포넌트 금지.
- **named export**만 사용 (`export default` 금지, 라우트 lazy 로딩 예외).
- import는 절대경로 `@/` 별칭 사용. 상대경로 `../../` 금지.
- TypeScript strict. **`any` 금지** — 불가피하면 `unknown` + 타입 가드.
- 파일명: 컴포넌트 `PascalCase.tsx`, 그 외 `kebab-case.ts`. 테스트는 `*.test.ts(x)` 를 대상 파일 옆에.
- 날짜는 ISO 8601 문자열로 저장, 표시 시에만 사용자 타임존/형식으로 변환.
- 상태 값은 PRD 5장 문자열 그대로: `priority` = `urgent|high|normal|low`, `status` = `scheduled|in_progress|done|postponed|cancelled`.
- UI 텍스트는 한국어. 코드·주석·커밋 scope는 영어.

## 접근성 규칙 (필수 준수)

- 시맨틱 HTML 우선. ARIA는 네이티브 요소로 불가능할 때만.
- 모든 인터랙티브 요소는 키보드로 도달·조작 가능. 가시적 포커스 링 (3:1 이상). 포커스 순서는 논리적으로.
- 색상만으로 정보 전달 금지 — 카테고리·우선순위·상태는 **아이콘 + 텍스트 병기**.
- 대비: 본문 4.5:1, 큰 텍스트·UI 컴포넌트 3:1 이상.
- 터치 타겟 최소 **44×44 CSS px**.
- 크기 단위는 `px` 대신 **`rem`** (border, 1px 선 제외). 200% 확대 시 가로 스크롤·콘텐츠 손실 없음.
- 동적 변경(저장, 필터, 뷰 전환, 알림 도착)은 `aria-live` 리전으로 안내.
- 모든 폼 입력에 명시적 `<label>`. 오류는 텍스트로 원인·해결법 안내, `aria-describedby` 연결, 첫 오류 필드로 포커스 이동.
- 드래그 조작에는 반드시 **비드래그 대안**(메뉴/편집 폼) 제공.
- `prefers-reduced-motion`, `prefers-color-scheme` 존중. 다크·고대비 테마 지원.
- Modal: 포커스 트랩 + Esc 닫기 + 닫힌 뒤 포커스 복원.
- 차트·지도는 동일 정보를 **텍스트/표로 병기**.
- 새 공통 컴포넌트는 jest-axe 테스트를 함께 작성한다.

## 알림 / Service Worker 규칙

- 알림 발송 시각 판단은 **서버**가 한다. 클라이언트 타이머 금지.
- `push` 핸들러는 반드시 `showNotification()` 호출 (silent push 금지).
- 표시 직전 일정 최신 상태 확인 — 완료·삭제된 일정은 표시하지 않음.
- 동일 일정은 `tag` + `renotify`로 중복 방지.
- 알림 권한은 첫 진입이 아니라 **사용자가 첫 알림을 설정하는 시점**에 요청.

## 커밋 컨벤션

Conventional Commits. `<type>(<scope>): <subject>`

- type: `feat` `fix` `a11y` `perf` `refactor` `test` `docs` `chore` `ci`
- scope: `tasks` `categories` `notifications` `sw` `chat` `map` `sync` `auth` `views` `ui` `deps`
- 관련 이슈는 본문에 `Closes #N`.
- 논리 단위로 쪼개서 커밋. 한 커밋에 여러 기능 섞지 않기.
- `main` / `develop` 직접 푸시 금지. `feature/*`, `fix/*` 브랜치 → PR → Squash Merge.

## 검증 (변경 후 반드시 실행)

```
npm run lint && npm run typecheck && npm run test
```

UI 변경 시 추가로: 키보드만으로 해당 플로우 완주, axe 위반 0건 확인.

## 하지 말아야 할 것

- `localStorage` / `sessionStorage`에 앱 데이터 저장 금지 → **IndexedDB(Dexie)** 사용.
- `any` 타입 금지.
- **API 키(LLM, 지도, VAPID, DB)를 클라이언트 코드에 두지 않기** → 서버 프록시 경유, `.env` + GitHub Secrets. `.env.example`만 커밋.
- 물리 삭제 금지 (soft delete).
- 챗봇 파싱 결과 자동 저장 금지 — 확인 카드 → 사용자 확정. 모호하면 되묻는다.
- 드래그만이 유일한 조작 수단이 되게 하지 않기.
- 색상만으로 구분되는 UI 만들지 않기.
- `sw.js`에 장기 캐시 헤더 적용 금지.
- 위치 정보를 서버에 상시 저장하지 않기.

## Service Worker 위치

`src/sw.ts` 가 소스이며 Workbox `injectManifest` 로 컴파일되어 `dist/sw.js` 로 배포된다. precache manifest 주입과 타입 검사가 필요해 `public/` 에 직접 두지 않는다.

## 확정된 설계 결정 (STEP 5 대비)

- **챗봇 런타임**: 서버 프록시에서 **Claude API 를 도구 호출(tool use) 방식**으로 호출한다. Claude Code 헤드리스는 개발 자동화용이며 사용자 요청을 받는 런타임으로는 쓰지 않는다. 사용자별 세션·작업 디렉터리가 필요하고 응답이 느리기 때문이다. API 키는 서버에만 둔다.
- **알림 채널**: Web Push 가 주 수단이다. 카카오톡은 보조 채널로 **카카오 로그인 + 나에게 보내기 API**(`/v2/api/talk/memo/default/send`, scope `talk_message`)를 쓴다. 사업자 등록과 검수가 필요 없고 사용자 본인에게만 발송된다. 서버가 사용자별 리프레시 토큰을 관리해야 한다. iOS 미설치 사용자의 폴백으로 특히 유용하다.
  - 알림톡은 개인사업자 등록 · 채널 비즈니스 인증 · 템플릿 사전 승인 · 중계사 계약이 필요하므로 사용자 규모가 커진 뒤로 미룬다.
  - 친구톡은 광고성으로 분류되어 야간 발송 제한을 받으므로 리마인더에 쓰지 않는다.

## 배포 환경 주의

- 배포는 GitHub Pages 서브경로(`/dayflow/`)다. **에셋을 절대경로로 참조하지 말 것.** `/favicon.svg` 같은 경로는 사이트 루트를 가리켜 404 가 된다. `import.meta.env.BASE_URL` 을 붙이거나 라우터 `Link` 를 쓴다.
- GitHub Pages 는 커스텀 헤더를 지원하지 않아 `sw.js` 가 `max-age=600` 으로 내려간다. 정확한 `no-cache` 가 필요하면 Cloudflare Pages 또는 Vercel 로 옮긴다.
