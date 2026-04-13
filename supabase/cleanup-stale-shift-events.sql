-- ============================================================
-- Seon Lab — Cleanup stale shift events for one user/day
-- Supabase Dashboard → SQL Editor → New query → 붙여넣기 → Run
-- 날짜별로 여러 시프트가 남았을 때 가장 최근 created_at 1건만 남기고 삭제
-- ============================================================

-- 1) 삭제될 후보 먼저 확인
with ranked_events as (
  select
    e.id,
    e.user_id,
    e.uid,
    e.summary,
    e.start_at,
    e.end_at,
    e.created_at,
    row_number() over (
      partition by e.user_id, (e.start_at at time zone 'Asia/Seoul')::date
      order by e.created_at desc, e.start_at desc, e.id desc
    ) as rn
  from public.events e
  where e.user_id = 'YOUR_USER_ID'
    and (e.start_at at time zone 'Asia/Seoul')::date = date '2026-04-14'
)
select *
from ranked_events
order by start_at asc;


-- 2) 실제 삭제
with ranked_events as (
  select
    e.id,
    row_number() over (
      partition by e.user_id, (e.start_at at time zone 'Asia/Seoul')::date
      order by e.created_at desc, e.start_at desc, e.id desc
    ) as rn
  from public.events e
  where e.user_id = 'YOUR_USER_ID'
    and (e.start_at at time zone 'Asia/Seoul')::date = date '2026-04-14'
)
delete from public.events
where id in (
  select id
  from ranked_events
  where rn > 1
);
