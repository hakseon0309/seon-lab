-- ============================================================
-- Seon Lab — Couple Feature Schema
-- Supabase Dashboard → SQL Editor → New query → 붙여넣기 → Run
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. user_profiles에 couple_code 추가
-- ────────────────────────────────────────────────────────────

alter table public.user_profiles
add column if not exists couple_code text unique default encode(gen_random_bytes(3), 'hex');

update public.user_profiles
set couple_code = encode(gen_random_bytes(3), 'hex')
where couple_code is null;

alter table public.user_profiles
alter column couple_code set not null;

-- ────────────────────────────────────────────────────────────
-- 2. 신규 가입 시 couple_code 자동 생성 (트리거 업데이트)
-- ────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, display_name, couple_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    encode(gen_random_bytes(3), 'hex')
  );
  return new;
end;
$$ language plpgsql security definer;

-- ────────────────────────────────────────────────────────────
-- 3. couple_requests 테이블
-- ────────────────────────────────────────────────────────────

create table if not exists public.couple_requests (
  id          uuid        primary key default gen_random_uuid(),
  requester_id uuid       not null references auth.users(id) on delete cascade,
  partner_id  uuid        not null references auth.users(id) on delete cascade,
  status      text        not null default 'pending' check (status in ('pending', 'accepted')),
  created_at  timestamptz not null default now(),
  unique (requester_id, partner_id)
);

alter table public.couple_requests enable row level security;

create policy "Users can view their couple requests"
  on public.couple_requests for select
  using (auth.uid() = requester_id or auth.uid() = partner_id);

create policy "Users can create couple requests"
  on public.couple_requests for insert
  with check (auth.uid() = requester_id);

create policy "Users can update couple requests"
  on public.couple_requests for update
  using (auth.uid() = partner_id or auth.uid() = requester_id);

create policy "Users can delete couple requests"
  on public.couple_requests for delete
  using (auth.uid() = requester_id or auth.uid() = partner_id);

-- ────────────────────────────────────────────────────────────
-- 4. RLS — 커플 파트너 프로필 조회 허용
-- ────────────────────────────────────────────────────────────

create policy "Users in couple requests can view partner profiles"
  on public.user_profiles for select
  using (
    id in (
      select partner_id from public.couple_requests where requester_id = auth.uid()
      union
      select requester_id from public.couple_requests where partner_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
-- 5. RLS — 커플 파트너의 이벤트 조회 허용
-- ────────────────────────────────────────────────────────────

create policy "Users can view couple partner events"
  on public.events for select
  using (
    user_id in (
      select case when requester_id = auth.uid() then partner_id else requester_id end
      from public.couple_requests
      where (requester_id = auth.uid() or partner_id = auth.uid())
        and status = 'accepted'
    )
  );
