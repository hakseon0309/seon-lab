-- ============================================================
-- SEON LAB — 2026-04-15 세션 통합 SQL
-- Supabase Dashboard → SQL Editor → New query → 붙여넣고 Run
-- 모두 idempotent하게 작성되어 있어 여러 번 실행해도 안전합니다.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. 카페테리아 지점명 띄어쓰기 수정
--    "스타필드하남점" → "스타필드 하남점"
-- ────────────────────────────────────────────────────────────

update public.cafeteria_locations
   set name = '스타필드 하남점'
 where name = '스타필드하남점';


-- ────────────────────────────────────────────────────────────
-- 2. 관리자(admin) 권한 컬럼 추가
--    user_profiles.is_admin (boolean, default false)
-- ────────────────────────────────────────────────────────────

alter table public.user_profiles
  add column if not exists is_admin boolean not null default false;


-- ────────────────────────────────────────────────────────────
-- 3. 본인 계정을 관리자로 승격 (필요 시 이메일 수정)
--    /api/admin/* 라우트는 service_role + is_admin 체크로 보호됩니다.
-- ────────────────────────────────────────────────────────────

update public.user_profiles
   set is_admin = true
 where id = (select id from auth.users where email = 'hakseon0309@gmail.com');
