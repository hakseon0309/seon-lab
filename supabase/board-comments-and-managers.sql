-- ============================================================
-- Seon Lab — board comments table + per-board managers
-- Supabase Dashboard → SQL Editor → New query → 붙여넣기 → Run
-- "Run and enable RLS" 버튼을 눌러도 되고, 아래 문장들이 이미 RLS 와 정책을
-- 모두 enable + 생성하므로 "Run" 만 눌러도 안전하게 적용됩니다.
-- ============================================================

-- ────────────────────────────────
--  board_comments : 글 댓글
-- ────────────────────────────────
create table if not exists public.board_comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.board_posts(id) on delete cascade,
  author_id    uuid references auth.users(id) on delete set null,
  is_anonymous boolean not null default false,
  body         text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists board_comments_post_idx
  on public.board_comments (post_id, created_at);

drop trigger if exists board_comments_updated_at on public.board_comments;
create trigger board_comments_updated_at
  before update on public.board_comments
  for each row execute function public.set_updated_at();

alter table public.board_comments enable row level security;

drop policy if exists "comments_select_all" on public.board_comments;
create policy "comments_select_all"
  on public.board_comments for select using (true);

drop policy if exists "comments_insert_if_allowed" on public.board_comments;
create policy "comments_insert_if_allowed"
  on public.board_comments for insert with check (
    auth.uid() is not null
    and exists (
      select 1 from public.board_posts p
      join public.boards b on b.id = p.board_id
      where p.id = post_id and b.allow_comments = true
    )
    and (
      (is_anonymous = false and author_id = auth.uid())
      or (
        is_anonymous = true
        and exists (
          select 1 from public.board_posts p
          join public.boards b on b.id = p.board_id
          where p.id = post_id and b.allow_anonymous = true
        )
      )
    )
  );

drop policy if exists "comments_update_author_or_admin" on public.board_comments;
create policy "comments_update_author_or_admin"
  on public.board_comments for update
  using (author_id = auth.uid() or public.current_role_level() = 3)
  with check (author_id = auth.uid() or public.current_role_level() = 3);

drop policy if exists "comments_delete_author_or_admin" on public.board_comments;
create policy "comments_delete_author_or_admin"
  on public.board_comments for delete
  using (author_id = auth.uid() or public.current_role_level() = 3);

-- ────────────────────────────────
--  board_managers : 게시판별 관리자
-- ────────────────────────────────
create table if not exists public.board_managers (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references public.boards(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (board_id, user_id)
);

create index if not exists board_managers_board_idx
  on public.board_managers (board_id);

alter table public.board_managers enable row level security;

-- 로그인한 사용자는 관리자 목록 조회 가능 (UI 렌더용)
drop policy if exists "board_managers_select_all" on public.board_managers;
create policy "board_managers_select_all"
  on public.board_managers for select
  using (auth.uid() is not null);

-- 전역 admin 만 관리자 임명/해제 가능
drop policy if exists "board_managers_admin_write" on public.board_managers;
create policy "board_managers_admin_write"
  on public.board_managers for all
  using (public.current_role_level() = 3)
  with check (public.current_role_level() = 3);

-- Helper: 현재 사용자가 해당 게시판의 관리자인가? (전역 admin 은 항상 true)
create or replace function public.is_board_manager(b_id uuid) returns boolean as $$
  select exists (
    select 1 from public.board_managers
    where board_id = b_id and user_id = auth.uid()
  ) or public.current_role_level() = 3;
$$ language sql stable;

-- 게시판 관리자는 해당 게시판 글의 상태 변경 등 업데이트 가능
drop policy if exists "posts_status_update_by_manager" on public.board_posts;
create policy "posts_status_update_by_manager" on public.board_posts
  for update
  using (public.is_board_manager(board_id))
  with check (public.is_board_manager(board_id));
