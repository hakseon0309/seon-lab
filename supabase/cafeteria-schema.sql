-- ============================================================
-- Seon Lab — Cafeteria Menu Tables
-- Supabase Dashboard → SQL Editor → New query → 붙여넣기 → Run
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. 지점 정보
-- ────────────────────────────────────────────────────────────

create table public.cafeteria_locations (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null unique,
  lunch_start  time        not null default '11:30',
  lunch_end    time        not null default '14:30',
  dinner_start time        not null default '16:40',
  dinner_end   time        not null default '18:30',
  created_at   timestamptz not null default now()
);


-- ────────────────────────────────────────────────────────────
-- 2. 메뉴 항목 (날짜 + 끼니 + 개별 메뉴)
-- ────────────────────────────────────────────────────────────

create table public.cafeteria_menu_items (
  id          uuid        primary key default gen_random_uuid(),
  location_id uuid        not null references public.cafeteria_locations(id) on delete cascade,
  date        date        not null,
  meal_type   text        not null check (meal_type in ('lunch', 'dinner', 'salad')),
  item_name   text        not null,
  is_featured boolean     not null default false,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now(),
  unique (location_id, date, meal_type, item_name)
);

create index idx_cafeteria_menu_date on public.cafeteria_menu_items (location_id, date);


-- ────────────────────────────────────────────────────────────
-- 3. 끼니별 점수 & 코멘트
-- ────────────────────────────────────────────────────────────

create table public.cafeteria_meal_scores (
  id          uuid        primary key default gen_random_uuid(),
  location_id uuid        not null references public.cafeteria_locations(id) on delete cascade,
  date        date        not null,
  meal_type   text        not null check (meal_type in ('lunch', 'dinner', 'salad')),
  score       numeric(2,1) not null check (score >= 0 and score <= 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (location_id, date, meal_type)
);


-- ────────────────────────────────────────────────────────────
-- RLS — 모든 인증 사용자가 읽기 가능, 쓰기는 service_role만
-- ────────────────────────────────────────────────────────────

alter table public.cafeteria_locations   enable row level security;
alter table public.cafeteria_menu_items  enable row level security;
alter table public.cafeteria_meal_scores enable row level security;

create policy "Anyone authenticated can view locations"
  on public.cafeteria_locations for select
  using (auth.uid() is not null);

create policy "Anyone authenticated can view menu items"
  on public.cafeteria_menu_items for select
  using (auth.uid() is not null);

create policy "Anyone authenticated can view meal scores"
  on public.cafeteria_meal_scores for select
  using (auth.uid() is not null);


-- ────────────────────────────────────────────────────────────
-- 초기 데이터: 스타필드하남점
-- ────────────────────────────────────────────────────────────

insert into public.cafeteria_locations (name, lunch_start, lunch_end, dinner_start, dinner_end)
values ('스타필드하남점', '11:30', '14:30', '16:40', '18:30');
