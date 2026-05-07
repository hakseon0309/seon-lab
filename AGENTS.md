# AGENTS.md

## 핵심 원칙

- 이 프로젝트는 Next.js `16.2.3`을 사용한다. App Router, 캐싱, lazy loading, navigation 관련 코드를 바꾸기 전에는 `node_modules/next/dist/docs/`의 해당 문서를 먼저 확인한다.
- UI 레이아웃이나 시각 구조를 변경할 때는 `docs/project-guide.md`의 UI 규칙을 따른다.
- 큰 변경은 작게 나누고, 기존 사용자 변경분을 되돌리지 않는다.

## 작업 기준

- 기본 언어는 한국어다.
- 서버 컴포넌트를 기본값으로 두고, 상호작용이 필요한 가장 작은 단위만 클라이언트 컴포넌트로 만든다.
- 불필요한 문서, 기본 템플릿 파일, 오래된 운영 스크립트는 남겨두지 않는다.
- 검증은 최소 `npm run lint`, 필요 시 `npx tsc --noEmit`, `npm run build` 순서로 진행한다.
