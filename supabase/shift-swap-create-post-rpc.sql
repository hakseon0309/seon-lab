-- ============================================================
-- Seon Lab — Atomic shift-swap post creation
-- 글 1개 + 다중 팀 타깃을 하나의 DB 트랜잭션으로 생성
-- ============================================================

create or replace function public.create_shift_swap_post(
  p_title text,
  p_body text,
  p_team_ids uuid[],
  p_swap_date date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_board_id uuid;
  v_primary_team_id uuid;
  v_post_id uuid;
  v_team_ids uuid[];
begin
  if v_user_id is null then
    raise exception '로그인이 필요합니다';
  end if;

  select array_agg(distinct team_id), min(team_id)
    into v_team_ids, v_primary_team_id
  from unnest(coalesce(p_team_ids, '{}')) as input(team_id)
  where team_id is not null;

  if coalesce(array_length(v_team_ids, 1), 0) = 0 then
    raise exception '팀을 하나 이상 선택해주세요';
  end if;

  if exists (
    select 1
    from unnest(v_team_ids) as input(team_id)
    where not exists (
      select 1
      from public.team_members tm
      where tm.team_id = input.team_id
        and tm.user_id = v_user_id
    )
  ) then
    raise exception '내가 속한 팀에만 올릴 수 있어요';
  end if;

  select id
    into v_board_id
  from public.boards
  where slug = 'shift-swap'
  limit 1;

  if v_board_id is null then
    raise exception '게시판을 찾을 수 없습니다';
  end if;

  insert into public.board_posts (
    board_id,
    author_id,
    is_anonymous,
    title,
    body,
    team_id,
    swap_date,
    swap_status
  )
  values (
    v_board_id,
    v_user_id,
    false,
    p_title,
    p_body,
    v_primary_team_id,
    p_swap_date,
    'open'
  )
  returning id into v_post_id;

  insert into public.board_post_teams (post_id, team_id)
  select v_post_id, input.team_id
  from unnest(v_team_ids) as input(team_id);

  return v_post_id;
end;
$$;

grant execute
  on function public.create_shift_swap_post(text, text, uuid[], date)
  to authenticated;
