-- "패치 노트" → "패치노트" 로 이름 변경 (띄어쓰기 제거).
-- Supabase SQL Editor 에서 한 번 실행.
update public.boards
   set name = '패치노트'
 where slug = 'patch-notes'
   and name <> '패치노트';
