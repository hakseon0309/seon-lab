# SEON LAB 프로젝트 가이드

이 문서는 개발 규칙, UI 규칙, 성능 기준, 운영 메모를 한 곳에 모아둔 기준 문서입니다.

## 개발 원칙

- Next.js `16.2.3` 기준으로 작업한다. 익숙한 Next.js 지식과 다를 수 있으니, App Router·캐싱·프리패치·lazy loading·Route Handler를 바꿀 때는 `node_modules/next/dist/docs/`의 관련 문서를 먼저 본다.
- 서버 컴포넌트를 기본값으로 둔다. `useState`, `useEffect`, 이벤트 핸들러, 브라우저 API, 실시간 구독이 필요한 가장 작은 리프 컴포넌트에만 `"use client"`를 붙인다.
- 기능 하나에만 쓰이는 추상화는 만들지 않는다. 중복이 실제 유지보수 비용을 만들 때만 공통화한다.
- 기존 사용자 변경분을 되돌리지 않는다. 관련 없는 죽은 코드나 파일을 발견하면, 사용자의 정리 요청 범위 안에서만 제거한다.
- 구조 변경 후에는 `npm run lint`를 기본 검증으로 돌리고, 타입/빌드 영향이 있으면 `npx tsc --noEmit`, `npm run build`까지 확인한다.

## 에이전트 작업 원칙

- 구현 전에 요구사항, 가정, 불확실한 지점을 먼저 정리한다. 해석이 여러 개인 요청은 조용히 하나를 고르지 않고 차이를 드러낸다.
- 단순한 해결책을 우선한다. 요청받지 않은 기능, 한 번만 쓰는 추상화, 미래를 대비한 설정값은 만들지 않는다.
- 변경은 요청과 직접 연결된 범위에 한정한다. 주변 코드의 취향 차이, 포맷, 오래된 죽은 코드는 현재 작업과 무관하면 언급만 하고 건드리지 않는다.
- 새로 만든 변경 때문에 생긴 미사용 import, 변수, 함수, 파일은 함께 정리한다.
- 큰 작업은 성공 기준을 먼저 세운다. 예: 버그 수정은 재현과 검증, 리팩터링은 기존 동작 유지와 테스트 통과를 기준으로 삼는다.
- 200줄로 풀 수 있는 문제가 50줄로도 해결된다면 다시 줄인다. 시니어 개발자가 보기에 과한 구조인지 계속 점검한다.

## 폴더 기준

- `src/app`: 라우트, 서버 데이터 로딩, Route Handler.
- `src/components`: UI 컴포넌트. 기능별로 커지면 `boards`, `teams`, `calendar`, `settings`, `notifications`처럼 하위 폴더로 분리한다.
- `src/lib`: 서버/클라이언트 API, 순수 유틸, 도메인 로직. 브라우저 전용 파일은 파일명이나 위치에서 명확히 드러나게 한다.
- `docs`: 현재 의사결정에 필요한 문서만 둔다. 과거 작업 기록은 `docs/changelog.md`, 앞으로 할 일은 `docs/roadmap.md`로 모은다.
- `supabase`: DB 스키마와 패치 이력. 삭제보다 적용 순서와 현재성 표시를 우선한다.

## 라우트와 접근성

- 상단/하단 기본 내비게이션은 `/dashboard`, `/teams`, `/settings`를 제공한다.
- 게시판은 사이드바의 게시판 목록에서 접근한다.
- `/access-code`는 Google 로그인 후 앱 진입 전 초대 코드를 확인하는 게이트다.
- `/settings/beta`는 설정의 “실험적 기능”에서 접근한다.
- `/admin`은 관리자 계정에만 설정 화면에서 노출한다.
- `/join/[invite_code]`는 초대 링크와 QR 진입 전용이다.
- 사용자가 URL 직접 입력 외에 접근해야 하는 페이지가 생기면, 반드시 버튼이나 링크를 함께 추가한다.

## 접근 제한

- 앱 진입은 Google 로그인 후 초대 코드 확인을 거친 사용자만 허용한다. 현재 초대 코드는 서버 코드의 `SIGNUP_ACCESS_CODE`에서 관리한다.
- `allowed_users`는 허용 이메일의 원장이고, `user_profiles.access_granted_at`은 페이지/API에서 빠르게 확인하는 통과 표시다.
- 기존 가입자는 `supabase/access-gate.sql`의 backfill로 `allowed_users`와 `access_granted_at`을 채운다.
- OAuth 콜백, `/access-code`, `/api/access-code`, 정적/PWA 자산은 접근 코드 검사와 충돌하지 않아야 한다.
- 보호 페이지를 새로 만들면 `access_granted_at`을 확인하고, 없으면 `/access-code?next=...`로 보낸다.
- 사용자가 데이터를 만들거나 동기화하는 API는 서버에서 접근 코드 통과 여부를 확인한다.
- Proxy에서 매 요청마다 `allowed_users`를 조회하지 않는다. 성능을 위해 코드 입력/관리 시점에만 원장을 조회하고, 일반 화면에서는 프로필의 통과 표시를 쓴다.

## 레이아웃

- 표준 상위 페이지는 팀 페이지와 같은 셸을 따른다.

```tsx
<main className="mx-auto w-full max-w-lg pb-tabbar lg:pb-8">
  <div className="px-4 lg:px-0">{/* page content */}</div>
</main>
```

