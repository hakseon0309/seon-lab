# 변경 이력

## 2026-05-07 접근 제한 게이트

- Google 로그인 후 `/access-code`에서 초대 코드를 확인한 사용자만 온보딩과 앱 화면으로 진입하도록 했다.
- `allowed_users`를 허용 이메일 원장으로, `user_profiles.access_granted_at`을 빠른 접근 확인 필드로 쓰는 구조를 추가했다.
- OAuth 콜백은 세션 교환 후 코드 게이트로 이동하고, 코드 통과 후 온보딩 미완료 사용자는 기존 온보딩 화면으로 이동한다.
- 대시보드, 온보딩, 설정, 팀, 게시판 등 주요 보호 화면에서 `access_granted_at`을 확인한다.
- 온보딩, 팀 생성/참여, 게시글 작성, 근무 교환 작성, 캘린더 동기화 API에 접근 코드 확인을 추가했다.
- Supabase 적용 SQL `supabase/access-gate.sql`을 추가했다.
- 검증: `npm run lint`, `npx tsc --noEmit`, `npm run build` 통과.

## 2026-05-05 문서/성능 정리

- 흩어진 가이드 문서를 `docs/project-guide.md`로 통합하고, 작업 기록은 `docs/changelog.md`, 남은 과제는 `docs/roadmap.md`로 분리했다.
- 기본 Next.js README를 프로젝트 전용 README로 교체했다.
- 직원 식당 메뉴 입력 스크립트에서 점수/코멘트 입력 로직을 제거했다.
- 사용하지 않는 create-next-app 기본 SVG 자산을 제거했다.
- 전역 i18n Provider와 미사용 i18n 파일을 제거했다.
- 모바일/데스크탑 nav의 알림·사이드바 중복 렌더링을 하나의 반응형 top nav로 정리했다.
- QR 스캐너, QR 생성기, 주요 모달을 동적 로딩하도록 바꿔 초기 클라이언트 번들을 줄였다.
- 초대 링크 로그인 복귀를 위해 `next` 파라미터 보존 흐름을 보완했다.
- 검증: `npm run lint`, `npx tsc --noEmit`, `npm run build` 통과.

## 2026-04-17 UI 구조 개편

- 공통 `PageHeader`를 도입해 모바일에서는 상단 nav 아래 고정, 데스크탑에서는 일반 흐름으로 제목 영역을 통일했다.
- `/dashboard`, `/teams`, `/teams/[id]`, `/settings`에 공통 헤더를 적용했다.
- 팀 페이지에 `PageFooter` 기반 하단 CTA를 추가하고, 인라인 팀 생성 폼을 모달 흐름으로 변경했다.
- 개인/팀 달력의 주말 색상, 오늘 날짜 강조, 테두리 규칙을 정리했다.
- `globals.css`의 색상 토큰을 배경, 텍스트, 상태, 달력, 간격 기준으로 재정리했다.
- `CreateTeamModal`, 외부 클릭 닫기, 팀 시프트 테이블 테두리 정리를 적용했다.
- 검증: `npx next build` 통과 기록.

## 2026-04-15 기능/운영 정리

- 사용하지 않는 `/signup` 페이지와 미들웨어 public route 항목을 제거했다.
- `Seon Lab` 표기를 `SEON LAB`으로 통일했다.
- 모바일 하단 탭바를 텍스트 중심으로 정리했다.
- 설정 화면의 이름, 다크 모드, 커플 영역, 관리자 진입 버튼을 정리했다.
- 회사 ICS 사용자에게 회사 팀 참여 버튼을 노출하는 흐름을 추가했다.
- 관리자 사용자/팀 관리 API와 UI를 추가했다.
- `파트너` 표기를 `상대방`으로 통일했다.
- Supabase 운영 SQL `supabase/session-2026-04-15.sql`을 추가했다.
- 검증: `npx tsc --noEmit` 통과 기록. 단, 당시 `scripts/insert-menu.ts`의 `dotenv` 관련 이슈는 기존 상태로 기록되어 있었다.

## 과거 분석 메모

- 2026-04-14 ICS 분석 결과, 구독 캘린더는 `VCALENDAR 2.0`, 시간대 `Asia/Seoul`, 이벤트 제목 `R770 - Hanam`, 위치 `Starfield Hanam` 중심의 매장 운영 일정으로 확인했다.
- 이름, 직원 정보, 직무, 참석자, 주최자 등 개인 식별 필드는 포함되지 않았다.
