-- ============================================================
-- Seon Lab — avatars, team favorites, existing boards compatibility
-- Supabase Dashboard → SQL Editor → New query → 붙여넣기 → Run
-- ============================================================

alter table public.user_profiles
  add column if not exists avatar_url text,
  add column if not exists avatar_path text;

alter table public.teams
  add column if not exists image_url text,
  add column if not exists image_path text;

create table if not exists public.team_favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  team_id    uuid not null references public.teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, team_id)
);

-- The project already has a richer boards schema:
-- boards.write_role / allow_comments / allow_anonymous / has_status
-- board_posts.body / is_pinned / status / is_anonymous
-- Keep this migration compatible with that shape.
alter table public.user_profiles
  add column if not exists role text not null default 'member'
    check (role in ('admin','leader','member'));

update public.user_profiles
set role = 'admin'
where is_admin = true and role <> 'admin';

alter table public.boards
  alter column description set default '',
  alter column write_role set default 'member';

create index if not exists board_posts_list_idx
  on public.board_posts (board_id, is_pinned desc, created_at desc);

create or replace function public.set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists board_posts_updated_at on public.board_posts;
create trigger board_posts_updated_at
  before update on public.board_posts
  for each row execute function public.set_updated_at();

create or replace function public.current_role_level() returns int as $$
  select case
    when auth.uid() is null then 0
    when exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')  then 3
    when exists (select 1 from public.user_profiles where id = auth.uid() and role = 'leader') then 2
    else 1
  end;
$$ language sql stable;

create or replace function public.required_role_level(r text) returns int as $$
  select case r
    when 'admin'  then 3
    when 'leader' then 2
    when 'member' then 1
    else 99
  end;
$$ language sql immutable;

insert into public.boards (
  slug,
  name,
  description,
  write_role,
  allow_comments,
  allow_anonymous,
  has_status,
  sort_order
)
values
  ('announcements', '공지사항', '서비스 운영과 중요한 안내를 확인하는 게시판', 'admin', true, false, false, 10),
  ('patch-notes', '패치노트', 'SEON LAB의 업데이트 내역을 모아보는 게시판', 'admin', false, false, false, 20),
  ('feedback', '피드백 게시판', '불편한 점과 개선 아이디어를 남기는 게시판', 'member', true, true, true, 30)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  write_role = excluded.write_role,
  allow_comments = excluded.allow_comments,
  allow_anonymous = excluded.allow_anonymous,
  has_status = excluded.has_status,
  sort_order = excluded.sort_order;

alter table public.team_favorites enable row level security;
alter table public.boards enable row level security;
alter table public.board_posts enable row level security;
alter table public.board_comments enable row level security;

drop policy if exists "Users can manage own team favorites" on public.team_favorites;
create policy "Users can manage own team favorites"
  on public.team_favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "boards_select_all" on public.boards;
create policy "boards_select_all" on public.boards for select using (true);

drop policy if exists "boards_admin_write" on public.boards;
create policy "boards_admin_write" on public.boards for all
  using (public.current_role_level() = 3)
  with check (public.current_role_level() = 3);

drop policy if exists "posts_select_all" on public.board_posts;
create policy "posts_select_all" on public.board_posts for select using (true);

drop policy if exists "posts_insert_by_role" on public.board_posts;
create policy "posts_insert_by_role" on public.board_posts for insert with check (
  exists (
    select 1 from public.boards b
    where b.id = board_id
      and public.current_role_level() >= public.required_role_level(b.write_role)
  )
  and (
    (is_anonymous = false and author_id = auth.uid())
    or (
      is_anonymous = true
      and exists (
        select 1 from public.boards b2
        where b2.id = board_id and b2.allow_anonymous = true
      )
      and (author_id is null or author_id = auth.uid())
    )
  )
);

drop policy if exists "posts_update_author_or_admin" on public.board_posts;
create policy "posts_update_author_or_admin" on public.board_posts
  for update
  using (author_id = auth.uid() or public.current_role_level() = 3)
  with check (author_id = auth.uid() or public.current_role_level() = 3);

drop policy if exists "posts_delete_author_or_admin" on public.board_posts;
create policy "posts_delete_author_or_admin" on public.board_posts
  for delete
  using (author_id = auth.uid() or public.current_role_level() = 3);

drop policy if exists "Authors can update own board posts" on public.board_posts;
drop policy if exists "Authenticated users can create board posts" on public.board_posts;
drop policy if exists "Authenticated users can view board posts" on public.board_posts;

drop policy if exists "comments_select_all" on public.board_comments;
create policy "comments_select_all" on public.board_comments for select using (true);

drop policy if exists "comments_insert_if_allowed" on public.board_comments;
create policy "comments_insert_if_allowed" on public.board_comments for insert with check (
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
create policy "comments_update_author_or_admin" on public.board_comments
  for update
  using (author_id = auth.uid() or public.current_role_level() = 3)
  with check (author_id = auth.uid() or public.current_role_level() = 3);

drop policy if exists "comments_delete_author_or_admin" on public.board_comments;
create policy "comments_delete_author_or_admin" on public.board_comments
  for delete
  using (author_id = auth.uid() or public.current_role_level() = 3);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;