- 캘린더나 관리자 테이블처럼 넓은 화면은 같은 패턴에서 `max-w-*`만 넓힌다.
- 표준 페이지에서 `main`에 직접 `px-4`를 붙이지 않는다. 내부 래퍼에서 좌우 여백을 관리한다.
- 모바일 상단 nav는 고정이므로 임의 top padding을 넣지 않고 `Nav`의 spacer와 `PageHeader` 구조를 따른다.
- 모바일 하단 탭바는 고정이다. 마지막 요소가 탭바에 붙지 않도록 `pb-tabbar` 또는 `pb-floating-footer`를 사용한다.

## 내비게이션과 PageHeader

- `SEON LAB` 브랜드 링크는 항상 `/dashboard`로 이동한다.
- 모바일 상단 nav와 하단 nav 높이는 `h-14`로 유지한다.
- 모든 일반 앱 화면은 `<Nav />`, `<PageHeader />`, `<main>` 순서를 따른다.
- 상위 페이지의 `PageHeader`에는 보통 `<h1 className="text-xl font-bold">`만 둔다.
- 하위 페이지는 `BackButton`과 제목을 같은 flex 행에 둔다.
- 페이지 설명이나 보조 문구는 헤더가 아니라 본문에 둔다.

## 카드와 인터랙션

- 기본 카드:

```tsx
className="rounded-lg border p-4"
style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}
```

- 버튼처럼 동작하는 링크와 카드는 `interactive-press`를 사용한다.
- 비동기/파괴적 액션은 로컬 disabled/loading 상태를 둔다.
- 원형 또는 둥근 사각형의 장식적 텍스트 버튼보다 명확한 버튼, 토큰, 아이콘을 우선한다.

## 색상과 타이포그래피

- 색상은 `src/app/globals.css`의 토큰을 우선한다.
- 자주 쓰는 토큰: `--bg-base`, `--bg-card`, `--bg-surface`, `--text-primary`, `--text-secondary`, `--text-muted`, `--primary`, `--primary-light`, `--border`, `--border-light`, `--error`, `--success`.
- 페이지 제목은 `text-xl font-bold`, 카드 제목은 `text-sm font-medium` 또는 `text-sm font-semibold`, 보조 텍스트는 `--text-muted`나 `--text-secondary`를 쓴다.

## 로딩 상태

- 스켈레톤 UI는 사용하지 않는다.
- 별도 로딩 문구보다 “dimmed backdrop + centered spinner” 패턴을 우선한다.
- 앱 크롬인 `Nav`, `PageHeader`는 로딩 중에도 보존한다.
- 빠른 전환에서는 로딩 오버레이가 번쩍이지 않아야 한다. 짧은 지연 뒤 표시하고, 즉각 반응은 버튼 press feedback으로 전달한다.

## 오버레이

- 모달, 사이드 패널, 드로어는 바깥 클릭과 `Escape`로 닫혀야 한다.
- 오버레이가 열리면 배경 스크롤을 잠그고, 닫을 때 이전 scroll position을 복원한다.
- 닫기 버튼을 추가하기보다 바깥 클릭/`Escape`를 기본으로 한다. 단, 접근성상 명시적 닫기 버튼이 필요한 화면은 예외로 한다.

## 달력

- 오늘 셀은 내부 outline으로 강조한다.

```tsx
style={{
  outline: "1.5px solid var(--today-border)",
  outlineOffset: "-1.5px",
  position: "relative",
  zIndex: 1,
}}
```

- 오늘 강조에 `boxShadow: inset ...`을 쓰지 않는다.
- 오늘 숫자는 `font-bold`로 표시한다.
- 주말/공휴일 스타일은 `calendar-style` 유틸과 글로벌 토큰을 재사용한다.

## 성능 기준

- nav, 알림, 사이드바처럼 전역에 가까운 클라이언트 컴포넌트는 중복 렌더링하지 않는다.
- 큰 모달, QR 스캐너, QR 생성기, 실시간 채팅 상세처럼 클릭 후에 필요한 기능은 동적 import로 분리한다.
- `select("*")`는 피하고 화면에 필요한 컬럼만 조회한다.
- 서로 의존하지 않는 Supabase 쿼리는 `Promise.all`로 병렬화한다.
- 사용자별 데이터는 무리하게 정적 캐싱하지 않는다. 대신 서버 컴포넌트, 프리패치, 작은 클라이언트 번들로 체감 속도를 만든다.
- 서비스 워커는 앱 shell을 과하게 가로채지 않고, 해시가 붙은 `_next/static` 자산과 PWA 메타 자산만 안전하게 캐시한다.

## 직원 식당 메뉴

- 점수와 코멘트 기능은 사용하지 않는다.
- 메뉴 데이터는 `cafeteria_menu_items`에 날짜, 식사 타입, 메뉴명, `is_featured`, 정렬 순서만 저장한다.
- 이미지에서 강조색/빨간색으로 표시된 메뉴만 `is_featured: true`로 둔다.

## 변경 전 점검

- 모바일/데스크탑에서 좌우 여백이 주변 페이지와 맞는가?
- 고정 nav, PageHeader, 하단 탭바가 본문을 가리지 않는가?
- 긴 한국어가 버튼이나 카드 안에서 겹치지 않는가?
- 클릭, active, disabled, async 상태가 모두 구분되는가?
- 새 페이지를 추가했다면 앱 안에서 접근 가능한 링크가 있는가?
