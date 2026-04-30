-- ============================================================
-- Seon Lab — 시프트 교환 게시판 + 알림 (v2)
-- Supabase Dashboard → SQL Editor → New query → 통째로 붙여넣기 → Run
--
-- 사전 준비:
--   1) Dashboard → Database → Extensions 에서 `pg_cron` 이 활성화돼 있어야
--      매일 자정 KST 에 완료 후 3일이 지난 근무 교환 글이 자동 삭제됨.
--      (이 스크립트에서 create extension if not exists pg_cron 도 시도.)
--   2) 기존 community-and-avatars.sql 가 이미 적용돼 있어야 함
--      (current_role_level, set_updated_at, board_posts, board_comments 사용).
-- ============================================================

create extension if not exists pg_cron;

-- ------------------------------------------------------------
-- 1) boards 확장 : kind (post / chat), team_scoped
-- ------------------------------------------------------------
alter table public.boards
  add column if not exists kind text not null default 'post'
    check (kind in ('post','chat')),
  add column if not exists team_scoped boolean not null default false;

-- ------------------------------------------------------------
-- 2) board_posts 확장 : team_id / swap_status / swap_date / completed_at
-- ------------------------------------------------------------
alter table public.board_posts
  add column if not exists team_id uuid references public.teams(id) on delete cascade,
  add column if not exists swap_status text
    check (swap_status in ('open','done')),
  add column if not exists swap_date date,
  add column if not exists completed_at timestamptz;

create index if not exists board_posts_team_idx
  on public.board_posts (team_id);

create index if not exists board_posts_swap_status_idx
  on public.board_posts (swap_status)
  where swap_status is not null;

-- ------------------------------------------------------------
-- 3) 조회 정책 교체 : 팀 scoped 글은 해당 팀 멤버만 볼 수 있음
--    기존 공지/패치노트/피드백은 team_id is null 이라 누구나 조회됨 (역호환 OK)
-- ------------------------------------------------------------
drop policy if exists "posts_select_all" on public.board_posts;
drop policy if exists "posts_select_visible" on public.board_posts;
create policy "posts_select_visible"
  on public.board_posts for select using (
    team_id is null
    or author_id = auth.uid()
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = board_posts.team_id and tm.user_id = auth.uid()
    )
    or public.current_role_level() = 3
  );

-- ------------------------------------------------------------
-- 4) board_messages : 시프트 교환 전용 채팅 메시지
-- ------------------------------------------------------------
create table if not exists public.board_messages (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.board_posts(id) on delete cascade,
  author_id  uuid not null references auth.users(id) on delete cascade,
  body       text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists board_messages_post_idx
  on public.board_messages (post_id, created_at);

alter table public.board_messages enable row level security;

-- 읽기 : 글 작성자 본인 / 해당 팀 멤버 / admin
drop policy if exists "messages_read_by_team" on public.board_messages;
create policy "messages_read_by_team"
  on public.board_messages for select using (
    exists (
      select 1 from public.board_posts p
      where p.id = post_id
        and (
          p.author_id = auth.uid()
          or exists (
            select 1 from public.team_members tm
            where tm.team_id = p.team_id and tm.user_id = auth.uid()
          )
          or public.current_role_level() = 3
        )
    )
  );

-- 쓰기 : 작성자 본인 또는 팀 멤버 + 글이 open 상태일 때만
drop policy if exists "messages_insert_by_team" on public.board_messages;
create policy "messages_insert_by_team"
  on public.board_messages for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.board_posts p
      where p.id = post_id
        and coalesce(p.swap_status, 'open') = 'open'
        and (
          p.author_id = auth.uid()
          or exists (
            select 1 from public.team_members tm
            where tm.team_id = p.team_id and tm.user_id = auth.uid()
          )
        )
    )
  );

-- 삭제 : 메시지 작성자 본인 / admin
drop policy if exists "messages_delete_author_or_admin" on public.board_messages;
create policy "messages_delete_author_or_admin"
  on public.board_messages for delete using (
    author_id = auth.uid() or public.current_role_level() = 3
  );

-- ------------------------------------------------------------
-- 5) notifications : 글 단위로 병합된 알림
--    (user_id, post_id, kind) 가 유일. 메시지/댓글은 각자 kind 가 달라 분리됨.
-- ------------------------------------------------------------
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  kind          text not null check (kind in ('message','comment')),
  post_id       uuid not null references public.board_posts(id) on delete cascade,
  last_actor_id uuid references auth.users(id) on delete set null,
  preview       text,
  unread_count  int  not null default 1,
  read_at       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 기존 스키마와의 호환을 위해 column 을 개별 add (이미 있으면 noop)
