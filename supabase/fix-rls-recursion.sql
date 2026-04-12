-- ============================================================
-- RLS 무한 재귀 수정 패치
-- 기존 스키마를 이미 실행한 경우 이 파일만 실행하세요
-- ============================================================

-- 1. 재귀를 유발하는 기존 정책 모두 삭제
drop policy if exists "Team members can view fellow members"      on public.team_members;
drop policy if exists "Team members can view each others profiles" on public.user_profiles;
drop policy if exists "Users can view team member events"         on public.events;
drop policy if exists "Team members can view their teams"         on public.teams;

-- 2. team_members 조회를 RLS 없이 실행하는 helper 함수 생성
--    security definer = 함수 실행 시 RLS를 우회 (무한 재귀 방지)
create or replace function public.get_my_team_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select team_id from public.team_members where user_id = auth.uid();
$$;

-- 3. 정책 재등록 (helper 함수 사용)

-- team_members: 같은 팀 멤버 목록 조회
create policy "Team members can view fellow members"
  on public.team_members for select
  using (
    team_id in (select public.get_my_team_ids())
  );

-- user_profiles: 팀원 프로필 조회
create policy "Team members can view each others profiles"
  on public.user_profiles for select
  using (
    id in (
      select tm.user_id
      from public.team_members tm
      where tm.team_id in (select public.get_my_team_ids())
    )
  );

-- events: 팀원 이벤트 조회
create policy "Users can view team member events"
  on public.events for select
  using (
    user_id in (
      select tm.user_id
      from public.team_members tm
      where tm.team_id in (select public.get_my_team_ids())
    )
  );

-- teams: 내가 속한 팀 조회
create policy "Team members can view their teams"
  on public.teams for select
  using (
    id in (select public.get_my_team_ids())
  );
