-- ============================================================
-- Seon Lab — Access Gate
-- Google 로그인 후 허용된 이메일 또는 초대 코드를 통과한 사용자만 앱에 진입한다.
-- ============================================================

alter table public.user_profiles
add column if not exists access_granted_at timestamptz;

create table if not exists public.allowed_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'admin'
    check (source in ('legacy', 'signup_code', 'admin')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (email = lower(email))
);

alter table public.allowed_users enable row level security;

create index if not exists idx_allowed_users_email_active
  on public.allowed_users (email)
  where revoked_at is null;

-- 기존 가입자는 배포 직후 끊기지 않도록 허용 명단과 빠른 통과 표시를 채운다.
insert into public.allowed_users (email, source)
select lower(email), 'legacy'
from auth.users
where email is not null
on conflict (email) do nothing;

update public.user_profiles profile
set access_granted_at = coalesce(profile.access_granted_at, now())
from auth.users auth_user
where profile.id = auth_user.id
  and auth_user.email is not null;
