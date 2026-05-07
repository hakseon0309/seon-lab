# SEON LAB

Apple 캘린더 구독 URL을 기반으로 개인 근무, 팀 근무, 근무 일정 교환, 알림을 한 곳에서 확인하는 Next.js 웹앱입니다.

## 빠른 시작

```bash
npm install
npm run dev
```

기본 개발 주소는 `http://localhost:3000`입니다.

## 주요 스크립트

```bash
npm run dev      # 개발 서버
npm run lint     # ESLint
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버
```

## 환경 변수

`.env.local`에 다음 값이 필요합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_CORP_TEAM_CODE=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
```

`NEXT_PUBLIC_CORP_TEAM_CODE`는 회사 팀 자동 참여 버튼에만 사용되며, 없으면 관련 UI가 숨겨집니다.

## 주요 경로

| 경로 | 설명 |
|---|---|
| `/` | Google 로그인 |
| `/dashboard` | 내 근무 달력, 즐겨찾기 팀, 오늘의 직원 식당 메뉴 |
| `/teams` | 팀 목록, 팀 생성/참여 |
| `/teams/[id]` | 팀 근무 달력, 멤버/초대/공유 설정 |
| `/boards/[slug]` | 게시판 목록 |
| `/boards/[slug]/[postId]` | 게시글 상세 |
| `/settings` | 프로필, 캘린더 URL, 알림, 실험 기능 |
| `/settings/beta` | 커플 기능 |
| `/admin` | 관리자 전용 사용자/팀 관리 |
| `/join/[invite_code]` | 초대 링크 진입 |

## 문서

- `docs/project-guide.md` — 개발, UI, 성능, 문서 정리 기준
- `docs/changelog.md` — 과거 작업 기록
- `docs/roadmap.md` — 남은 제품 과제

## 운영 메모

- Supabase SQL은 `supabase/` 폴더에 이력별로 보관되어 있습니다. 새 환경에 적용할 때는 `supabase/schema.sql`을 기준으로 필요한 패치 파일을 순서대로 확인하세요.
- 직원 식당 메뉴는 점수/코멘트 기능을 사용하지 않습니다. 메뉴 입력은 `cafeteria_menu_items.is_featured` 기준만 유지합니다.
- PWA 서비스 워커는 프로덕션 환경에서만 등록됩니다.
