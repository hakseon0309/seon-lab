-- ============================================================
-- SEON LAB — onboarding + team schedule sharing
-- Supabase Dashboard → SQL Editor → New query → 붙여넣고 Run
-- Idempotent: 여러 번 실행해도 안전합니다.
-- ============================================================

alter table public.user_profiles
  add column if not exists onboarding_completed_at timestamptz;

-- 기존 사용자는 갑자기 온보딩 화면으로 밀려나지 않도록 완료 처리한다.
update public.user_profiles
   set onboarding_completed_at = coalesce(onboarding_completed_at, now());

alter table public.team_members
  add column if not exists share_schedule boolean not null default true;

-- 본인의 팀별 일정 공유 여부를 직접 바꿀 수 있게 한다.
drop policy if exists "Users can update own team membership settings"
  on public.team_members;
create policy "Users can update own team membership settings"
  on public.team_members for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 팀원 일정 조회는 상대가 해당 팀에서 공유를 켠 경우에만 허용한다.
drop policy if exists "Users can view team member events" on public.events;
create policy "Users can view shared team member events"
  on public.events for select
  using (
    user_id in (
      select target.user_id
      from public.team_members viewer
      join public.team_members target on target.team_id = viewer.team_id
      where viewer.user_id = auth.uid()
        and target.share_schedule = true
    )
  );

-- 고정 회사팀을 온보딩에서 선택할 수 있게, 이미 존재하는 팀은 회사팀으로 표시한다.
update public.teams
   set is_corp_team = true
 where upper(name) in ('ALL', 'PZ', 'GB', 'OPS', 'TAA');