alter table public.notifications
  add column if not exists last_actor_id uuid references auth.users(id) on delete set null,
  add column if not exists preview       text,
  add column if not exists unread_count  int not null default 1,
  add column if not exists updated_at    timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'notifications_user_post_kind_key'
  ) then
    alter table public.notifications
      add constraint notifications_user_post_kind_key
      unique (user_id, post_id, kind);
  end if;
end $$;

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read_at, updated_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_own_rw" on public.notifications;
create policy "notifications_own_rw"
  on public.notifications for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- 6) 알림 트리거 : 메시지 → 글 작성자에게 (글 단위 병합)
-- ------------------------------------------------------------
create or replace function public.fn_notify_message()
returns trigger as $$
declare
  post_author uuid;
begin
  select author_id into post_author
    from public.board_posts where id = NEW.post_id;

  if post_author is null or post_author = NEW.author_id then
    return NEW;
  end if;

  insert into public.notifications
    (user_id, kind, post_id, last_actor_id, preview, unread_count, updated_at)
  values
    (post_author, 'message', NEW.post_id, NEW.author_id,
     left(NEW.body, 80), 1, now())
  on conflict (user_id, post_id, kind) do update set
    last_actor_id = NEW.author_id,
    preview       = left(NEW.body, 80),
    unread_count  = case when notifications.read_at is not null
                         then 1
                         else notifications.unread_count + 1
                    end,
    read_at       = null,
    updated_at    = now();
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists board_messages_notify on public.board_messages;
create trigger board_messages_notify
  after insert on public.board_messages
  for each row execute function public.fn_notify_message();

-- ------------------------------------------------------------
-- 7) 알림 트리거 : 댓글 → 글 작성자에게 (글 단위 병합)
--    메시지 알림과 kind 가 다르므로 notifications 에 별도 행으로 유지된다.
-- ------------------------------------------------------------
create or replace function public.fn_notify_comment()
returns trigger as $$
declare
  post_author uuid;
  actor uuid;
begin
  select author_id into post_author
    from public.board_posts where id = NEW.post_id;

  if post_author is null or post_author = NEW.author_id then
    return NEW;
  end if;

  -- 익명 댓글은 last_actor_id 노출하지 않음 (피드백 게시판 익명 보호)
  actor := case when NEW.is_anonymous then null else NEW.author_id end;

  insert into public.notifications
    (user_id, kind, post_id, last_actor_id, preview, unread_count, updated_at)
  values
    (post_author, 'comment', NEW.post_id, actor,
     left(NEW.body, 80), 1, now())
  on conflict (user_id, post_id, kind) do update set
    last_actor_id = actor,
    preview       = left(NEW.body, 80),
    unread_count  = case when notifications.read_at is not null
                         then 1
                         else notifications.unread_count + 1
                    end,
    read_at       = null,
    updated_at    = now();
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists board_comments_notify on public.board_comments;
create trigger board_comments_notify
  after insert on public.board_comments
  for each row execute function public.fn_notify_comment();

-- ------------------------------------------------------------
-- 8) 완료 + 3일 지난 근무 교환 게시글 자동 삭제
--    규칙 : 완료 시각으로부터 72시간이 지난 게시글을 제거.
--    board_messages / board_comments / board_post_teams 등은 FK cascade 로 같이 정리됨.
-- ------------------------------------------------------------
create or replace function public.purge_completed_swap_posts()
returns void as $$
begin
  delete from public.board_posts p
  using public.boards b
  where p.board_id = b.id
    and b.slug = 'shift-swap'
    and p.swap_status = 'done'
    and p.completed_at is not null
    and p.completed_at <= now() - interval '3 days';
end;
$$ language plpgsql security definer;

-- 매일 KST 00:05 실행 (UTC 로 전일 15:05)
do $$
begin
  perform cron.unschedule('purge-completed-swap-messages');
exception when others then
  null;
end $$;

do $$
begin
  perform cron.unschedule('purge-completed-swap-posts');
exception when others then
  null;
end $$;

select cron.schedule(
  'purge-completed-swap-posts',
  '5 15 * * *',
  $$select public.purge_completed_swap_posts();$$
);

-- ------------------------------------------------------------
-- 9) 시프트 교환 게시판 seed
-- ------------------------------------------------------------
insert into public.boards
  (slug, name, description, write_role, allow_comments, allow_anonymous,
   has_status, kind, team_scoped, sort_order)
values
  ('shift-swap', '시프트 교환', '팀원과 시프트를 바꾸고 싶을 때 사용하는 게시판',
   'member', false, false, false, 'chat', true, 40)
on conflict (slug) do update set
  name            = excluded.name,
  description     = excluded.description,
  write_role      = excluded.write_role,
  allow_comments  = excluded.allow_comments,
  allow_anonymous = excluded.allow_anonymous,
  has_status      = excluded.has_status,
  kind            = excluded.kind,
  team_scoped     = excluded.team_scoped,
  sort_order      = excluded.sort_order;
