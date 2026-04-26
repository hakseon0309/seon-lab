-- ============================================================
-- Seon Lab — 시프트 교환 글 다중 팀 노출
-- 글 1개를 여러 팀에 동시에 노출하기 위한 매핑 테이블과 정책
-- ============================================================

create table if not exists public.board_post_teams (
  post_id uuid not null references public.board_posts(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, team_id)
);

create index if not exists board_post_teams_team_idx
  on public.board_post_teams (team_id, post_id);

create index if not exists board_post_teams_post_idx
  on public.board_post_teams (post_id, team_id);

alter table public.board_post_teams enable row level security;

insert into public.board_post_teams (post_id, team_id)
select id, team_id
from public.board_posts
where team_id is not null
on conflict (post_id, team_id) do nothing;

drop policy if exists "post_teams_select_visible" on public.board_post_teams;
create policy "post_teams_select_visible"
  on public.board_post_teams for select using (
    exists (
      select 1
      from public.board_posts p
      where p.id = board_post_teams.post_id
        and (
          p.author_id = auth.uid()
          or exists (
            select 1
            from public.team_members tm
            where tm.team_id = board_post_teams.team_id
              and tm.user_id = auth.uid()
          )
          or public.current_role_level() = 3
        )
    )
  );

drop policy if exists "post_teams_insert_author_member" on public.board_post_teams;
create policy "post_teams_insert_author_member"
  on public.board_post_teams for insert with check (
    exists (
      select 1
      from public.board_posts p
      where p.id = board_post_teams.post_id
        and p.author_id = auth.uid()
    )
    and exists (
      select 1
      from public.team_members tm
      where tm.team_id = board_post_teams.team_id
        and tm.user_id = auth.uid()
    )
  );

drop policy if exists "post_teams_delete_author_admin" on public.board_post_teams;
create policy "post_teams_delete_author_admin"
  on public.board_post_teams for delete using (
    exists (
      select 1
      from public.board_posts p
      where p.id = board_post_teams.post_id
        and (p.author_id = auth.uid() or public.current_role_level() = 3)
    )
  );

drop policy if exists "posts_select_visible" on public.board_posts;
create policy "posts_select_visible"
  on public.board_posts for select using (
    team_id is null
    or author_id = auth.uid()
    or exists (
      select 1
      from public.board_post_teams bpt
      join public.team_members tm on tm.team_id = bpt.team_id
      where bpt.post_id = board_posts.id
        and tm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = board_posts.team_id
        and tm.user_id = auth.uid()
    )
    or public.current_role_level() = 3
  );

drop policy if exists "messages_read_by_team" on public.board_messages;
create policy "messages_read_by_team"
  on public.board_messages for select using (
    exists (
      select 1
      from public.board_posts p
      where p.id = post_id
        and (
          p.author_id = auth.uid()
          or exists (
            select 1
            from public.board_post_teams bpt
            join public.team_members tm on tm.team_id = bpt.team_id
            where bpt.post_id = p.id
              and tm.user_id = auth.uid()
          )
          or exists (
            select 1
            from public.team_members tm
            where tm.team_id = p.team_id
              and tm.user_id = auth.uid()
          )
          or public.current_role_level() = 3
        )
    )
  );

drop policy if exists "messages_insert_by_team" on public.board_messages;
create policy "messages_insert_by_team"
  on public.board_messages for insert with check (
    author_id = auth.uid()
    and exists (
      select 1
      from public.board_posts p
      where p.id = post_id
        and coalesce(p.swap_status, 'open') = 'open'
        and (
          p.author_id = auth.uid()
          or exists (
            select 1
            from public.board_post_teams bpt
            join public.team_members tm on tm.team_id = bpt.team_id
            where bpt.post_id = p.id
              and tm.user_id = auth.uid()
          )
          or exists (
            select 1
            from public.team_members tm
            where tm.team_id = p.team_id
              and tm.user_id = auth.uid()
          )
        )
    )
  );
