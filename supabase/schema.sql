-- ============================================================
-- Seon Lab — Supabase SQL Schema
-- Supabase Dashboard → SQL Editor → New query → 붙여넣기 → Run
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 테이블 생성 (순서 중요: 참조 대상 먼저)
-- ────────────────────────────────────────────────────────────

create table public.user_profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  display_name text        not null default '',
  ics_url      text,
  last_synced  timestamptz,
  created_at   timestamptz not null default now()
);

create table public.events (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  uid        text        not null,
  summary    text,
  start_at   timestamptz not null,
  end_at     timestamptz not null,
  location   text,
  created_at timestamptz not null default now(),
  unique (user_id, uid)
);

create index idx_events_user_start on public.events (user_id, start_at);

create table public.teams (
  id                uuid        primary key default gen_random_uuid(),
  name              text        not null,
  invite_code       text        unique not null default encode(gen_random_bytes(6), 'hex'),
  invite_expires_at timestamptz,
  created_by        uuid        not null references auth.users(id) on delete cascade,
  created_at        timestamptz not null default now()
);

create table public.team_members (
  id        uuid        primary key default gen_random_uuid(),
  team_id   uuid        not null references public.teams(id) on delete cascade,
  user_id   uuid        not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);


-- ────────────────────────────────────────────────────────────
-- RLS 활성화
-- ────────────────────────────────────────────────────────────

alter table public.user_profiles enable row level security;
alter table public.events        enable row level security;
alter table public.teams         enable row level security;
alter table public.team_members  enable row level security;


-- ────────────────────────────────────────────────────────────
-- RLS 정책 (모든 테이블 생성 후 정의)
-- ────────────────────────────────────────────────────────────

-- user_profiles
create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

create policy "Team members can view each others profiles"
  on public.user_profiles for select
  using (
    id in (
      select tm2.user_id
      from public.team_members tm1
      join public.team_members tm2 on tm1.team_id = tm2.team_id
      where tm1.user_id = auth.uid()
    )
  );

-- events
create policy "Users can view own events"
  on public.events for select
  using (auth.uid() = user_id);

create policy "Users can view team member events"
  on public.events for select
  using (
    user_id in (
      select tm2.user_id
      from public.team_members tm1
      join public.team_members tm2 on tm1.team_id = tm2.team_id
      where tm1.user_id = auth.uid()
    )
  );

create policy "Users can insert own events"
  on public.events for insert
  with check (auth.uid() = user_id);

create policy "Users can update own events"
  on public.events for update
  using (auth.uid() = user_id);

-- teams
create policy "Team members can view their teams"
  on public.teams for select
  using (
    id in (select team_id from public.team_members where user_id = auth.uid())
  );

create policy "Anyone can look up team by invite code"
  on public.teams for select
  using (true);

create policy "Authenticated users can create teams"
  on public.teams for insert
  with check (auth.uid() = created_by);

-- team_members
create policy "Team members can view fellow members"
  on public.team_members for select
  using (
    team_id in (select team_id from public.team_members where user_id = auth.uid())
  );

create policy "Users can join teams"
  on public.team_members for insert
  with check (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- 트리거: 회원가입 시 user_profiles 자동 생성
-- ────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
