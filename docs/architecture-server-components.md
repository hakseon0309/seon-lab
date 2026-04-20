# 컴포넌트 아키텍처 원칙

## 기본 방향

**서버 컴포넌트가 기본값이다.** 클라이언트 컴포넌트는 반드시 필요한 경우에만 사용한다.

이 앱은 Next.js App Router를 사용하므로, 데이터 조회가 중심인 페이지는 서버 컴포넌트로 구성한다.
클라이언트 상태(useState, useEffect)나 브라우저 API가 필요한 부분만 최소 단위로 분리해 "use client"를 붙인다.

## 서버 컴포넌트 장점

- **페이지 전환 UX**: 이전 페이지가 유지되다 새 페이지가 준비되면 교체됨. 빈 화면/스피너 없이 "뿅" 전환
- **로딩 상태 없음**: 서버에서 데이터를 미리 렌더링하므로 클라이언트 fetch 대기 없음
- **JS 번들 감소**: 데이터 fetching 코드가 서버에서만 실행됨
- **보안**: Supabase 쿼리 로직이 클라이언트에 노출되지 않음

## 클라이언트 컴포넌트를 쓰는 기준

다음 중 하나라도 해당하면 "use client" 필요:

- `useState`, `useReducer` 등 상태 관리
- `useEffect`, `useRef` 등 사이드 이펙트
- `useRouter`, `useSearchParams` 등 Next.js 클라이언트 훅
- `window`, `document` 등 브라우저 API
- 이벤트 핸들러 (onClick, onSubmit 등)
- WebSocket, 실시간 데이터 (채팅 등)

## 클라이언트 컴포넌트는 리프(leaf)에 배치

```
page.tsx (서버 - 데이터 fetch)
  └─ <TeamList teams={teams} />         ← 서버 (순수 렌더링)
  └─ <CorpTeamSection teams={corps} />  ← 클라이언트 (join 버튼 상태)
  └─ <TeamsFooterActions />             ← 클라이언트 (모달 상태)
```

"use client"는 트리 아래쪽(리프)에 있을수록 서버 렌더링 범위가 넓어진다.
클라이언트 컴포넌트 안에 서버 컴포넌트를 import할 수 없으므로,
클라이언트 경계를 최대한 작게 유지한다.

## 데이터 mutation 후 캐시 갱신

서버 컴포넌트 페이지는 Next.js가 캐싱하므로, 데이터를 변경하는 API 핸들러에서
`revalidatePath('/해당경로')`를 호출해 캐시를 무효화한다.

```ts
// 예: /api/teams/route.ts
import { revalidatePath } from "next/cache";

revalidatePath("/teams"); // 팀 생성/가입 후 /teams 캐시 무효화
```

## 현재 상태 (2026-04-20 기준)

| 페이지 | 방식 | 비고 |
|---|---|---|
| `/` | 클라이언트 | Google OAuth는 브라우저 필요 — 유지 |
| `/login` | 서버 | redirect 전용 |
| `/dashboard` | 서버 | ✅ |
| `/teams` | 서버 | ✅ |
| `/teams/[id]` | 서버 | ✅ `<TeamView>` 클라이언트 분리 |
| `/settings` | 서버 | ✅ `<SettingsForm>` 클라이언트 분리 |
| `/settings/beta` | 서버 | ✅ |
| `/admin` | 서버 | ✅ `<AdminPanel>` 클라이언트 분리 |
| `/join/[invite_code]` | 클라이언트 | 인증+가입 즉시 처리 흐름 — 유지 |

## 미래 채팅 기능 추가 시

채팅은 실시간 업데이트(WebSocket)가 필요하므로 클라이언트 컴포넌트로 구현한다.
단, 초기 메시지 목록은 서버에서 fetch해 전달하고, 이후 실시간 업데이트만 클라이언트가 담당한다.

```
/chat/page.tsx (서버 - 초기 메시지 fetch)
  └─ <ChatWindow initialMessages={messages} /> ← 클라이언트
       └─ <MessageList />  ← 클라이언트
       └─ <MessageInput /> ← 클라이언트
```
