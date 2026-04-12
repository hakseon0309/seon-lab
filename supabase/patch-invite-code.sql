-- ============================================================
-- 초대 코드를 6자리 영문+숫자로 변경하는 패치
-- 기존 스키마 실행 후 이 파일만 실행하세요
-- ============================================================

-- 6자리 랜덤 영문+숫자 코드 생성 함수
create or replace function public.generate_invite_code()
returns text as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$ language plpgsql;

-- teams 테이블의 invite_code 기본값 변경
alter table public.teams
  alter column invite_code set default public.generate_invite_code();
